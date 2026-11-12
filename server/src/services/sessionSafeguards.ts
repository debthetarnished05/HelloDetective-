const MAX_SUSPECT_CHAT_MESSAGES = 100;
const MAX_OFFICER_CHAT_MESSAGES = 100;
const MAX_RECORDED_CLUES = 200;
const MAX_REVEALED_FACTS_PER_SUSPECT = 100;

function keepRecent<T>(items: T[] | undefined, maximum: number): boolean {
  if (!Array.isArray(items) || items.length <= maximum) return false;
  items.splice(0, items.length - maximum);
  return true;
}

export function trimSessionHistories(session: any): boolean {
  let changed = keepRecent(session.officerChatHistory, MAX_OFFICER_CHAT_MESSAGES);
  changed = keepRecent(session.recordedClues, MAX_RECORDED_CLUES) || changed;

  const suspects = session.suspects;
  const states: any[] = suspects && typeof suspects.values === 'function'
    ? [...suspects.values()]
    : Object.values(suspects || {});

  for (const state of states) {
    changed = keepRecent(state?.chatHistory, MAX_SUSPECT_CHAT_MESSAGES) || changed;
    changed = keepRecent(state?.revealedFacts, MAX_REVEALED_FACTS_PER_SUSPECT) || changed;
  }

  return changed;
}

export function isSessionVersionConflict(error: unknown): boolean {
  return Boolean(error && typeof error === 'object' && (error as { name?: string }).name === 'VersionError');
}
