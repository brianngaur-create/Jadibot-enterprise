import type { NextFunction, Request, Response } from 'express';
import { verifyAccessToken } from '../lib/jwt';
import { UnauthorizedError } from '../lib/errors';
import { prisma } from '../lib/prisma';
import { sha256 } from '../lib/jwt';

function extractBearer(req: Request): string | null {
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) return header.slice(7).trim();
  return null;
}

/** Require a valid JWT access token; attaches `req.auth`. */
export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const token = extractBearer(req);
  if (!token) throw new UnauthorizedError('Authentication token missing');

  try {
    const payload = verifyAccessToken(token);
    req.auth = {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
      sessionId: payload.sessionId,
    };
    next();
  } catch {
    throw new UnauthorizedError('Invalid or expired token');
  }
}

/** Populate `req.auth` when a valid token is present, but never reject. */
export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const token = extractBearer(req);
  if (token) {
    try {
      const payload = verifyAccessToken(token);
      req.auth = {
        id: payload.sub,
        email: payload.email,
        role: payload.role,
        sessionId: payload.sessionId,
      };
    } catch {
      /* ignore — treated as anonymous */
    }
  }
  next();
}

/**
 * Authenticate machine-to-machine requests via `X-API-Key`. On success the
 * api-key owner is attached to `req.auth`.
 */
export async function requireApiKey(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  const raw = req.header('x-api-key');
  if (!raw) throw new UnauthorizedError('API key missing');

  const key = await prisma.apiKey.findUnique({
    where: { keyHash: sha256(raw) },
    include: { user: true },
  });
  if (!key || key.revokedAt) throw new UnauthorizedError('Invalid API key');
  if (key.user.status === 'BANNED' || key.user.status === 'SUSPENDED') {
    throw new UnauthorizedError('Account is not active');
  }

  await prisma.apiKey.update({
    where: { id: key.id },
    data: { lastUsedAt: new Date() },
  });

  req.auth = {
    id: key.user.id,
    email: key.user.email,
    role: key.user.role,
    sessionId: `apikey:${key.id}`,
  };
  next();
}
