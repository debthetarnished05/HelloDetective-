import mongoose, { Schema, Document } from 'mongoose';

export interface ISuspectState {
  suspectId: string;
  trustScore: number;
  revealedFacts: string[]; // The Revealed Facts Ledger
}

export interface IGameSession extends Document {
  currentStage: number;
  unlockedEvidence: string[];
  unlockedLocations: string[];
  suspects: Map<string, ISuspectState>;
  groundTruth: Record<string, any>; // The actual murder details for the Judge AI
}

const SuspectStateSchema = new Schema({
  suspectId: { type: String, required: true },
  trustScore: { type: Number, default: 50 },
  revealedFacts: [{ type: String }]
});

const GameSessionSchema = new Schema({
  currentStage: { type: Number, default: 1 },
  unlockedEvidence: [{ type: String }],
  unlockedLocations: [{ type: String }],
  suspects: {
    type: Map,
    of: SuspectStateSchema,
    default: () => ({
      marcus_chen: { suspectId: 'marcus_chen', trustScore: 50, revealedFacts: [] },
      sarah_reynolds: { suspectId: 'sarah_reynolds', trustScore: 40, revealedFacts: [] },
      diana_wilkins: { suspectId: 'diana_wilkins', trustScore: 60, revealedFacts: [] }
    })
  },
  groundTruth: { type: Object, required: true }
});

export default mongoose.model<IGameSession>('GameSession', GameSessionSchema);