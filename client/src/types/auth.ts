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
  unlockedAt: string | Date;
  caseTitle?: string;
}

export interface IUserStats {
  totalWarrantsFiled: number;
  totalConvictions: number;
  cluesFoundCount: number;
  interrogationsCount: number;
}

export interface IUser {
  id: string;
  username: string;
  email: string;
  rank: DetectiveRank;
  casesSolved: string[];
  badges: IUserBadge[];
  stats: IUserStats;
  createdAt?: string;
}

export interface AuthResponse {
  user: IUser;
  accessToken: string;
}
