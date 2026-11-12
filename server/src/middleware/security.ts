import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';

const sharedLimitOptions = {
  standardHeaders: 'draft-8' as const,
  legacyHeaders: false,
  handler: (_req: Request, res: Response) => res.status(429).json({ error: 'Too many requests. Please try again later.' })
};

export const authRateLimit = rateLimit({
  ...sharedLimitOptions,
  windowMs: 15 * 60 * 1000,
  limit: 10
});

export const refreshRateLimit = rateLimit({
  ...sharedLimitOptions,
  windowMs: 15 * 60 * 1000,
  limit: 30
});

export const llmRateLimit = rateLimit({
  ...sharedLimitOptions,
  windowMs: 10 * 60 * 1000,
  limit: 30
});

export const storyGenerationRateLimit = rateLimit({
  ...sharedLimitOptions,
  windowMs: 60 * 60 * 1000,
  limit: 3
});
