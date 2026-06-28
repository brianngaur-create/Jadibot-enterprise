import crypto from 'node:crypto';
import jwt, { type SignOptions } from 'jsonwebtoken';
import type { Role } from '@prisma/client';
import { env } from '../config/env';

export interface AccessTokenPayload {
  sub: string;
  email: string;
  role: Role;
  sessionId: string;
}

export interface RefreshTokenPayload {
  sub: string;
  sessionId: string;
  deviceId: string;
}

export function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN,
  } as SignOptions);
}

export function signRefreshToken(
  payload: RefreshTokenPayload,
  rememberMe = false,
): string {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: rememberMe
      ? env.JWT_REFRESH_REMEMBER_EXPIRES_IN
      : env.JWT_REFRESH_EXPIRES_IN,
  } as SignOptions);
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, env.JWT_SECRET) as AccessTokenPayload;
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as RefreshTokenPayload;
}

/** Decode without verifying — used only to read the expiry for client hints. */
export function decodeExpiry(token: string): number {
  const decoded = jwt.decode(token) as { exp?: number } | null;
  return decoded?.exp ? decoded.exp * 1000 : 0;
}

/** SHA-256 hash used to store refresh tokens / api keys at rest. */
export function sha256(value: string): string {
  return crypto.createHash('sha256').update(value).digest('hex');
}
