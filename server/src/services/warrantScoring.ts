import type { IGroundTruth, IStory } from '../types/index.js';

export interface IWarrantSubmission {
  suspect: string;
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

function resolveContradictionText(story: IStory, contradiction: string): string {
  const evidence = story.evidence.find(item => item.id === contradiction);
  if (evidence) return `${evidence.id} ${evidence.title} ${evidence.subtitle} ${evidence.details}`;

  const clue = (story as IStory & { recordedClues?: Array<{ statement: string }> }).recordedClues
    ?.find(item => item.statement === contradiction);
  return clue?.statement || contradiction;
}

export function scoreWarrant(
  warrant: IWarrantSubmission,
  groundTruth: IGroundTruth,
  story: IStory
): IWarrantScore {
  const killerIds = (groundTruth.killer || '').split(',').map(id => id.trim()).filter(Boolean);
  const truthContradiction = resolveContradictionText(story, groundTruth.keyContradiction || '');
  const submittedContradiction = resolveContradictionText(story, warrant.keyContradiction || '');

  const criteria: IWarrantCriteria = {
    suspect: killerIds.includes(warrant.suspect),
    motive: matchesText(groundTruth.motive || '', warrant.motive || ''),
    weapon: Boolean(groundTruth.weapon) && warrant.weapon === groundTruth.weapon,
    contradiction: warrant.keyContradiction === groundTruth.keyContradiction ||
      matchesText(truthContradiction, submittedContradiction, 0.4)
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
