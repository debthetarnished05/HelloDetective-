import jwt from 'jsonwebtoken';
import { IUser } from '../models/User';

function getSecret(key: string): string {
  const value = process.env[key];

  if (!value) {
    throw new Error(`${key} is not defined in environment variables`);
  }

  return value;
}

const ACCESS_SECRET: string = getSecret('JWT_ACCESS_SECRET');
const REFRESH_SECRET: string = getSecret('JWT_REFRESH_SECRET');

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
