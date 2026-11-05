import mongoose, { Schema, Document, Types } from 'mongoose';
import { ISuspectRuntimeState, IChatMessage, IOfficerChatMessage, IRecordedClue } from '../types/index.js';

export interface IGameSession extends Document {
  storyId: Types.ObjectId;
  userId?: Types.ObjectId;
  isGuest: boolean;
  leadDetectiveName: string;
  evidencePresentedCount: number;
  warrantAttemptsCount: number;
  currentStage?: number;
  unlockedEvidence: string[];
  unlockedLocations: string[];
  canvassedLocations: string[];
  unlockedSuspects: string[];
  caseClosingTriggered: boolean;
  remainingClosingQuestions: number;
  interrogationLocked: boolean;
  closingNotificationSent: boolean;
  suspects: Map<string, ISuspectRuntimeState>;
  officerChatHistory: IOfficerChatMessage[];
  notes: string;
  recordedClues: IRecordedClue[];
  groundTruth: Record<string, any>;
  status: 'active' | 'solved';
  verdict?: {
    suspect: string;
    motive: string;
    weapon: string;
    keyContradiction: string;
    outcome: string;
    epilogue: string;
    score: number;
  };
}

const ChatMessageSchema = new Schema({
  role: { type: String, enum: ['user', 'assistant'], required: true },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  attachedEvidence: { type: String, default: null }
}, { _id: false });

const SuspectRuntimeStateSchema = new Schema({
  suspectId: { type: String, required: true },
  trustScore: { type: Number, default: 50 },
  stressLevel: { type: Number, default: 20 },
  mood: { type: String, enum: ['composed', 'defensive', 'nervous', 'broken_down'], default: 'composed' },
  revealedFacts: [{ type: String }],
  chatHistory: [ChatMessageSchema]
}, { _id: false });

const OfficerChatMessageSchema = new Schema({
  role: { type: String, enum: ['user', 'assistant'], required: true },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  isApproved: { type: Boolean, default: false }
}, { _id: false });

const RecordedClueSchema = new Schema({
  id: { type: String, required: true },
  suspectId: { type: String, required: true },
  suspectName: { type: String, required: true },
  statement: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
}, { _id: false });

const GameSessionSchema = new Schema<IGameSession>({
  storyId: { type: Schema.Types.ObjectId, ref: 'Story', required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  isGuest: { type: Boolean, default: true },
  leadDetectiveName: { type: String, default: 'Guest Detective' },
  evidencePresentedCount: { type: Number, default: 0 },
  warrantAttemptsCount: { type: Number, default: 0 },
  currentStage: { type: Number, default: 1 },
  unlockedEvidence: [{ type: String }],
  unlockedLocations: [{ type: String }],
  canvassedLocations: [{ type: String }],
  unlockedSuspects: [{ type: String }],
  caseClosingTriggered: { type: Boolean, default: false },
  remainingClosingQuestions: { type: Number, default: 12 },
  interrogationLocked: { type: Boolean, default: false },
  closingNotificationSent: { type: Boolean, default: false },
  suspects: {
    type: Map,
    of: SuspectRuntimeStateSchema,
    default: () => new Map()
  },
  officerChatHistory: [OfficerChatMessageSchema],
  notes: { type: String, default: '' },
  recordedClues: [RecordedClueSchema],
  groundTruth: { type: Object, required: true },
  status: { type: String, enum: ['active', 'solved'], default: 'active' },
  verdict: {
    suspect: String,
    motive: String,
    weapon: String,
    keyContradiction: String,
    outcome: String,
    epilogue: String,
    score: Number
  }
}, {
  timestamps: true
});

export default mongoose.model<IGameSession>('GameSession', GameSessionSchema);