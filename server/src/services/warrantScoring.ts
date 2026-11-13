import type { IGroundTruth, IRecordedClue, IStory } from '../types/index.js';
import { createHash } from 'node:crypto';

export interface IWarrantSubmission {
  suspect: string | string[];
  motive: string;
  weapon: string;
  keyContradiction: string;
}

export interface IWarrantCriteria {
  suspect: boolean;
  motive: boolean;
  weapon: boolean;
  contradiction: boolean;
}

export interface IWarrantScore {
  outcome: 'perfect' | 'wrong_suspect' | 'weak_case';
  score: number;
  verdictTitle: string;
  criteria: IWarrantCriteria;
}

export function warrantProgressFingerprint(session: any): string {
  const suspectStates: [string, any][] = session.suspects && typeof session.suspects.entries === 'function'
    ? Array.from(session.suspects.entries())
    : Object.entries(session.suspects || {}) as [string, any][];
  const progress = {
    evidence: [...(session.unlockedEvidence || [])].sort(),
    locations: [...(session.unlockedLocations || [])].sort(),
    canvassedLocations: [...(session.canvassedLocations || [])].sort(),
    suspects: [...(session.unlockedSuspects || [])].sort(),
    recordedClues: (session.recordedClues || []).map((clue: IRecordedClue) => clue.id).sort(),
    revealedFacts: suspectStates.flatMap(([id, state]) =>
      (state.revealedFacts || []).map((fact: string) => id + ':' + fact)
    ).sort()
  };
  return createHash('sha256').update(JSON.stringify(progress)).digest('hex');
}

const STOP_WORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'by', 'for', 'from', 'in', 'into',
  'of', 'on', 'or', 'the', 'to', 'was', 'were', 'with', 'vs', 'versus'
]);

function tokens(value: string): Set<string> {
  return new Set(
    value
      .normalize('NFKD')
      .toLowerCase()
      .replace(/\bcover[-\s]+up\b/g, 'coverup')
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/[^\p{L}\p{N}]+/gu, ' ')
      .split(/\s+/)
      .filter(token => token.length > 1 && !STOP_WORDS.has(token))
      .map(token => {
        if (token === 'stolen' || token === 'stealing') return 'steal';
        if (token.endsWith('ies') && token.length > 5) return `${token.slice(0, -3)}y`;
        if (token.endsWith('ment') && token.length > 7) return token.slice(0, -4);
        if (token.endsWith('ing') && token.length > 6) {
          const stem = token.slice(0, -3);
          return stem.length > 2 && stem.at(-1) === stem.at(-2) ? stem.slice(0, -1) : stem;
        }
        if (token.endsWith('ed') && token.length > 4) return token.slice(0, -2);
        if (token.endsWith('s') && token.length > 4) return token.slice(0, -1);
        return token;
      })
  );
}

function matchesText(expected: string, submitted: string, minExpectedCoverage = 0.6): boolean {
  const expectedTokens = tokens(expected);
  const submittedTokens = tokens(submitted);
  if (!expectedTokens.size || !submittedTokens.size) return false;

  const sharedCount = [...expectedTokens].filter(token => submittedTokens.has(token)).length;
  return sharedCount / expectedTokens.size >= minExpectedCoverage;
}

function resolveContradictionText(
  story: IStory,
  contradiction: string,
  recordedClues: Pick<IRecordedClue, 'id' | 'statement'>[]
): string {
  const evidence = story.evidence.find(item => item.id === contradiction);
  if (evidence) return `${evidence.id} ${evidence.title} ${evidence.subtitle} ${evidence.details}`;

  const clue = recordedClues.find(item => item.id === contradiction || item.statement === contradiction);
  return clue?.statement || '';
}

export function scoreWarrant(
  warrant: IWarrantSubmission,
  groundTruth: IGroundTruth,
  story: IStory,
  recordedClues: Pick<IRecordedClue, 'id' | 'statement'>[] = []
): IWarrantScore {
  const killerIds = [...new Set((groundTruth.killer || '').split(',').map(id => id.trim()).filter(Boolean))];
  const accusedIds = [...new Set((Array.isArray(warrant.suspect) ? warrant.suspect : warrant.suspect.split(','))
    .map(id => id.trim()).filter(Boolean))];
  const truthContradiction = resolveContradictionText(story, groundTruth.keyContradiction || '', recordedClues);
  const exactGroundTruthEvidence = story.evidence.some(item => item.id === groundTruth.keyContradiction);
  const submittedEvidence = story.evidence.some(item => item.id === warrant.keyContradiction);
  const submittedClue = recordedClues.find(item => item.id === warrant.keyContradiction);
  const contradictionMatches =
    (exactGroundTruthEvidence && submittedEvidence && warrant.keyContradiction === groundTruth.keyContradiction) ||
    (exactGroundTruthEvidence && submittedClue !== undefined &&
      matchesText(truthContradiction, submittedClue.statement, 0.65));

  const criteria: IWarrantCriteria = {
    suspect: accusedIds.length === killerIds.length && killerIds.every(id => accusedIds.includes(id)),
    motive: matchesText(groundTruth.motive || '', warrant.motive || ''),
    weapon: Boolean(groundTruth.weapon) && warrant.weapon === groundTruth.weapon,
    contradiction: contradictionMatches
  };

  const rawScore = (criteria.suspect ? 40 : 0) +
    (criteria.motive ? 20 : 0) +
    (criteria.weapon ? 20 : 0) +
    (criteria.contradiction ? 20 : 0);
  const score = criteria.suspect ? rawScore : Math.min(rawScore, 35);
  const allCriteriaMet = Object.values(criteria).every(Boolean);

  if (!criteria.suspect) {
    return { outcome: 'wrong_suspect', score, verdictTitle: 'WRONGFUL ARREST - KILLER AT LARGE', criteria };
  }
  if (allCriteriaMet) {
    return { outcome: 'perfect', score: 100, verdictTitle: 'GUILTY BEYOND REASONABLE DOUBT', criteria };
  }
  return { outcome: 'weak_case', score, verdictTitle: 'ACQUITTED ON REASONABLE DOUBT', criteria };
}
