import mongoose, { Document, Schema } from 'mongoose';

export type DetectiveRank =
  | 'Rookie Agent'
  | 'Junior Agent'
  | 'Special Agent'
  | 'Senior Special Agent'
  | 'Chief Commissioner';

export interface IUserBadge {
  id: string;
  title: string;
  icon: string;
  description: string;
  unlockedAt: Date;
  caseTitle?: string;
}

export interface IUserStats {
  totalWarrantsFiled: number;
  totalConvictions: number;
  cluesFoundCount: number;
  interrogationsCount: number;
}

export interface IUser extends Document {
  username: string;
  email: string;
  passwordHash: string;
  rank: DetectiveRank;
  casesSolved: string[]; // array of story IDs
  badges: IUserBadge[];
  stats: IUserStats;
  refreshTokenHash?: string;
  /** Legacy token field kept only to migrate active sessions during refresh. */
  refreshToken?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 30
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    passwordHash: {
      type: String,
      required: true
    },
    rank: {
      type: String,
      enum: [
        'Rookie Agent',
        'Junior Agent',
        'Special Agent',
        'Senior Special Agent',
        'Chief Commissioner'
      ],
      default: 'Rookie Agent'
    },
    casesSolved: {
      type: [String],
      default: []
    },
    badges: [
      {
        id: { type: String, required: true },
        title: { type: String, required: true },
        icon: { type: String, required: true },
        description: { type: String, required: true },
        unlockedAt: { type: Date, default: Date.now },
        caseTitle: { type: String }
      }
    ],
    stats: {
      totalWarrantsFiled: { type: Number, default: 0 },
      totalConvictions: { type: Number, default: 0 },
      cluesFoundCount: { type: Number, default: 0 },
      interrogationsCount: { type: Number, default: 0 }
    },
    refreshTokenHash: { type: String, select: false },
    refreshToken: { type: String, select: false }
  },
  { timestamps: true }
);

export function calculateDetectiveRank(casesSolvedCount: number): DetectiveRank {
  if (casesSolvedCount >= 6) return 'Chief Commissioner';
  if (casesSolvedCount >= 4) return 'Senior Special Agent';
  if (casesSolvedCount >= 2) return 'Special Agent';
  if (casesSolvedCount >= 1) return 'Junior Agent';
  return 'Rookie Agent';
}

export default mongoose.model<IUser>('User', UserSchema);
