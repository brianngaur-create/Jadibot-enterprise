import type { Response } from 'express';
import { env } from '../config/env';

const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;
const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;

/**
 * Set the refresh-token cookie. It is HttpOnly + SameSite=strict so it is never
 * readable by JS and is not sent on cross-site requests (CSRF mitigation).
 */
export function setRefreshCookie(res: Response, token: string, rememberMe: boolean): void {
  res.cookie(env.AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: env.COOKIE_SECURE,
    sameSite: 'strict',
    domain: env.COOKIE_DOMAIN,
    path: '/',
    maxAge: rememberMe ? THIRTY_DAYS : SEVEN_DAYS,
  });
}

export function clearRefreshCookie(res: Response): void {
  res.clearCookie(env.AUTH_COOKIE_NAME, {
    httpOnly: true,
    secure: env.COOKIE_SECURE,
    sameSite: 'strict',
    domain: env.COOKIE_DOMAIN,
    path: '/',
  });
}
