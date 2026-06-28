import type { LogLevel, Role } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { isRoleAtLeast } from '../../constants/permissions';
import { serializeLog } from '../../utils/serializers';
import { toSkipTake, type ListQuery } from '../../utils/pagination';

interface Actor {
  id: string;
  role: Role;
}

const LEVEL_MAP: Record<string, LogLevel> = {
  debug: 'DEBUG',
  info: 'INFO',
  warn: 'WARN',
  error: 'ERROR',
};

export const logsService = {
  async list(actor: Actor, query: ListQuery & { level?: string; source?: string; botId?: string }) {
    const where: Record<string, unknown> = {};
    if (!isRoleAtLeast(actor.role, 'ADMIN')) {
      const bots = await prisma.bot.findMany({ where: { ownerId: actor.id }, select: { id: true } });
      where.botId = { in: bots.map((b) => b.id) };
    }
    if (query.botId) where.botId = query.botId;
    if (query.level && LEVEL_MAP[query.level]) where.level = LEVEL_MAP[query.level];
    if (query.source) where.source = query.source;
    if (query.search) where.message = { contains: query.search, mode: 'insensitive' };

    const [items, total] = await Promise.all([
      prisma.log.findMany({ where, orderBy: { createdAt: 'desc' }, ...toSkipTake(query) }),
      prisma.log.count({ where }),
    ]);
    return { items: items.map(serializeLog), total };
  },
};
