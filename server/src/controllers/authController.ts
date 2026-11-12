import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import User, { calculateDetectiveRank } from '../models/User.js';
import GameSession from '../models/GameSession.js';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/token.js';
import { AuthRequest } from '../middleware/authMiddleware.js';
import { matchesGuestSessionToken } from '../utils/guestSession.js';
import { hashRefreshToken, matchesRefreshToken } from '../utils/refreshToken.js';

const DUMMY_PASSWORD_HASH = bcrypt.hashSync('invalid-account-password-check', 12);

async function migrateGuestSession(req: Request, guestSessionId: string | undefined, user: any): Promise<void> {
  if (!guestSessionId) return;
  const token = req.get('X-Guest-Session-Token') || '';
  const session = await GameSession.findOne({ _id: guestSessionId, isGuest: true, userId: null })
    .select('+guestAccessTokenHash');
  if (!session || !matchesGuestSessionToken(token, session.guestAccessTokenHash)) return;

  session.userId = user._id;
  session.isGuest = false;
  session.leadDetectiveName = `Detective ${user.username}`;
  session.guestAccessTokenHash = undefined;
  await session.save();
}

export const register = async (req: Request, res: Response) => {
  try {
    const { username, email, password, guestSessionId } = req.body;

    if (typeof username !== 'string' || typeof email !== 'string' || typeof password !== 'string' || !username.trim() || !email.trim() || !password) {
      return res.status(400).json({ error: 'Username, email, and password are required.' });
    }

    if (username.length < 3 || username.length > 30) {
      return res.status(400).json({ error: 'Username must be between 3 and 30 characters.' });
    }

    if (password.length < 12 || Buffer.byteLength(password, 'utf8') > 72) {
      return res.status(400).json({ error: 'Password must be at least 12 characters and no more than 72 UTF-8 bytes.' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email address format.' });
    }

    const existingUser = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { username: username.trim() }]
    });

    if (existingUser) {
      return res.status(409).json({ error: 'An account with those details could not be created.' });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const newUser = new User({
      username: username.trim(),
      email: email.toLowerCase().trim(),
      passwordHash,
      rank: 'Rookie Agent',
      casesSolved: [],
      badges: [],
      stats: {
        totalWarrantsFiled: 0,
        totalConvictions: 0,
        cluesFoundCount: 0,
        interrogationsCount: 0
      }
    });

    const accessToken = generateAccessToken(newUser);
    const refreshToken = generateRefreshToken(newUser);
    newUser.refreshTokenHash = hashRefreshToken(refreshToken);
    await newUser.save();

    // Seamless Guest Session Migration:
    if (guestSessionId) {
      try {
        await migrateGuestSession(req, guestSessionId, newUser);
      } catch (migrateErr) {
        console.error('Failed to migrate guest session on register:', migrateErr);
      }
    }

    // Set HTTP-only cookie for refresh token
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.status(201).json({
      message: `Detective badge issued for Agent ${newUser.username}! Welcome to the Bureau.`,
      accessToken,
      user: {
        id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        rank: newUser.rank,
        casesSolved: newUser.casesSolved,
        badges: newUser.badges,
        stats: newUser.stats
      }
    });
  } catch (err: any) {
    console.error('Registration error:', err);
    res.status(500).json({ error: err.message || 'Failed to issue detective badge.' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const identifier = req.body.identifier || req.body.login;
    const { password, guestSessionId } = req.body;

    if (typeof identifier !== 'string' || typeof password !== 'string' || !identifier.trim() || !password) {
      return res.status(400).json({ error: 'Callsign/email and password are required.' });
    }

    const user = await User.findOne({
      $or: [{ email: identifier.toLowerCase().trim() }, { username: identifier.trim() }]
    });

    if (!user) {
      await bcrypt.compare(password, DUMMY_PASSWORD_HASH);
      return res.status(401).json({ error: 'Invalid callsign/email or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid callsign/email or password.' });
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    user.refreshTokenHash = hashRefreshToken(refreshToken);
    user.refreshToken = undefined;
    await user.save();

    // Seamless Guest Session Migration:
    if (guestSessionId) {
      try {
        await migrateGuestSession(req, guestSessionId, user);
      } catch (migrateErr) {
        console.error('Failed to migrate guest session on login:', migrateErr);
      }
    }

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.json({
      message: `Welcome back, Agent ${user.username}. Security clearance restored.`,
      accessToken,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        rank: user.rank,
        casesSolved: user.casesSolved,
        badges: user.badges,
        stats: user.stats
      }
    });
  } catch (err: any) {
    console.error('Login error:', err);
    res.status(500).json({ error: err.message || 'Authentication error.' });
  }
};

export const refresh = async (req: Request, res: Response) => {
  try {
    const token = req.cookies?.refreshToken || req.body?.refreshToken;

    if (!token) {
      return res.status(401).json({ error: 'No refresh token provided.' });
    }

    const decoded = verifyRefreshToken(token);
    if (!decoded) {
      return res.status(401).json({ error: 'Refresh token expired or invalid.' });
    }

    const user = await User.findById(decoded.id).select('+refreshTokenHash +refreshToken');
    if (!user || (!matchesRefreshToken(token, user.refreshTokenHash) && user.refreshToken !== token)) {
      return res.status(401).json({ error: 'Refresh token revoked or session expired.' });
    }

    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);
    const currentTokenFilter = user.refreshTokenHash
      ? { _id: user._id, refreshTokenHash: user.refreshTokenHash }
      : { _id: user._id, refreshToken: token };
    const rotatedUser = await User.findOneAndUpdate(
      currentTokenFilter,
      { $set: { refreshTokenHash: hashRefreshToken(newRefreshToken) }, $unset: { refreshToken: 1 } },
      { new: true }
    );
    if (!rotatedUser) return res.status(401).json({ error: 'Refresh token has already been rotated.' });

    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.json({
      accessToken: newAccessToken,
      user: {
        id: user._id,
        username: user.username,
        email: rotatedUser.email,
        rank: rotatedUser.rank,
        casesSolved: rotatedUser.casesSolved,
        badges: rotatedUser.badges,
        stats: rotatedUser.stats
      }
    });
  } catch (err: any) {
    console.error('Token refresh error:', err);
    res.status(500).json({ error: 'Token renewal failed.' });
  }
};

export const logout = async (req: AuthRequest, res: Response) => {
  try {
    const token = req.cookies?.refreshToken || req.body?.refreshToken;
    if (token) {
      const decoded = verifyRefreshToken(token);
      if (decoded) {
        const user = await User.findById(decoded.id).select('+refreshTokenHash +refreshToken');
        if (user && (matchesRefreshToken(token, user.refreshTokenHash) || user.refreshToken === token)) {
          await User.updateOne(
            user.refreshTokenHash
              ? { _id: user._id, refreshTokenHash: user.refreshTokenHash }
              : { _id: user._id, refreshToken: token },
            { $unset: { refreshTokenHash: 1, refreshToken: 1 } }
          );
        }
      }
    }

    res.clearCookie('refreshToken');
    res.json({ message: 'Signed out from Homicide Bureau.' });
  } catch (err) {
    res.clearCookie('refreshToken');
    res.json({ message: 'Signed out.' });
  }
};

export const getMe = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized.' });
    }

    // Refresh rank based on cases solved
    const rank = calculateDetectiveRank(req.user.casesSolved.length);
    if (req.user.rank !== rank) {
      req.user.rank = rank;
      await req.user.save();
    }

    res.json({
      user: {
        id: req.user._id,
        username: req.user.username,
        email: req.user.email,
        rank: req.user.rank,
        casesSolved: req.user.casesSolved,
        badges: req.user.badges,
        stats: req.user.stats
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve detective profile.' });
  }
};
