import type { ILeadBoardConnection, LeadBoardLeadType, LeadBoardRelationship } from '../types/index.js';

const LEAD_TYPES = new Set<LeadBoardLeadType>(['evidence', 'location', 'suspect', 'alibi', 'statement']);
const RELATIONSHIPS = new Set<LeadBoardRelationship>(['supports', 'contradicts', 'related', 'uncertain']);
export const MAX_LEAD_BOARD_CONNECTIONS = 300;
export const MAX_LEAD_BOARD_NOTE_LENGTH = 500;

export interface UnlockedLeadIds {
  evidence: string[];
  locations: string[];
  suspects: string[];
  statements: string[];
}

export type LeadBoardValidationResult =
  | { valid: true; connections: ILeadBoardConnection[] }
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
