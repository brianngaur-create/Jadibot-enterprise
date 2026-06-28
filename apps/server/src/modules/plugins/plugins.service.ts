import { prisma } from '../../lib/prisma';
import { NotFoundError } from '../../lib/errors';
import { serializePlugin } from '../../utils/serializers';
import { reloadPlugins } from '../../whatsapp/plugin-loader';
import { toSkipTake, type ListQuery } from '../../utils/pagination';

export const pluginsService = {
  async list(query: ListQuery) {
    const where = query.search
      ? { name: { contains: query.search, mode: 'insensitive' as const } }
      : {};
    const [items, total] = await Promise.all([
      prisma.plugin.findMany({ where, orderBy: { name: 'asc' }, ...toSkipTake(query) }),
      prisma.plugin.count({ where }),
    ]);
    return { items: items.map(serializePlugin), total };
  },

  async install(input: {
    name: string;
    description?: string;
    category?: string;
    version?: string;
    author?: string;
    source?: string;
  }) {
    const plugin = await prisma.plugin.upsert({
      where: { name: input.name },
      create: {
        name: input.name,
        description: input.description ?? '',
        category: input.category ?? 'general',
        version: input.version ?? '1.0.0',
        author: input.author ?? 'unknown',
        source: input.source ?? 'manual',
      },
      update: { status: 'ACTIVE' },
    });
    return serializePlugin(plugin);
  },

  async update(id: string, data: { status?: 'active' | 'inactive' }) {
    const existing = await prisma.plugin.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError('Plugin not found');
    const plugin = await prisma.plugin.update({
      where: { id },
      data: { status: data.status ? (data.status === 'active' ? 'ACTIVE' : 'INACTIVE') : undefined },
    });
    return serializePlugin(plugin);
  },

  async remove(id: string) {
    const existing = await prisma.plugin.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError('Plugin not found');
    await prisma.plugin.delete({ where: { id } });
  },

  async reload() {
    const count = await reloadPlugins();
    return { reloaded: count };
  },
};
