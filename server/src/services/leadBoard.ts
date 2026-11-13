import type { ILeadBoardCard, ILeadBoardConnection, LeadBoardLeadType, LeadBoardRelationship } from '../types/index.js';

const LEAD_TYPES = new Set<LeadBoardLeadType>(['evidence', 'location', 'suspect', 'alibi', 'statement']);
const RELATIONSHIPS = new Set<LeadBoardRelationship>(['supports', 'contradicts', 'related', 'uncertain']);
export const MAX_LEAD_BOARD_CONNECTIONS = 300;
export const MAX_LEAD_BOARD_CARDS = 200;
export const MAX_LEAD_BOARD_NOTE_LENGTH = 500;
export const MAX_LEAD_BOARD_COORDINATE = 10000;

export interface UnlockedLeadIds {
  evidence: string[];
  locations: string[];
  suspects: string[];
  statements: string[];
}

export type LeadBoardValidationResult =
  | { valid: true; connections: ILeadBoardConnection[] }
  | { valid: false; error: string };

export type LeadBoardStateValidationResult =
  | { valid: true; cards: ILeadBoardCard[]; connections: ILeadBoardConnection[] }
  | { valid: false; error: string };

function referenceKey(reference: { type: string; id: string }): string {
  return JSON.stringify([reference.type, reference.id]);
}

function isReferenceUnlocked(type: LeadBoardLeadType, id: string, unlocked: UnlockedLeadIds): boolean {
  switch (type) {
    case 'evidence': return unlocked.evidence.includes(id);
    case 'location': return unlocked.locations.includes(id);
    case 'suspect':
    case 'alibi': return unlocked.suspects.includes(id);
    case 'statement': return unlocked.statements.includes(id);
  }
}

export function validateLeadBoardConnections(input: unknown, unlocked: UnlockedLeadIds): LeadBoardValidationResult {
  if (!Array.isArray(input)) return { valid: false, error: 'Connections must be a list.' };
  if (input.length > MAX_LEAD_BOARD_CONNECTIONS) {
    return { valid: false, error: `A case board can contain at most ${MAX_LEAD_BOARD_CONNECTIONS} connections.` };
  }

  const seenPairs = new Set<string>();
  const connections: ILeadBoardConnection[] = [];

  for (const raw of input) {
    if (!raw || typeof raw !== 'object') return { valid: false, error: 'A board connection is invalid.' };
    const item = raw as Record<string, unknown>;
    const from = item.from as Record<string, unknown> | undefined;
    const to = item.to as Record<string, unknown> | undefined;
    if (!from || !to || typeof from.type !== 'string' || typeof to.type !== 'string' || typeof from.id !== 'string' || typeof to.id !== 'string') {
      return { valid: false, error: 'Each connection must refer to two leads.' };
    }
    if (!LEAD_TYPES.has(from.type as LeadBoardLeadType) || !LEAD_TYPES.has(to.type as LeadBoardLeadType)) {
      return { valid: false, error: 'A connection refers to an unsupported lead type.' };
    }
    if (!from.id.trim() || !to.id.trim() || from.id.length > 200 || to.id.length > 200) {
      return { valid: false, error: 'A connection contains an invalid lead identifier.' };
    }
    const fromRef = { type: from.type as LeadBoardLeadType, id: from.id };
    const toRef = { type: to.type as LeadBoardLeadType, id: to.id };
    if (referenceKey(fromRef) === referenceKey(toRef)) {
      return { valid: false, error: 'A lead cannot be connected to itself.' };
    }
    if (!isReferenceUnlocked(fromRef.type, fromRef.id, unlocked) || !isReferenceUnlocked(toRef.type, toRef.id, unlocked)) {
      return { valid: false, error: 'Connections can only use leads already unlocked in this case.' };
    }
    if (typeof item.relationship !== 'string' || !RELATIONSHIPS.has(item.relationship as LeadBoardRelationship)) {
      return { valid: false, error: 'Choose a valid relationship for each connection.' };
    }
    if (item.note !== undefined && (typeof item.note !== 'string' || item.note.length > MAX_LEAD_BOARD_NOTE_LENGTH)) {
      return { valid: false, error: `Connection notes must be ${MAX_LEAD_BOARD_NOTE_LENGTH} characters or fewer.` };
    }

    const pair = JSON.stringify([referenceKey(fromRef), referenceKey(toRef)].sort());
    if (seenPairs.has(pair)) return { valid: false, error: 'Each pair of leads can only be connected once.' };
    seenPairs.add(pair);
    connections.push({
      from: fromRef,
      to: toRef,
      relationship: item.relationship as LeadBoardRelationship,
      note: (item.note as string | undefined)?.trim() || ''
    });
  }

  return { valid: true, connections };
}

export function validateLeadBoardState(cardsInput: unknown, connectionsInput: unknown, unlocked: UnlockedLeadIds): LeadBoardStateValidationResult {
  if (!Array.isArray(cardsInput)) return { valid: false, error: 'Board cards must be a list.' };
  if (cardsInput.length > MAX_LEAD_BOARD_CARDS) {
    return { valid: false, error: `A case board can contain at most ${MAX_LEAD_BOARD_CARDS} cards.` };
  }

  const seenCards = new Set<string>();
  const cards: ILeadBoardCard[] = [];
  for (const raw of cardsInput) {
    if (!raw || typeof raw !== 'object') return { valid: false, error: 'A board card is invalid.' };
    const item = raw as Record<string, unknown>;
    if (typeof item.type !== 'string' || !LEAD_TYPES.has(item.type as LeadBoardLeadType) || typeof item.id !== 'string') {
      return { valid: false, error: 'A board card has an unsupported lead reference.' };
    }
    if (!item.id.trim() || item.id.length > 200 || !isReferenceUnlocked(item.type as LeadBoardLeadType, item.id, unlocked)) {
      return { valid: false, error: 'Board cards can only use leads already unlocked in this case.' };
    }
    if (typeof item.x !== 'number' || !Number.isFinite(item.x) || item.x < 0 || item.x > MAX_LEAD_BOARD_COORDINATE ||
        typeof item.y !== 'number' || !Number.isFinite(item.y) || item.y < 0 || item.y > MAX_LEAD_BOARD_COORDINATE) {
      return { valid: false, error: 'A board card position is outside the allowed area.' };
    }
    const key = referenceKey({ type: item.type, id: item.id });
    if (seenCards.has(key)) return { valid: false, error: 'Each unlocked lead can only be placed on the board once.' };
    seenCards.add(key);
    cards.push({ type: item.type as LeadBoardLeadType, id: item.id, x: Math.round(item.x), y: Math.round(item.y) });
  }

  const result = validateLeadBoardConnections(connectionsInput, unlocked);
  if (!result.valid) return result;
  for (const connection of result.connections) {
    if (!seenCards.has(referenceKey(connection.from)) || !seenCards.has(referenceKey(connection.to))) {
      return { valid: false, error: 'Connections must join cards that are on this board.' };
    }
  }

  return { valid: true, cards, connections: result.connections };
}
