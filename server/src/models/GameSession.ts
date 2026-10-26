import mongoose, { Schema, Document } from 'mongoose';

export interface IMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

export interface ISuspectState {
  suspectId: string;
  trustScore: number;
  stressLevel: number;
  revealedFacts: string[]; // Facts the suspect has admitted to
  chatHistory: IMessage[];
}

export interface IGameSession extends Document {
  playerId: string;
  status: 'active' | 'solved' | 'failed';
  currentStage: number; // Stages 1 to 4
  unlockedEvidence: string[];
  unlockedLocations: string[];
  suspectStates: ISuspectState[];
  officerChatHistory: IMessage[]; // Chat history with Officer Davis
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema = new Schema({
  role: { type: String, enum: ['user', 'assistant', 'system'], required: true },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

const SuspectStateSchema = new Schema({
  suspectId: { type: String, required: true },
  trustScore: { type: Number, default: 50 },
  stressLevel: { type: Number, default: 0 },
  revealedFacts: [{ type: String }],
  chatHistory: [MessageSchema]
});

const GameSessionSchema = new Schema({
  playerId: { type: String, required: true },
  status: { type: String, enum: ['active', 'solved', 'failed'], default: 'active' },
  currentStage: { type: Number, default: 1, min: 1, max: 4 },
  unlockedEvidence: [{ type: String }],
  unlockedLocations: [{ type: String }],
  suspectStates: [SuspectStateSchema],
  officerChatHistory: [MessageSchema]
}, { timestamps: true });

export default mongoose.model<IGameSession>('GameSession', GameSessionSchema);