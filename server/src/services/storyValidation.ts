import type { ILeadSource, IStory } from '../types/index.js';

type LeadSourceKind = 'suspect' | 'evidence' | 'location';

interface LeadSourceReference {
  kind: LeadSourceKind;
  id: string;
}

function requireUniqueIds(items: Array<{ id?: string }> | undefined, label: string): Set<string> {
  if (!Array.isArray(items)) throw new Error(`Generated case must include ${label}.`);
  const ids = new Set<string>();
  for (const item of items) {
    if (!item || typeof item.id !== 'string' || !item.id.trim()) throw new Error(`Every ${label.slice(0, -1)} needs an ID.`);
    if (ids.has(item.id)) throw new Error(`Generated case has duplicate ${label.slice(0, -1)} ID: ${item.id}.`);
    ids.add(item.id);
  }
  return ids;
}

function requireCount(label: string, count: number, minimum: number, maximum: number): void {
  if (count < minimum || count > maximum) {
    throw new Error(`Generated case needs ${minimum}-${maximum} ${label}; received ${count}.`);
  }
}

function getLeadSourceReference(
  source: ILeadSource,
  label: string,
  story: IStory,
  ids: { suspect: Set<string>; evidence: Set<string>; location: Set<string> }
): LeadSourceReference {
  const kindBySourceType: Record<string, LeadSourceKind> = {
    suspect_clue: 'suspect',
    evidence_mention: 'evidence',
    location_mention: 'location'
  };
  const kind = kindBySourceType[source?.type];
  if (!kind) throw new Error(`${label} has an invalid lead source type.`);

  const sourceItems = kind === 'suspect' ? story.suspects : kind === 'evidence' ? story.evidence : story.locations;
  const sourceIds = ids[kind];
  const sourceId = typeof source.sourceId === 'string' ? source.sourceId.trim() : '';
  if (sourceId && sourceIds.has(sourceId)) return { kind, id: sourceId };

  const sourceName = typeof source.sourceName === 'string' ? source.sourceName.trim().toLocaleLowerCase() : '';
  const matchingItems = sourceName
    ? sourceItems.filter(item => item.id.toLocaleLowerCase() === sourceName ||
      ('name' in item && item.name.toLocaleLowerCase() === sourceName) ||
      ('title' in item && item.title.toLocaleLowerCase() === sourceName))
    : [];
  if (matchingItems.length === 1) return { kind, id: matchingItems[0].id };

  throw new Error(`${label} must reference an existing ${kind} by sourceId or exact sourceName.`);
}

function validateProgressionReachability(story: IStory, ids: {
  suspect: Set<string>;
  evidence: Set<string>;
  location: Set<string>;
}): void {
  const reachable: Record<LeadSourceKind, Set<string>> = {
    suspect: new Set(story.suspects.filter(item => item.isInitiallyUnlocked === true).map(item => item.id)),
    evidence: new Set(story.evidence.filter(item => item.isInitiallyUnlocked === true).map(item => item.id)),
    location: new Set(story.locations.filter(item => item.isInitiallyUnlocked === true).map(item => item.id))
  };
  const references = new Map<string, LeadSourceReference>();

  const rememberLeadSource = (
    kind: LeadSourceKind,
    id: string,
    isInitiallyUnlocked: boolean | undefined,
    source: ILeadSource | undefined,
    label: string
  ) => {
    if (!source && !isInitiallyUnlocked) {
      throw new Error(`${label} is locked but has no lead source to unlock it.`);
    }
    if (source) references.set(`${kind}:${id}`, getLeadSourceReference(source, label, story, ids));
  };

  for (const location of story.locations) {
    rememberLeadSource('location', location.id, location.isInitiallyUnlocked, location.leadSource, `Location "${location.id}"`);
  }
  for (const suspect of story.suspects) {
    rememberLeadSource('suspect', suspect.id, suspect.isInitiallyUnlocked, suspect.leadSource, `Suspect "${suspect.id}"`);
  }

  let changed = true;
  while (changed) {
    changed = false;

    for (const location of story.locations) {
      if (reachable.location.has(location.id)) continue;
      const source = references.get(`location:${location.id}`);
      if (source && reachable[source.kind].has(source.id)) {
        reachable.location.add(location.id);
        changed = true;
      }
    }

    for (const suspect of story.suspects) {
      if (reachable.suspect.has(suspect.id)) continue;
      const source = references.get(`suspect:${suspect.id}`);
      if (source && reachable[source.kind].has(source.id)) {
        reachable.suspect.add(suspect.id);
        changed = true;
      }
    }

    for (const evidence of story.evidence) {
      if (reachable.evidence.has(evidence.id)) continue;
      const locationCanBeSearched = story.locations.some(location =>
        reachable.location.has(location.id) && (
          evidence.locationId === location.id || (location.hiddenEvidenceIds || []).includes(evidence.id)
        )
      );
      if (locationCanBeSearched) {
        reachable.evidence.add(evidence.id);
        changed = true;
      }
    }
  }

  const unreachable = [
    ...story.locations.filter(item => !reachable.location.has(item.id)).map(item => `location "${item.title}"`),
    ...story.suspects.filter(item => !reachable.suspect.has(item.id)).map(item => `suspect "${item.name}"`),
    ...story.evidence.filter(item => !reachable.evidence.has(item.id)).map(item => `evidence "${item.title}"`)
  ];
  if (unreachable.length) {
    throw new Error(`Generated case has unreachable leads with no path from the initial discoveries: ${unreachable.join(', ')}.`);
  }
}

export function validateGeneratedStory(story: IStory): void {
  if (!story || typeof story.title !== 'string' || !story.title.trim()) {
    throw new Error('Generated case must include a title.');
  }
  const locationIds = requireUniqueIds(story.locations, 'locations');
  const evidenceIds = requireUniqueIds(story.evidence, 'evidence items');
  const suspectIds = requireUniqueIds(story.suspects, 'suspects');

  const entityIds = { suspect: suspectIds, evidence: evidenceIds, location: locationIds };

  requireCount('locations', story.locations.length, 3, 5);
  requireCount('evidence items', story.evidence.length, 5, 8);
  requireCount('suspects', story.suspects.length, 3, 5);

  const initialLocations = story.locations.filter(item => item.isInitiallyUnlocked).length;
  const initialEvidence = story.evidence.filter(item => item.isInitiallyUnlocked).length;
  const initialSuspects = story.suspects.filter(item => item.isInitiallyUnlocked).length;
  requireCount('initial locations', initialLocations, 1, 2);
  requireCount('initial evidence items', initialEvidence, 1, 2);
  requireCount('initial suspects', initialSuspects, 2, 3);

  for (const location of story.locations) {
    for (const evidenceId of location.hiddenEvidenceIds || []) {
      if (!evidenceIds.has(evidenceId)) throw new Error(`Location "${location.id}" references missing evidence "${evidenceId}".`);
    }
  }
  for (const evidence of story.evidence) {
    if (evidence.locationId && !locationIds.has(evidence.locationId)) {
      throw new Error(`Evidence "${evidence.id}" references missing location "${evidence.locationId}".`);
    }
  }
  for (const suspect of story.suspects) {
    for (const unlock of suspect.dynamicUnlocks || []) {
      const targets = unlock.type === 'character' ? suspectIds : unlock.type === 'location' ? locationIds : evidenceIds;
      if (!targets.has(unlock.targetId)) throw new Error(`Suspect "${suspect.id}" has an unlock rule for missing ${unlock.type} "${unlock.targetId}".`);
      if (unlock.triggerEvidenceId && !evidenceIds.has(unlock.triggerEvidenceId)) {
        throw new Error(`Suspect "${suspect.id}" has an unlock rule for missing evidence "${unlock.triggerEvidenceId}".`);
      }
    }
  }

  validateProgressionReachability(story, entityIds);

  const groundTruth = story.groundTruth;
  if (!groundTruth || typeof groundTruth !== 'object') throw new Error('Generated case is missing its ground truth.');
  if (typeof groundTruth.killer !== 'string') throw new Error('Ground truth must identify one or more killer suspect IDs.');
  const killerIds = groundTruth.killer.split(',').map(id => id.trim()).filter(Boolean);
  if (!killerIds.length || killerIds.some(id => !suspectIds.has(id))) {
    throw new Error('Ground truth must identify one or more existing suspect IDs as the killer.');
  }
  if (typeof groundTruth.motive !== 'string' || !groundTruth.motive.trim()) throw new Error('Ground truth must include a motive.');
  if (typeof groundTruth.weapon !== 'string' || !evidenceIds.has(groundTruth.weapon)) throw new Error('Ground truth weapon must reference an existing evidence ID.');
  if (typeof groundTruth.keyContradiction !== 'string' || !evidenceIds.has(groundTruth.keyContradiction)) {
    throw new Error('Ground truth contradiction must reference an existing evidence ID.');
  }
  if (typeof groundTruth.timelineSummary !== 'string' || !groundTruth.timelineSummary.trim()) throw new Error('Ground truth must include a timeline summary.');
  if (groundTruth.fallGuy && !suspectIds.has(groundTruth.fallGuy)) {
    throw new Error('Ground truth fallGuy must reference an existing suspect ID.');
  }
}
