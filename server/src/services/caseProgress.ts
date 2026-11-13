interface CaseEntities {
  locations?: Array<{ id: string }>;
  evidence?: Array<{ id: string }>;
  suspects?: Array<{ id: string }>;
}

interface SessionUnlocks {
  unlockedLocations?: string[];
  unlockedEvidence?: string[];
  unlockedSuspects?: string[];
}

export function isReadyToStartClosing(session: SessionUnlocks, story: CaseEntities): boolean {
  const locations = story.locations || [];
  const evidence = story.evidence || [];
  const suspects = story.suspects || [];
  const unlockedLocations = session.unlockedLocations || [];
  const unlockedEvidence = session.unlockedEvidence || [];
  const unlockedSuspects = session.unlockedSuspects || [];

  return locations.length > 0 && evidence.length > 0 && suspects.length > 0 &&
    locations.every(item => unlockedLocations.includes(item.id)) &&
    evidence.every(item => unlockedEvidence.includes(item.id)) &&
    suspects.every(item => unlockedSuspects.includes(item.id));
}
