import crypto from 'node:crypto';
import type { Plan, User } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { redis } from '../../lib/redis';
import { hashPassword, verifyPassword } from '../../lib/password';
import {
  decodeExpiry,
  sha256,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from '../../lib/jwt';
import {
  ConflictError,
  ForbiddenError,
  UnauthorizedError,
} from '../../lib/errors';
import { serializeUser } from '../../utils/serializers';
import type { LoginInput, RegisterInput } from './auth.validators';

export interface RequestContext {
  deviceId: string;
  userAgent?: string;
  ip?: string;
}

const PLAN_MAP: Record<RegisterInput['plan'], Plan> = {
  starter: 'STARTER',
  pro: 'PRO',
  enterprise: 'ENTERPRISE',
};

function initialsFrom(name: string): string {
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

async function issueSession(user: User, ctx: RequestContext, rememberMe: boolean) {
  const sessionId = crypto.randomUUID();

  const accessToken = signAccessToken({
    sub: user.id,
    email: user.email,
    role: user.role,
    sessionId,
  });
  const refreshToken = signRefreshToken(
    { sub: user.id, sessionId, deviceId: ctx.deviceId },
    rememberMe,
  );

  const refreshExpiresAt = new Date(decodeExpiry(refreshToken));

  await prisma.refreshToken.create({
    data: {
      id: sessionId,
      userId: user.id,
      tokenHash: sha256(refreshToken),
      deviceId: ctx.deviceId,
      userAgent: ctx.userAgent,
      ip: ctx.ip,
      expiresAt: refreshExpiresAt,
    },
  });

  return {
    user: serializeUser(user),
    tokens: {
      accessToken,
      refreshToken,
      accessTokenExpiresAt: decodeExpiry(accessToken),
      refreshTokenExpiresAt: refreshExpiresAt.getTime(),
    },
    deviceId: ctx.deviceId,
    sessionId,
    rememberMe,
    createdAt: Date.now(),
    lastActiveAt: Date.now(),
  };
}

async function audit(userId: string | null, action: string, ctx: RequestContext) {
  await prisma.auditLog.create({
    data: { userId, action, ip: ctx.ip, userAgent: ctx.userAgent },
  });
}

export const authService = {
  async register(input: RegisterInput, ctx: RequestContext) {
    const email = input.email.toLowerCase();
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) throw new ConflictError('An account with this email already exists');

    const name = `${input.firstName} ${input.lastName}`.trim();
    const user = await prisma.user.create({
      data: {
        email,
        name,
        passwordHash: await hashPassword(input.password),
        plan: PLAN_MAP[input.plan],
        avatarInitials: initialsFrom(name),
        settings: { create: {} },
      },
    });

    await audit(user.id, 'auth.register', ctx);
    return issueSession(user, ctx, false);
  },

  async login(input: LoginInput, ctx: RequestContext) {
    const email = input.email.toLowerCase();
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.passwordHash) {
      throw new UnauthorizedError('Invalid email or password');
    }
    if (user.status === 'BANNED') throw new ForbiddenError('This account has been banned');

    const ok = await verifyPassword(input.password, user.passwordHash);
    if (!ok) throw new UnauthorizedError('Invalid email or password');

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });
    await audit(user.id, 'auth.login', ctx);

    return issueSession(user, ctx, input.rememberMe);
  },

  async refresh(refreshToken: string | undefined, ctx: RequestContext) {
    if (!refreshToken) throw new UnauthorizedError('Refresh token missing');

    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      throw new UnauthorizedError('Invalid refresh token');
    }

    const stored = await prisma.refreshToken.findUnique({
      where: { id: payload.sessionId },
    });
    if (!stored || stored.revokedAt || stored.tokenHash !== sha256(refreshToken)) {
      // Token reuse / theft — revoke the whole session family.
      if (stored) {
        await prisma.refreshToken.update({
          where: { id: stored.id },
          data: { revokedAt: new Date() },
        });
      }
      throw new UnauthorizedError('Refresh token is no longer valid');
    }
    if (stored.expiresAt < new Date()) {
      throw new UnauthorizedError('Refresh token expired');
    }

    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) throw new UnauthorizedError('User no longer exists');

    // Rotate: revoke the used token and issue a brand-new session.
    await prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });

    return issueSession(user, { ...ctx, deviceId: stored.deviceId }, false);
  },

  async logout(refreshToken: string | undefined): Promise<void> {
    if (!refreshToken) return;
    try {
      const payload = verifyRefreshToken(refreshToken);
      await prisma.refreshToken.updateMany({
        where: { id: payload.sessionId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    } catch {
      /* ignore malformed token on logout */
    }
  },

  async logoutAll(userId: string): Promise<void> {
    await prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  },

  async forgotPassword(email: string): Promise<void> {
    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    // Always succeed silently to avoid leaking which emails are registered.
    if (!user) return;
    const token = crypto.randomBytes(32).toString('hex');
    await redis.set(`pwreset:${sha256(token)}`, user.id, 'EX', 60 * 30);
    // In production this token would be emailed. For now it is logged server-side.
  },

  async resetPassword(token: string, password: string): Promise<void> {
    const key = `pwreset:${sha256(token)}`;
    const userId = await redis.get(key);
    if (!userId) throw new UnauthorizedError('Reset token is invalid or expired');
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: await hashPassword(password) },
    });
    await redis.del(key);
    await this.logoutAll(userId);
  },

  async me(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedError('User not found');
    return serializeUser(user);
  },
};
