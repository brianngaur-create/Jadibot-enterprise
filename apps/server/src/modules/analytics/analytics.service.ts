import type { Role } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { isRoleAtLeast } from '../../constants/permissions';

interface Actor {
  id: string;
  role: Role;
}

function dayKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export const analyticsService = {
  /** High-level dashboard summary scoped to the actor's bots (or all for admin). */
  async overview(actor: Actor) {
    const botWhere = isRoleAtLeast(actor.role, 'ADMIN') ? {} : { ownerId: actor.id };
    const [totalBots, onlineBots, bots] = await Promise.all([
      prisma.bot.count({ where: botWhere }),
      prisma.bot.count({ where: { ...botWhere, status: 'ONLINE' } }),
      prisma.bot.findMany({ where: botWhere, select: { messagesHandled: true, activeUsers: true } }),
    ]);
    const messagesHandled = bots.reduce((a, b) => a + b.messagesHandled, 0);
    const activeUsers = bots.reduce((a, b) => a + b.activeUsers, 0);

    return {
      totalBots,
      onlineBots,
      offlineBots: totalBots - onlineBots,
      messagesHandled,
      activeUsers,
      chart: await this.messageSeries(actor),
    };
  },

  /** Last-14-day message/user time series for charts. */
  async messageSeries(actor: Actor) {
    const botIds = isRoleAtLeast(actor.role, 'ADMIN')
      ? undefined
      : (await prisma.bot.findMany({ where: { ownerId: actor.id }, select: { id: true } })).map(
          (b) => b.id,
        );

    const since = new Date();
    since.setDate(since.getDate() - 13);
    since.setHours(0, 0, 0, 0);

    const rows = await prisma.analyticsDaily.findMany({
      where: {
        date: { gte: since },
        ...(botIds ? { botId: { in: botIds } } : {}),
      },
    });

    const byDay = new Map<string, { messages: number; users: number }>();
    for (let i = 0; i < 14; i += 1) {
      const d = new Date(since);
      d.setDate(since.getDate() + i);
      byDay.set(dayKey(d), { messages: 0, users: 0 });
    }
    for (const row of rows) {
      const key = dayKey(row.date);
      const slot = byDay.get(key);
      if (slot) {
        slot.messages += row.messages;
        slot.users += row.activeUsers;
      }
    }
    return [...byDay.entries()].map(([date, v]) => ({ date, messages: v.messages, users: v.users }));
  },

  async userGrowth() {
    const since = new Date();
    since.setDate(since.getDate() - 29);
    const users = await prisma.user.findMany({
      where: { createdAt: { gte: since } },
      select: { createdAt: true },
    });
    const byDay = new Map<string, number>();
    for (const u of users) {
      const key = dayKey(u.createdAt);
      byDay.set(key, (byDay.get(key) ?? 0) + 1);
    }
    return [...byDay.entries()].sort().map(([date, count]) => ({ date, count }));
  },

  async botStats(actor: Actor) {
    const botWhere = isRoleAtLeast(actor.role, 'ADMIN') ? {} : { ownerId: actor.id };
    const bots = await prisma.bot.findMany({
      where: botWhere,
      select: { id: true, name: true, status: true, messagesHandled: true },
      orderBy: { messagesHandled: 'desc' },
      take: 10,
    });
    return bots.map((b) => ({
      id: b.id,
      name: b.name,
      status: b.status === 'ONLINE' ? 'online' : 'offline',
      messages: b.messagesHandled,
    }));
  },
};
