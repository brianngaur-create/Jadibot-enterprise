import rateLimit, { type RateLimitRequestHandler } from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import type { Request, Response } from 'express';
import { redis } from '../lib/redis';
import type { ErrorEnvelope } from '../lib/response';

/**
 * Build a Redis-backed rate limiter. Using Redis (instead of in-memory) means
 * limits are shared across every server instance behind a load balancer.
 */
function createLimiter(options: {
  windowMs: number;
  max: number;
  prefix: string;
}): RateLimitRequestHandler {
  return rateLimit({
    windowMs: options.windowMs,
    max: options.max,
    standardHeaders: true,
    legacyHeaders: false,
    store: new RedisStore({
      sendCommand: (command: string, ...args: string[]) =>
        redis.call(command, ...args) as Promise<never>,
      prefix: `rl:${options.prefix}:`,
    }),
    keyGenerator: (req: Request) => req.auth?.id ?? req.ip ?? 'anonymous',
    handler: (_req: Request, res: Response) => {
      const body: ErrorEnvelope = {
        success: false,
        status: 429,
        code: 'RATE_LIMITED',
        message: 'Too many requests. Please slow down and try again later.',
      };
      res.status(429).json(body);
    },
  });
}

const MIN = 60_000;

/** Global API limiter — 100 requests / minute. */
export const apiLimiter = createLimiter({ windowMs: MIN, max: 100, prefix: 'api' });

/** Login limiter — 5 attempts / 15 minutes. */
export const loginLimiter = createLimiter({ windowMs: 15 * MIN, max: 5, prefix: 'login' });

/** Register limiter — 3 / hour. */
export const registerLimiter = createLimiter({ windowMs: 60 * MIN, max: 3, prefix: 'register' });

/** Forgot-password limiter — 3 / hour. */
export const forgotPasswordLimiter = createLimiter({
  windowMs: 60 * MIN,
  max: 3,
  prefix: 'forgot',
});

/** QR / pairing limiter — 10 / minute. */
export const qrLimiter = createLimiter({ windowMs: MIN, max: 10, prefix: 'qr' });
