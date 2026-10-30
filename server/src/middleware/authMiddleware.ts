import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, TokenPayload } from '../utils/token';
import User, { IUser } from '../models/User';

export interface AuthRequest extends Request {
  user?: IUser | null;
  tokenData?: TokenPayload | null;
}

export async function optionalAuth(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    let token: string | undefined;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    }

    if (token) {
      const decoded = verifyAccessToken(token);
      if (decoded) {
        const user = await User.findById(decoded.id).select('-passwordHash');
        if (user) {
          req.user = user;
          req.tokenData = decoded;
        }
      }
    }
  } catch (err) {
    // Silently continue as guest
    req.user = null;
  }
  next();
}

export async function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    let token: string | undefined;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      return res.status(401).json({
        error: 'Bureau Clearance Required. Please log in or register to access this restricted dossier.'
      });
    }

    const decoded = verifyAccessToken(token);
    if (!decoded) {
      return res.status(401).json({
        error: 'Security credentials expired or invalid. Please refresh authentication.',
        code: 'TOKEN_EXPIRED'
      });
    }

    const user = await User.findById(decoded.id).select('-passwordHash');
    if (!user) {
      return res.status(401).json({
        error: 'Detective badge not found in Homicide Bureau archives.'
      });
    }

    req.user = user;
    req.tokenData = decoded;
    next();
  } catch (err: any) {
    return res.status(500).json({ error: 'Authentication verification failure.' });
  }
}
