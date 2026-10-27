import mongoose, { Schema, Document } from 'mongoose';
import { IStory } from '../types/index';

export interface IStoryDocument extends IStory, Document {}

const VictimProfileSchema = new Schema({
  name: { type: String, required: true },
  age: { type: Number, required: true },
  occupation: { type: String, required: true },
  discovered: { type: String, required: true },
  causeOfDeath: { type: String, required: true },
  timeOfDeath: { type: String, required: true }
}, { _id: false });

const BriefingSchema = new Schema({
  initialBriefing: { type: String, required: true },
  detectiveInsights: { type: String, required: true }
}, { _id: false });

const ObjectivesSchema = new Schema({
  progress: [{ type: String }],
  currentObjectives: [{ type: String }]
}, { _id: false });

const LocationItemSchema = new Schema({
  id: { type: String, required: true },
  title: { type: String, required: true },
  subtitle: { type: String, required: true },
  status: { type: String, default: 'Location of Interest' },
  lastVisited: { type: String, default: 'Pending' },
  witnesses: { type: String, default: 'None identified' },
  notes: { type: String, default: '' },
  unlockStage: { type: Number, default: 1 },
  imageUrl: { type: String }
}, { _id: false });

const EvidenceItemSchema = new Schema({
  id: { type: String, required: true },
  title: { type: String, required: true },
  subtitle: { type: String, required: true },
  details: { type: String, required: true },
  date: { type: String, default: 'Recent' },
  location: { type: String, default: 'Crime Scene' },
  priority: { type: String, enum: ['Low', 'Medium', 'High', 'Critical'], default: 'Medium' },
  unlockStage: { type: Number, default: 1 },
  imageUrl: { type: String }
}, { _id: false });

const SuspectItemSchema = new Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  role: { type: String, required: true },
  trait: { type: String, required: true },
  initialTrust: { type: Number, default: 50 },
  initialStress: { type: Number, default: 20 },
  alibi: { type: String, required: true },
  motive: { type: String, required: true },
  privateKnowledge: { type: String, required: true },
  secrets: [{ type: String }],
  breakdownThreshold: { type: Number, default: 80 },
  evidenceReactions: { type: Map, of: String, default: {} },
  avatarUrl: { type: String },
  isPrimeSuspect: { type: Boolean, default: false },
  category: { type: String, enum: ['prime_suspect', 'person_of_interest', 'witness'], default: 'person_of_interest' }
}, { _id: false });

const StageDefinitionSchema = new Schema({
  stage: { type: Number, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  gateRules: { type: String, required: true },
  unlockEvidenceIds: [{ type: String }],
  unlockLocationIds: [{ type: String }]
}, { _id: false });

const GroundTruthSchema = new Schema({
  killer: { type: String, required: true },
  motive: { type: String, required: true },
  weapon: { type: String, required: true },
  keyContradiction: { type: String, required: true },
  timelineSummary: { type: String, required: true }
}, { _id: false });

const StorySchema = new Schema<IStoryDocument>({
  title: { type: String, required: true },
  caseNumber: { type: String, required: true },
  leadDetective: { type: String, default: 'Detective' },
  status: { type: String, default: 'Active Investigation' },
  victimProfile: { type: VictimProfileSchema, required: true },
  briefing: { type: BriefingSchema, required: true },
  objectives: { type: ObjectivesSchema, required: true },
  locations: [LocationItemSchema],
  evidence: [EvidenceItemSchema],
  suspects: [SuspectItemSchema],
  stages: [StageDefinitionSchema],
  groundTruth: { type: GroundTruthSchema, required: true },
  isDefault: { type: Boolean, default: false }
}, {
  timestamps: true
});

export default mongoose.model<IStoryDocument>('Story', StorySchema);
