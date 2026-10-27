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

export interface ILocationItem {
  id: string;
  title: string;
  subtitle: string;
  status: string;
  lastVisited: string;
  witnesses: string;
  notes: string;
  unlockStage: number;
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
  unlockStage: number;
  imageUrl?: string;
}

export interface ISuspectItem {
  id: string;
  name: string;
  role: string;
  trait: string;
  initialTrust: number;
  initialStress: number;
  alibi: string;
  motive: string;
  privateKnowledge: string;
  secrets: string[];
  breakdownThreshold: number;
  evidenceReactions?: Record<string, string>;
  avatarUrl?: string;
  isPrimeSuspect?: boolean;
  category?: 'prime_suspect' | 'person_of_interest' | 'witness';
}

export interface IStageDefinition {
  stage: number;
  title: string;
  description: string;
  gateRules: string;
  unlockEvidenceIds: string[];
  unlockLocationIds: string[];
}

export interface IGroundTruth {
  killer: string;
  motive: string;
  weapon: string;
  keyContradiction: string;
  timelineSummary: string;
}

export interface IStory {
  _id?: string;
  title: string;
  caseNumber: string;
  leadDetective: string;
  status: string;
  victimProfile: IVictimProfile;
  briefing: IBriefing;
  objectives: IObjectives;
  locations: ILocationItem[];
  evidence: IEvidenceItem[];
  suspects: ISuspectItem[];
  stages: IStageDefinition[];
  groundTruth: IGroundTruth;
  isDefault?: boolean;
}

export interface IChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string | Date;
  attachedEvidence?: string | null;
}

export interface ISuspectRuntimeState {
  suspectId: string;
  trustScore: number;
  stressLevel: number;
  mood: 'composed' | 'defensive' | 'nervous' | 'broken_down';
  revealedFacts: string[];
  chatHistory: IChatMessage[];
}

export interface IOfficerChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string | Date;
  isApproved?: boolean;
}

export interface IRecordedClue {
  id: string;
  suspectId: string;
  suspectName: string;
  statement: string;
  timestamp: string | Date;
}
