import crypto from 'node:crypto';
import type { Request, Response } from 'express';
import { sendSuccess } from '../../lib/response';
import { setRefreshCookie, clearRefreshCookie } from '../../utils/cookies';
import { env } from '../../config/env';
import { authService, type RequestContext } from './auth.service';

function context(req: Request): RequestContext {
  return {
    deviceId: (req.header('x-device-id') as string) || crypto.randomUUID(),
    userAgent: req.header('user-agent') ?? undefined,
    ip: req.ip,
  };
}

function readRefreshToken(req: Request): string | undefined {
  return (req.cookies?.[env.AUTH_COOKIE_NAME] as string) || req.body?.refreshToken;
}

export const authController = {
  async register(req: Request, res: Response) {
    const session = await authService.register(req.body, context(req));
    setRefreshCookie(res, session.tokens.refreshToken, session.rememberMe);
    return sendSuccess(res, { session }, 'Account created', 201);
  },

  async login(req: Request, res: Response) {
    const session = await authService.login(req.body, context(req));
    setRefreshCookie(res, session.tokens.refreshToken, session.rememberMe);
    return sendSuccess(res, { session }, 'Logged in');
  },

  async refresh(req: Request, res: Response) {
    const session = await authService.refresh(readRefreshToken(req), context(req));
    setRefreshCookie(res, session.tokens.refreshToken, session.rememberMe);
    return sendSuccess(res, { session }, 'Session refreshed');
  },

  async logout(req: Request, res: Response) {
    await authService.logout(readRefreshToken(req));
    clearRefreshCookie(res);
    return sendSuccess(res, null, 'Logged out');
  },

  async logoutAll(req: Request, res: Response) {
    await authService.logoutAll(req.auth!.id);
    clearRefreshCookie(res);
    return sendSuccess(res, null, 'Logged out from all devices');
  },

  async forgotPassword(req: Request, res: Response) {
    await authService.forgotPassword(req.body.email);
    return sendSuccess(res, null, 'If that email exists, a reset link has been sent');
  },

  async resetPassword(req: Request, res: Response) {
    await authService.resetPassword(req.body.token, req.body.password);
    return sendSuccess(res, null, 'Password updated');
  },

  async me(req: Request, res: Response) {
    const user = await authService.me(req.auth!.id);
    return sendSuccess(res, { user }, 'Current user');
  },
};
