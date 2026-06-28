import type { Plan, Role, UserStatus } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { redis } from '../../lib/redis';
import { ForbiddenError, NotFoundError } from '../../lib/errors';
import { serializeAdminUser } from '../../utils/serializers';
import { systemMetrics } from '../../utils/system-metrics';
import { sessionManager } from '../../whatsapp/session-manager';
import { toSkipTake, type ListQuery } from '../../utils/pagination';

const MAINTENANCE_KEY = 'maintenance_mode';

async function checkRedis(): Promise<boolean> {
  try {
    return (await redis.ping()) === 'PONG';
  } catch {
    return false;
  }
}

async function checkDb(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}

export const adminService = {
  async dashboard() {
    const [users, bots, onlineBots, sessions, messageAgg] = await Promise.all([
      prisma.user.count(),
      prisma.bot.count(),
      prisma.bot.count({ where: { status: 'ONLINE' } }),
      prisma.waSession.count(),
      prisma.bot.aggregate({ _sum: { messagesHandled: true } }),
    ]);

    return {
      totals: {
        users,
        bots,
        onlineBots,
        offlineBots: bots - onlineBots,
        sessions,
        liveSessions: sessionManager.getAll().length,
        messages: messageAgg._sum.messagesHandled ?? 0,
      },
      health: await this.health(),
      system: systemMetrics(),
    };
  },

  async health() {
    const [db, redisOk] = await Promise.all([checkDb(), checkRedis()]);
    return {
      database: db ? 'up' : 'down',
      redis: redisOk ? 'up' : 'down',
      whatsapp: sessionManager.isReady() ? 'up' : 'down',
      socket: 'up',
    };
  },

  async monitoring() {
    return {
      system: systemMetrics(),
      health: await this.health(),
      sessions: sessionManager.getAll().map((s) => ({
        botId: s.botId,
        status: s.status,
        reconnectAttempts: s.reconnectAttempts,
        uptime: Math.round((Date.now() - s.startedAt) / 1000),
      })),
    };
  },

  async listUsers(query: ListQuery) {
    const where = query.search
      ? {
          OR: [
            { name: { contains: query.search, mode: 'insensitive' as const } },
            { email: { contains: query.search, mode: 'insensitive' as const } },
          ],
        }
      : {};
    const [items, total] = await Promise.all([
      prisma.user.findMany({
        where,
        include: { _count: { select: { bots: true } } },
        orderBy: { createdAt: query.order },
        ...toSkipTake(query),
      }),
      prisma.user.count({ where }),
    ]);
    return { items: items.map(serializeAdminUser), total };
  },

  async updateUser(
    id: string,
    data: { status?: UserStatus; role?: Role; plan?: Plan },
    actorRole: Role,
  ) {
    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError('User not found');
    // Only a SUPER_ADMIN may grant, revoke, or otherwise touch the SUPER_ADMIN
    // role — prevents an ADMIN from escalating their own (or anyone's) privileges.
    if (actorRole !== 'SUPER_ADMIN' && (data.role === 'SUPER_ADMIN' || existing.role === 'SUPER_ADMIN')) {
      throw new ForbiddenError('Only a super admin can manage super admin accounts');
    }
    const user = await prisma.user.update({
      where: { id },
      data,
      include: { _count: { select: { bots: true } } },
    });
    return serializeAdminUser(user);
  },

  async deleteUser(id: string) {
    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError('User not found');
    await prisma.user.delete({ where: { id } });
  },

  async setMaintenance(enabled: boolean, message?: string) {
    await prisma.setting.upsert({
      where: { key: MAINTENANCE_KEY },
      create: { key: MAINTENANCE_KEY, value: { enabled, message: message ?? '' } },
      update: { value: { enabled, message: message ?? '' } },
    });
    return { enabled, message: message ?? '' };
  },

  async getMaintenance() {
    const setting = await prisma.setting.findUnique({ where: { key: MAINTENANCE_KEY } });
    return (setting?.value as { enabled: boolean; message: string }) ?? { enabled: false, message: '' };
  },
};
