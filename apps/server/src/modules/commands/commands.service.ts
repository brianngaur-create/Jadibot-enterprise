import { prisma } from '../../lib/prisma';
import { NotFoundError } from '../../lib/errors';
import { serializeCommand } from '../../utils/serializers';
import { reloadCommands } from '../../whatsapp/command-loader';
import { toSkipTake, type ListQuery } from '../../utils/pagination';

export const commandsService = {
  async list(query: ListQuery & { category?: string }) {
    const where: Record<string, unknown> = {};
    if (query.search) where.name = { contains: query.search, mode: 'insensitive' };
    if (query.category) where.category = query.category;
    const [items, total] = await Promise.all([
      prisma.command.findMany({ where, orderBy: { name: 'asc' }, ...toSkipTake(query) }),
      prisma.command.count({ where }),
    ]);
    return { items: items.map(serializeCommand), total };
  },

  async update(id: string, data: { enabled?: boolean }) {
    const existing = await prisma.command.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError('Command not found');
    const command = await prisma.command.update({ where: { id }, data: { enabled: data.enabled } });
    return serializeCommand(command);
  },

  async reload() {
    const count = await reloadCommands();
    return { reloaded: count };
  },
};
