import assert from 'node:assert/strict';
import test from 'node:test';
import type { IStory } from '../types/index.js';
import { scoreWarrant, warrantProgressFingerprint } from './warrantScoring.js';
import { LLMService } from './llmService.js';
import { validateGeneratedStory } from './storyValidation.js';
import { isSessionVersionConflict, trimSessionHistories } from './sessionSafeguards.js';
import { canAccessGameSession } from './sessionAuthorization.js';
import { toPlayerSession, toPlayerStory } from './playerProjection.js';
import { createGuestSessionToken, hashGuestSessionToken } from '../utils/guestSession.js';
import GameSession from '../models/GameSession.js';
import Story from '../models/StoryData.js';
import { isReadyToStartClosing } from './caseProgress.js';
import { validateLeadBoardConnections, validateLeadBoardState } from './leadBoard.js';

function validGeneratedStory(): IStory {
  return {
    title: 'The Glass Hour',
    caseNumber: '2026-1001',
    leadDetective: 'Detective Vale',
    status: 'Active Investigation',
    victimProfile: {
      name: 'Mara Voss', age: 42, occupation: 'Curator', discovered: 'At the gallery',
      causeOfDeath: 'Poisoning', timeOfDeath: 'Between 9 and 10 PM'
    },
    briefing: { initialBriefing: 'A curator was found dead.', detectiveInsights: 'The scene was staged.' },
    objectives: { progress: [], currentObjectives: ['Review evidence'] },
    locations: [
      { id: 'gallery', title: 'Gallery', subtitle: 'Main hall', status: 'Crime Scene', lastVisited: 'Tonight', witnesses: 'None', notes: '', isInitiallyUnlocked: true, hiddenEvidenceIds: ['vial'] },
      { id: 'office', title: 'Office', subtitle: 'North wing', status: 'Lead', lastVisited: 'Pending', witnesses: 'None', notes: '', isInitiallyUnlocked: false, hiddenEvidenceIds: ['ledger'], leadSource: { type: 'evidence_mention', sourceName: 'Empty Vial', sourceId: 'vial', description: 'The vial label points to the office records.' } },
      { id: 'dock', title: 'Dock', subtitle: 'Rear entrance', status: 'Lead', lastVisited: 'Pending', witnesses: 'None', notes: '', isInitiallyUnlocked: false, hiddenEvidenceIds: ['shoeprint'], leadSource: { type: 'location_mention', sourceName: 'Office', sourceId: 'office', description: 'The office records direct investigators to the dock.' } }
    ],
    evidence: [
      { id: 'vial', title: 'Empty Vial', subtitle: 'Toxicology', details: 'A trace of toxin remains.', date: 'Tonight', location: 'Gallery', priority: 'Critical', isInitiallyUnlocked: true, locationId: 'gallery' },
      { id: 'ledger', title: 'Altered Ledger', subtitle: 'Financial record', details: 'The victim changed the account entry.', date: 'Tonight', location: 'Office', priority: 'High', isInitiallyUnlocked: false, locationId: 'office' },
      { id: 'shoeprint', title: 'Wet Shoeprint', subtitle: 'Footwear impression', details: 'A rare tread pattern leads outside.', date: 'Tonight', location: 'Dock', priority: 'Medium', isInitiallyUnlocked: false, locationId: 'dock' },
      { id: 'keycard', title: 'Keycard Log', subtitle: 'Access record', details: 'A suspect entered at 9:20 PM.', date: 'Tonight', location: 'Gallery', priority: 'High', isInitiallyUnlocked: false, locationId: 'gallery' },
      { id: 'fiber', title: 'Blue Fiber', subtitle: 'Trace evidence', details: 'A fiber came from a uniform.', date: 'Tonight', location: 'Gallery', priority: 'Low', isInitiallyUnlocked: false, locationId: 'gallery' }
    ],
    suspects: [
      { id: 'curator', name: 'Iris Vale', role: 'Curator', trait: 'Careful', initialTrust: 50, initialStress: 5, alibi: 'At home', motive: 'Inheritance', privateKnowledge: 'Knows the gallery', secrets: [], breakdownThreshold: 90, isInitiallyUnlocked: true },
      { id: 'guard', name: 'Noah Reed', role: 'Guard', trait: 'Quiet', initialTrust: 50, initialStress: 5, alibi: 'On patrol', motive: 'Debt', privateKnowledge: 'Knows the alarm', secrets: [], breakdownThreshold: 90, isInitiallyUnlocked: true },
      { id: 'dealer', name: 'Eli Frost', role: 'Dealer', trait: 'Smooth', initialTrust: 50, initialStress: 5, alibi: 'At dinner', motive: 'Profit', privateKnowledge: 'Knows the victim', secrets: [], breakdownThreshold: 90, isInitiallyUnlocked: false, leadSource: { type: 'suspect_clue', sourceName: 'Iris Vale', sourceId: 'curator', description: 'Iris identifies Eli as having access to the gallery.' } }
    ],
    groundTruth: {
      killer: 'curator', motive: 'stolen_ledger_coverup', weapon: 'vial',
      keyContradiction: 'keycard', timelineSummary: 'Iris used the vial after entering with her keycard.'
    }
  };
}

const correctWarrant = {
  suspect: 'curator', motive: 'stolen ledger coverup', weapon: 'vial', keyContradiction: 'keycard'
};

test('scores a complete correct warrant as a perfect conviction', () => {
  const result = scoreWarrant(correctWarrant, validGeneratedStory().groundTruth, validGeneratedStory());
  assert.equal(result.outcome, 'perfect');
  assert.equal(result.score, 100);
  assert.deepEqual(result.criteria, { suspect: true, motive: true, weapon: true, contradiction: true });
});

test('keeps a correct suspect with incomplete evidence as a weak case', () => {
  const result = scoreWarrant({ ...correctWarrant, weapon: 'fiber' }, validGeneratedStory().groundTruth, validGeneratedStory());
  assert.equal(result.outcome, 'weak_case');
  assert.equal(result.score, 80);
  assert.equal(result.criteria.weapon, false);
});

test('caps an incorrect suspect at 35 even if the other warrant elements match', () => {
  const result = scoreWarrant({ ...correctWarrant, suspect: 'guard' }, validGeneratedStory().groundTruth, validGeneratedStory());
  assert.equal(result.outcome, 'wrong_suspect');
  assert.equal(result.score, 35);
});

test('matches a natural motive explanation to slugged ground-truth terms', () => {
  const story = validGeneratedStory();
  story.groundTruth.motive = 'embezzled_pension_audit';
  const result = scoreWarrant({ ...correctWarrant, motive: 'She hid pension embezzlement after the audit.' }, story.groundTruth, story);
  assert.equal(result.criteria.motive, true);
});

test('scores only the exact configured contradiction evidence item', () => {
  const story = validGeneratedStory();
  story.groundTruth.keyContradiction = 'keycard';
  story.evidence.find(item => item.id === 'keycard')!.title = 'Parkade Security Log';
  const result = scoreWarrant({ ...correctWarrant, keyContradiction: 'keycard' }, story.groundTruth, story);
  assert.equal(result.criteria.contradiction, true);

  const unrelatedEvidence = scoreWarrant(
    { ...correctWarrant, keyContradiction: 'fiber' },
    story.groundTruth,
    story
  );
  assert.equal(unrelatedEvidence.criteria.contradiction, false);
});

test('resolves recorded contradiction clues by their session ID', () => {
  const story = validGeneratedStory();
  const result = scoreWarrant(
    { ...correctWarrant, keyContradiction: 'clue_1' },
    story.groundTruth,
    story,
    [{ id: 'clue_1', statement: 'The access record shows the suspect entered at 9:20 PM, contradicting the alibi.' }]
  );
  assert.equal(result.criteria.contradiction, true);
});

test('a joint-killer warrant must name the complete killer set', () => {
  const story = validGeneratedStory();
  story.groundTruth.killer = 'curator,guard';

  const partial = scoreWarrant({ ...correctWarrant, suspect: 'curator' }, story.groundTruth, story);
  assert.equal(partial.criteria.suspect, false);
  assert.equal(partial.outcome, 'wrong_suspect');

  const complete = scoreWarrant({ ...correctWarrant, suspect: ['curator', 'guard'] }, story.groundTruth, story);
  assert.equal(complete.criteria.suspect, true);
  assert.equal(complete.outcome, 'perfect');
});

test('failed warrant epilogues do not disclose ground-truth names or timeline', async () => {
  const story = validGeneratedStory();
  story.groundTruth.timelineSummary = 'Hidden timeline detail: Iris placed the vial at 9:17 PM.';
  const verdict = scoreWarrant({ ...correctWarrant, suspect: 'guard' }, story.groundTruth, story);
  const epilogue = await LLMService.generateWarrantEpilogue(
    { ...correctWarrant, suspect: 'guard' },
    verdict,
    story
  );

  assert.doesNotMatch(epilogue, /Iris Vale|curator|Hidden timeline detail/i);
  assert.match(epilogue, /investigation remains open/i);
});

test('warrant progress fingerprint changes only when investigation progress changes', () => {
  const session: {
    unlockedEvidence: string[];
    unlockedLocations: string[];
    canvassedLocations: string[];
    unlockedSuspects: string[];
    recordedClues: Array<{ id: string }>;
    suspects: Map<string, { stressLevel: number; revealedFacts: string[] }>;
  } = {
    unlockedEvidence: ['vial'],
    unlockedLocations: ['gallery'],
    canvassedLocations: [],
    unlockedSuspects: ['curator'],
    recordedClues: [],
    suspects: new Map([['curator', { trustScore: 50, stressLevel: 20, revealedFacts: [] }]])
  };
  const initial = warrantProgressFingerprint(session);
  session.suspects.get('curator')!.stressLevel = 70;
  assert.equal(warrantProgressFingerprint(session), initial);

  session.recordedClues.push({ id: 'clue_1' });
  assert.notEqual(warrantProgressFingerprint(session), initial);
});

test('accepts a generated story with valid counts, unlocks, and solution references', () => {
  assert.doesNotThrow(() => validateGeneratedStory(validGeneratedStory()));
});

test('rejects a generated story whose weapon reference does not resolve', () => {
  const story = validGeneratedStory();
  story.groundTruth.weapon = 'missing_weapon';
  assert.throws(() => validateGeneratedStory(story), /weapon must reference an existing evidence ID/);
});

test('rejects generated cases with locked leads that have no unlock source', () => {
  const story = validGeneratedStory();
  delete story.locations[1].leadSource;
  assert.throws(() => validateGeneratedStory(story), /is locked but has no lead source/);
});

test('rejects generated cases whose lead sources form an unreachable cycle', () => {
  const story = validGeneratedStory();
  story.locations[1].leadSource = {
    type: 'location_mention', sourceName: 'Dock', sourceId: 'dock', description: 'The dock points to the office.'
  };
  assert.throws(() => validateGeneratedStory(story), /unreachable leads/);
});

test('rejects duplicate entity IDs and invalid initial unlock counts', () => {
  const duplicate = validGeneratedStory();
  duplicate.suspects[1].id = duplicate.suspects[0].id;
  assert.throws(() => validateGeneratedStory(duplicate), /duplicate suspect ID/);

  const tooManyInitial = validGeneratedStory();
  tooManyInitial.evidence[1].isInitiallyUnlocked = true;
  tooManyInitial.evidence[2].isInitiallyUnlocked = true;
  assert.throws(() => validateGeneratedStory(tooManyInitial), /initial evidence items/);
});

test('trims each saved session history to its most recent entries', () => {
  const session = {
    officerChatHistory: Array.from({ length: 105 }, (_, index) => `officer-${index}`),
    recordedClues: Array.from({ length: 205 }, (_, index) => `clue-${index}`),
    suspects: new Map([['curator', {
      chatHistory: Array.from({ length: 105 }, (_, index) => `chat-${index}`),
      revealedFacts: Array.from({ length: 105 }, (_, index) => `fact-${index}`)
    }]])
  };

  assert.equal(trimSessionHistories(session), true);
  assert.equal(session.officerChatHistory.length, 100);
  assert.equal(session.officerChatHistory[0], 'officer-5');
  assert.equal(session.recordedClues.length, 200);
  assert.equal(session.recordedClues[0], 'clue-5');
  assert.equal(session.suspects.get('curator')?.chatHistory[0], 'chat-5');
  assert.equal(session.suspects.get('curator')?.revealedFacts[0], 'fact-5');
  assert.equal(trimSessionHistories(session), false);
});

test('recognizes Mongoose optimistic concurrency conflicts', () => {
  const conflict = new Error('stale document version');
  conflict.name = 'VersionError';
  assert.equal(isSessionVersionConflict(conflict), true);
  assert.equal(isSessionVersionConflict(new Error('unrelated')), false);
});

test('authorizes only the owning account or the matching guest capability', () => {
  const guestToken = createGuestSessionToken();
  const guestSession = { guestAccessTokenHash: hashGuestSessionToken(guestToken) };
  assert.equal(canAccessGameSession(guestSession, { guestAccessToken: guestToken }), true);
  assert.equal(canAccessGameSession(guestSession, { guestAccessToken: 'wrong-token' }), false);
  assert.equal(canAccessGameSession(guestSession, { userId: 'account-1', guestAccessToken: guestToken }), false);

  const accountSession = { userId: 'account-1', guestAccessTokenHash: undefined };
  assert.equal(canAccessGameSession(accountSession, { userId: 'account-1' }), true);
  assert.equal(canAccessGameSession(accountSession, { userId: 'account-2' }), false);
  assert.equal(canAccessGameSession(accountSession, {}), false);
});

test('projects only unlocked session state and strips story solutions and hidden fields', () => {
  const session = {
    _id: 'session-1',
    storyId: 'story-1',
    unlockedSuspects: ['curator'],
    unlockedEvidence: ['vial'],
    unlockedLocations: ['gallery'],
    canvassedLocations: [],
    leadBoardCards: [{ type: 'evidence', id: 'vial', x: 120, y: 80 }],
    leadBoardConnections: [],
    suspects: new Map([
      ['curator', { trustScore: 55 }],
      ['guard', { trustScore: 15 }]
    ]),
    status: 'active',
    groundTruth: { killer: 'hidden' }
  };
  const playerSession = toPlayerSession(session);
  assert.deepEqual(Object.keys(playerSession.suspects as object), ['curator']);
  assert.deepEqual(playerSession.leadBoardCards, [{ type: 'evidence', id: 'vial', x: 120, y: 80 }]);
  assert.deepEqual(playerSession.leadBoardConnections, []);
  assert.equal('groundTruth' in playerSession, false);

  const story = validGeneratedStory();
  story.archetype = 'classic_procedural';
  story.trope = 'hidden trope';
  story.locations[0].canvassReport = 'Hidden until canvassed';
  story.evidence[0].isMurderWeapon = true;
  story.evidence[0].allowSubpoena = true;
  story.evidence[0].discoveryType = 'initial';
  story.suspects[0].privateKnowledge = 'Hidden suspect knowledge';
  story.suspects[0].secrets = ['Hidden secret'];
  const projected = toPlayerStory(story, {
    unlockedEvidence: ['vial'],
    unlockedLocations: ['gallery'],
    canvassedLocations: [],
    unlockedSuspects: ['curator']
  });

  assert.equal('groundTruth' in projected, false);
  assert.equal('archetype' in projected, false);
  assert.equal(projected.locations.length, 1);
  assert.equal('canvassReport' in projected.locations[0], false);
  assert.equal(projected.evidence.length, 1);
  assert.equal('isMurderWeapon' in projected.evidence[0], false);
  assert.equal('allowSubpoena' in projected.evidence[0], false);
  assert.equal('locationId' in projected.evidence[0], false);
  assert.equal(projected.suspects.length, 1);
  assert.equal('privateKnowledge' in projected.suspects[0], false);
  assert.equal('secrets' in projected.suspects[0], false);
  assert.equal(story.evidence[0].isMurderWeapon, true);
});

test('persists evidence security flags and enables optimistic concurrency on game sessions', () => {
  const data = validGeneratedStory();
  data.evidence[0].isMurderWeapon = true;
  data.evidence[0].allowSubpoena = true;
  const storyDocument = new Story(data);
  assert.equal(storyDocument.evidence[0]?.isMurderWeapon, true);
  assert.equal(storyDocument.evidence[0]?.allowSubpoena, true);
  assert.equal(GameSession.schema.options.optimisticConcurrency, true);
});

test('starts the closing phase only after all locations, evidence, and suspects are unlocked', () => {
  const story = {
    locations: [{ id: 'scene-a' }, { id: 'scene-b' }],
    evidence: [{ id: 'clue-a' }, { id: 'clue-b' }],
    suspects: [{ id: 'suspect-a' }, { id: 'suspect-b' }]
  };
  const complete = {
    unlockedLocations: ['scene-a', 'scene-b'],
    unlockedEvidence: ['clue-a', 'clue-b'],
    unlockedSuspects: ['suspect-a', 'suspect-b']
  };

  assert.equal(isReadyToStartClosing(complete, story), true);
  assert.equal(isReadyToStartClosing({ ...complete, unlockedLocations: ['scene-a'] }, story), false);
  assert.equal(isReadyToStartClosing({ ...complete, unlockedEvidence: ['clue-a'] }, story), false);
  assert.equal(isReadyToStartClosing({ ...complete, unlockedSuspects: ['suspect-a'] }, story), false);
});

test('accepts player-authored links between unlocked leads and keeps only supported board fields', () => {
  const result = validateLeadBoardConnections([{
    from: { type: 'evidence', id: 'parkade-log' },
    to: { type: 'alibi', id: 'marcus' },
    relationship: 'contradicts',
    note: 'The entry time overlaps the café statement.',
    hiddenHint: 'must be discarded'
  }], {
    evidence: ['parkade-log'], locations: [], suspects: ['marcus'], statements: []
  });

  assert.equal(result.valid, true);
  if (result.valid) {
    assert.deepEqual(result.connections, [{
      from: { type: 'evidence', id: 'parkade-log' },
      to: { type: 'alibi', id: 'marcus' },
      relationship: 'contradicts',
      note: 'The entry time overlaps the café statement.'
    }]);
  }
});

test('rejects lead board links to locked leads, invalid labels, duplicate pairs, and oversized notes', () => {
  const unlocked = { evidence: ['log'], locations: ['cafe'], suspects: ['marcus'], statements: ['statement-1'] };
  const makeLink = (from: any, to: any, relationship = 'related', note = '') => ({ from, to, relationship, note });

  assert.equal(validateLeadBoardConnections([makeLink({ type: 'evidence', id: 'locked' }, { type: 'location', id: 'cafe' })], unlocked).valid, false);
  assert.equal(validateLeadBoardConnections([makeLink({ type: 'evidence', id: 'log' }, { type: 'location', id: 'cafe' }, 'solves')], unlocked).valid, false);
  assert.equal(validateLeadBoardConnections([
    makeLink({ type: 'evidence', id: 'log' }, { type: 'location', id: 'cafe' }),
    makeLink({ type: 'location', id: 'cafe' }, { type: 'evidence', id: 'log' }, 'supports')
  ], unlocked).valid, false);
  assert.equal(validateLeadBoardConnections([makeLink({ type: 'evidence', id: 'log' }, { type: 'alibi', id: 'marcus' }, 'related', 'x'.repeat(501))], unlocked).valid, false);
  assert.equal(validateLeadBoardConnections([makeLink({ type: 'statement', id: 'not-recorded' }, { type: 'suspect', id: 'marcus' })], unlocked).valid, false);
});

test('validates placed lead cards and requires each saved connection endpoint to be on the board', () => {
  const unlocked = { evidence: ['log'], locations: ['cafe'], suspects: ['marcus'], statements: ['statement-1'] };
  const cards = [
    { type: 'evidence', id: 'log', x: 23.4, y: 55.7 },
    { type: 'alibi', id: 'marcus', x: 400, y: 200 }
  ];
  const connections = [{
    from: { type: 'evidence', id: 'log' },
    to: { type: 'alibi', id: 'marcus' },
    relationship: 'contradicts',
    note: 'The times overlap.'
  }];
  const result = validateLeadBoardState(cards, connections, unlocked);

  assert.equal(result.valid, true);
  if (result.valid) {
    assert.deepEqual(result.cards[0], { type: 'evidence', id: 'log', x: 23, y: 56 });
    assert.equal(result.connections.length, 1);
  }

  assert.equal(validateLeadBoardState([
    cards[0], { type: 'location', id: 'locked-place', x: 100, y: 100 }
  ], [], unlocked).valid, false);
  assert.equal(validateLeadBoardState([cards[0]], connections, unlocked).valid, false);
  assert.equal(validateLeadBoardState([cards[0], cards[0]], [], unlocked).valid, false);
  assert.equal(validateLeadBoardState([{ type: 'evidence', id: 'log', x: -1, y: 0 }], [], unlocked).valid, false);
});
