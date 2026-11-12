import assert from 'node:assert/strict';
import test from 'node:test';
import type { IStory } from '../types/index.js';
import { scoreWarrant } from './warrantScoring.js';
import { validateGeneratedStory } from './storyValidation.js';

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
      { id: 'office', title: 'Office', subtitle: 'North wing', status: 'Lead', lastVisited: 'Pending', witnesses: 'None', notes: '', isInitiallyUnlocked: false, hiddenEvidenceIds: ['ledger'] },
      { id: 'dock', title: 'Dock', subtitle: 'Rear entrance', status: 'Lead', lastVisited: 'Pending', witnesses: 'None', notes: '', isInitiallyUnlocked: false, hiddenEvidenceIds: ['shoeprint'] }
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
      { id: 'dealer', name: 'Eli Frost', role: 'Dealer', trait: 'Smooth', initialTrust: 50, initialStress: 5, alibi: 'At dinner', motive: 'Profit', privateKnowledge: 'Knows the victim', secrets: [], breakdownThreshold: 90, isInitiallyUnlocked: false }
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

test('matches a decisive evidence item to a descriptive contradiction phrase', () => {
  const story = validGeneratedStory();
  story.groundTruth.keyContradiction = 'coffee_shop_alibi_vs_parkade_log';
  story.evidence.find(item => item.id === 'keycard')!.title = 'Parkade Security Log';
  const result = scoreWarrant({ ...correctWarrant, keyContradiction: 'keycard' }, story.groundTruth, story);
  assert.equal(result.criteria.contradiction, true);
});

test('accepts a generated story with valid counts, unlocks, and solution references', () => {
  assert.doesNotThrow(() => validateGeneratedStory(validGeneratedStory()));
});

test('rejects a generated story whose weapon reference does not resolve', () => {
  const story = validGeneratedStory();
  story.groundTruth.weapon = 'missing_weapon';
  assert.throws(() => validateGeneratedStory(story), /weapon must reference an existing evidence ID/);
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
