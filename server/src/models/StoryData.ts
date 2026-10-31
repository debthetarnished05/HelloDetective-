import mongoose, { Schema, Document } from 'mongoose';
import { IStory } from '../types/index';

export interface IStoryDocument extends Omit<IStory, '_id'>, Document {}

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

const DynamicUnlockSchema = new Schema({
  type: { type: String, enum: ['evidence', 'location', 'character'], required: true },
  targetId: { type: String, required: true },
  triggerStress: { type: Number },
  triggerEvidenceId: { type: String },
  revealDialogue: { type: String },
  revealed: { type: Boolean, default: false }
}, { _id: false });

const LocationItemSchema = new Schema({
  id: { type: String, required: true },
  title: { type: String, required: true },
  subtitle: { type: String, required: true },
  status: { type: String, default: 'Location of Interest' },
  lastVisited: { type: String, default: 'Pending' },
  witnesses: { type: String, default: 'None identified' },
  notes: { type: String, default: '' },
  isInitiallyUnlocked: { type: Boolean, default: false },
  hiddenEvidenceIds: [{ type: String }],
  canvassReport: { type: String },
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
  isInitiallyUnlocked: { type: Boolean, default: false },
  locationId: { type: String },
  imageUrl: { type: String }
}, { _id: false });

const SuspectItemSchema = new Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  role: { type: String, required: true },
  trait: { type: String, required: true },
  personality: { type: String, enum: ['confident', 'nervous', 'cunning', 'aggressive', 'defensive'], default: 'defensive' },
  isInitiallyUnlocked: { type: Boolean, default: true },
  dynamicUnlocks: [DynamicUnlockSchema],
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
  category: { type: String, enum: ['prime_suspect', 'person_of_interest', 'witness', 'secondary_suspect'], default: 'person_of_interest' }
}, { _id: false });

const GroundTruthSchema = new Schema({
  killer: { type: String, required: true },
  motive: { type: String, required: true },
  weapon: { type: String, required: true },
  keyContradiction: { type: String, required: true },
  timelineSummary: { type: String, required: true },
  archetype: {
    type: String,
    enum: [
      'classic_procedural',
      'multi_crime_convergence',
      'deliberate_frame_job',
      'cause_of_death_twist',
      'false_confession',
      'non_linear_web'
    ],
    default: 'classic_procedural'
  },
  fallGuy: { type: String },
  redHerringCrime: { type: String },
  trueFatalMechanism: { type: String }
}, { _id: false });

const StorySchema = new Schema<IStoryDocument>({
  title: { type: String, required: true },
  caseNumber: { type: String, required: true },
  leadDetective: { type: String, default: 'Detective' },
  status: { type: String, default: 'Active Investigation' },
  archetype: {
    type: String,
    enum: [
      'classic_procedural',
      'multi_crime_convergence',
      'deliberate_frame_job',
      'cause_of_death_twist',
      'false_confession',
      'non_linear_web'
    ],
    default: 'classic_procedural'
  },
  trope: { type: String, default: '' },
  victimProfile: { type: VictimProfileSchema, required: true },
  briefing: { type: BriefingSchema, required: true },
  objectives: { type: ObjectivesSchema, required: true },
  locations: [LocationItemSchema],
  evidence: [EvidenceItemSchema],
  suspects: [SuspectItemSchema],
  groundTruth: { type: GroundTruthSchema, required: true },
  isDefault: { type: Boolean, default: false }
}, {
  timestamps: true
});

// Auto-sync archetype and trope before saving
StorySchema.pre('save', function () {
  if (this.groundTruth?.archetype && !this.archetype) {
    this.archetype = this.groundTruth.archetype as any;
  }
  if (this.archetype && !this.groundTruth?.archetype) {
    if (!this.groundTruth) this.groundTruth = {} as any;
    this.groundTruth.archetype = this.archetype as any;
  }
});

export default mongoose.model<IStoryDocument>('Story', StorySchema);
