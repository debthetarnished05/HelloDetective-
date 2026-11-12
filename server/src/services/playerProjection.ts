export function toPlayerSession(session: any): Record<string, unknown> {
  const unlockedSuspects = session.unlockedSuspects || [];
  const states: Record<string, unknown> = {};
  const storedStates = session.suspects as Map<string, any> | Record<string, any> | undefined;
  const suspectStates: Array<[string, any]> = storedStates instanceof Map
    ? Array.from(storedStates.entries())
    : Object.entries(storedStates || {});

  for (const [id, state] of suspectStates) {
    if (unlockedSuspects.includes(id)) states[id] = state;
  }

  return {
    _id: session._id,
    storyId: session.storyId,
    isGuest: session.isGuest,
    leadDetectiveName: session.leadDetectiveName,
    currentStage: session.currentStage,
    unlockedEvidence: session.unlockedEvidence || [],
    unlockedLocations: session.unlockedLocations || [],
    canvassedLocations: session.canvassedLocations || [],
    unlockedSuspects,
    caseClosingTriggered: session.caseClosingTriggered,
    remainingClosingQuestions: session.remainingClosingQuestions,
    interrogationLocked: session.interrogationLocked,
    closingNotificationSent: session.closingNotificationSent,
    suspects: states,
    officerChatHistory: session.officerChatHistory || [],
    notes: session.notes || '',
    recordedClues: session.recordedClues || [],
    status: session.status,
    verdict: session.status === 'solved' ? session.verdict : undefined
  };
}

export function toPlayerStory(story: any, session?: any, includeSolution = false): any {
  const result = story.toObject ? story.toObject() : JSON.parse(JSON.stringify(story));
  if (!includeSolution) {
    delete result.groundTruth;
    delete result.archetype;
    delete result.trope;
    delete result.stages;
  }

  if (!session) {
    result.locations = [];
    result.evidence = [];
    result.suspects = [];
    return result;
  }

  const unlockedEvidence = new Set(session.unlockedEvidence || []);
  const unlockedLocations = new Set(session.unlockedLocations || []);
  const canvassedLocations = new Set(session.canvassedLocations || []);
  const unlockedSuspects = new Set(session.unlockedSuspects || []);

  result.locations = (result.locations || [])
    .filter((location: any) => unlockedLocations.has(location.id))
    .map((location: any) => {
      if (!canvassedLocations.has(location.id)) {
        delete location.canvassReport;
        delete location.hiddenEvidenceIds;
      }
      return location;
    });
  result.evidence = (result.evidence || []).filter((evidence: any) => unlockedEvidence.has(evidence.id));
  result.evidence = result.evidence.map((evidence: any) => {
    delete evidence.isMurderWeapon;
    delete evidence.allowSubpoena;
    delete evidence.subpoenaSource;
    delete evidence.locationId;
    delete evidence.discoveryType;
    return evidence;
  });
  result.suspects = (result.suspects || [])
    .filter((suspect: any) => unlockedSuspects.has(suspect.id))
    .map((suspect: any) => {
      delete suspect.privateKnowledge;
      delete suspect.secrets;
      delete suspect.evidenceReactions;
      delete suspect.dynamicUnlocks;
      delete suspect.isPrimeSuspect;
      delete suspect.category;
      delete suspect.motive;
      return suspect;
    });

  if (!includeSolution) delete result.groundTruth;
  return result;
}
