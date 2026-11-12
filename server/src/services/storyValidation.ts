import type { IStory } from '../types/index.js';

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

export function validateGeneratedStory(story: IStory): void {
  if (!story || typeof story.title !== 'string' || !story.title.trim()) {
    throw new Error('Generated case must include a title.');
  }
  const locationIds = requireUniqueIds(story.locations, 'locations');
  const evidenceIds = requireUniqueIds(story.evidence, 'evidence items');
  const suspectIds = requireUniqueIds(story.suspects, 'suspects');

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
