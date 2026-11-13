export interface IVictimProfile {
  name: string;
  age: number;
  occupation: string;
  discovered: string;
  causeOfDeath: string;
  timeOfDeath: string;
}

export interface IBriefing {
  initialBriefing: string;
  detectiveInsights: string;
}

export interface IObjectives {
  progress: string[];
  currentObjectives: string[];
}

export type SuspectPersonality = 'confident' | 'nervous' | 'cunning' | 'aggressive' | 'defensive';

export interface IDynamicUnlockRule {
  type: 'evidence' | 'location' | 'character';
  targetId: string;
  triggerStress?: number;
  triggerEvidenceId?: string;
  revealDialogue?: string;
  revealed?: boolean;
}

export interface ILeadSource {
  type: 'suspect_clue' | 'evidence_mention' | 'location_mention';
  sourceName?: string;
  sourceId?: string;
  description?: string;
}

export interface ILocationItem {
  id: string;
  title: string;
  subtitle: string;
  status: string;
  lastVisited: string;
  witnesses: string;
  notes: string;
  unlockStage?: number;
  isInitiallyUnlocked?: boolean;
  leadSource?: ILeadSource;
  hiddenEvidenceIds?: string[];
  canvassReport?: string;
  imageUrl?: string;
}

export interface IEvidenceItem {
  id: string;
  title: string;
  subtitle: string;
  details: string;
  date: string;
  location: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  unlockStage?: number;
  isInitiallyUnlocked?: boolean;
  discoveryType?: 'initial' | 'location_canvass' | 'officer_subpoena';
  isMurderWeapon?: boolean;
  allowSubpoena?: boolean;
  subpoenaSource?: string;
  locationId?: string;
  imageUrl?: string;
}

export interface ISuspectItem {
  id: string;
  name: string;
  role: string;
  trait: string;
  personality?: SuspectPersonality;
  isInitiallyUnlocked?: boolean;
  leadSource?: ILeadSource;
  dynamicUnlocks?: IDynamicUnlockRule[];
  initialTrust: number; // 0 - 100
  initialStress: number; // 0 - 100
  alibi: string;
  motive: string;
  privateKnowledge: string; // The private facts they know
  secrets: string[]; // Confessions unlocked when stress >= breakdownThreshold or confronted
  breakdownThreshold: number; // e.g., 90
  evidenceReactions?: Record<string, string>; // Special reactions to specific evidence IDs
  avatarUrl?: string;
  isPrimeSuspect?: boolean;
  category?: 'prime_suspect' | 'person_of_interest' | 'witness' | 'secondary_suspect';
}

export interface IStageDefinition {
  stage: number;
  title: string;
  description: string;
  gateRules: string;
  unlockEvidenceIds: string[];
  unlockLocationIds: string[];
}

export type MysteryArchetype =
  | 'classic_procedural'
  | 'multi_crime_convergence'
  | 'deliberate_frame_job'
  | 'cause_of_death_twist'
  | 'false_confession'
  | 'non_linear_web';

export interface IGroundTruth {
  killer: string; // suspectId
  motive: string;
  weapon: string;
  keyContradiction: string;
  timelineSummary: string;
  archetype?: MysteryArchetype;
  fallGuy?: string;
  redHerringCrime?: string;
  trueFatalMechanism?: string;
}

export interface IStory {
  _id?: any;
  title: string;
  caseNumber: string;
  leadDetective: string;
  status: string;
  archetype?: MysteryArchetype;
  trope?: string;
  victimProfile: IVictimProfile;
  briefing: IBriefing;
  objectives: IObjectives;
  locations: ILocationItem[];
  evidence: IEvidenceItem[];
  suspects: ISuspectItem[];
  stages?: IStageDefinition[];
  groundTruth: IGroundTruth;
  isDefault?: boolean;
}

export interface IChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: Date | string;
  attachedEvidence?: string | null;
}

export interface ISuspectRuntimeState {
  suspectId: string;
  trustScore: number; // 0 to 100
  stressLevel: number; // 0 to 100
  mood: 'composed' | 'defensive' | 'nervous' | 'broken_down';
  revealedFacts: string[]; // Revealed Facts Ledger
  chatHistory: IChatMessage[];
}

export interface IOfficerChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isApproved?: boolean;
  attachedClue?: IRecordedClue | null;
  referencedEvidenceId?: string | null;
  referencedLocationId?: string | null;
  unlockedEntity?: {
    type: 'location' | 'character' | 'evidence';
    id: string;
    name: string;
  } | null;
}

export interface IRecordedClue {
  id: string;
  suspectId: string;
  suspectName: string;
  statement: string;
  timestamp: Date;
}

export type LeadBoardLeadType = 'evidence' | 'location' | 'suspect' | 'alibi' | 'statement';

export interface ILeadBoardReference {
  type: LeadBoardLeadType;
  id: string;
}

export interface ILeadBoardCard extends ILeadBoardReference {
  x: number;
  y: number;
}

export type LeadBoardRelationship = 'supports' | 'contradicts' | 'related' | 'uncertain';

export interface ILeadBoardConnection {
  from: ILeadBoardReference;
  to: ILeadBoardReference;
  relationship: LeadBoardRelationship;
  note: string;
}
