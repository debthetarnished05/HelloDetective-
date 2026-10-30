import jwt from 'jsonwebtoken';
import { IUser } from '../models/User';

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'hellodetective_access_secret_super_secure_noir_key_2026';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'hellodetective_refresh_secret_super_secure_noir_key_2026';

export interface TokenPayload {
  id: string;
  username: string;
  email: string;
  rank: string;
}

export function generateAccessToken(user: IUser): string {
  const payload: TokenPayload = {
    id: user._id.toString(),
    username: user.username,
    email: user.email,
    rank: user.rank
  };
  return jwt.sign(payload, ACCESS_SECRET, { expiresIn: '15m' });
}

export function generateRefreshToken(user: IUser): string {
  return jwt.sign({ id: user._id.toString() }, REFRESH_SECRET, { expiresIn: '7d' });
}

export function verifyAccessToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, ACCESS_SECRET) as TokenPayload;
  } catch {
    return null;
  }
}

export function verifyRefreshToken(token: string): { id: string } | null {
  try {
    return jwt.verify(token, REFRESH_SECRET) as { id: string };
  } catch {
    return null;
  }
}
