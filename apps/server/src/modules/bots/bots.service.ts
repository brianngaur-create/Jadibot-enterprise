import type { BotMode, Role } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { ForbiddenError, NotFoundError } from '../../lib/errors';
import { isRoleAtLeast } from '../../constants/permissions';
import { serializeBot } from '../../utils/serializers';
import { sessionManager } from '../../whatsapp/session-manager';
import { toSkipTake, type ListQuery } from '../../utils/pagination';
import type { z } from 'zod';
import type { botSettingsSchema, createBotSchema, updateBotSchema } from './bots.validators';

const MODE_MAP: Record<'public' | 'self' | 'group', BotMode> = {
  public: 'PUBLIC',
  self: 'SELF',
  group: 'GROUP',
};

interface Actor {
  id: string;
  role: Role;
}

/** Ensure the actor owns the bot (or is an admin) before mutating it. */
async function authorizeBot(botId: string, actor: Actor) {
  const bot = await prisma.bot.findUnique({
    where: { id: botId },
    include: { settings: true, session: true },
  });
  if (!bot) throw new NotFoundError('Bot not found');
  if (bot.ownerId !== actor.id && !isRoleAtLeast(actor.role, 'ADMIN')) {
    throw new ForbiddenError('You do not own this bot');
  }
  return bot;
}

export const botsService = {
  async list(actor: Actor, query: ListQuery) {
    const where = isRoleAtLeast(actor.role, 'ADMIN') ? {} : { ownerId: actor.id };
    const search = query.search
      ? { ...where, name: { contains: query.search, mode: 'insensitive' as const } }
      : where;

    const [items, total] = await Promise.all([
      prisma.bot.findMany({
        where: search,
        include: { settings: true, session: true },
        orderBy: { createdAt: query.order },
        ...toSkipTake(query),
      }),
      prisma.bot.count({ where: search }),
    ]);
    return { items: items.map(serializeBot), total };
  },

  async get(botId: string, actor: Actor) {
    const bot = await authorizeBot(botId, actor);
    return serializeBot(bot);
  },

  async create(actor: Actor, input: z.infer<typeof createBotSchema>) {
    const bot = await prisma.bot.create({
      data: {
        ownerId: actor.id,
        name: input.name,
        prefix: input.prefix,
        mode: MODE_MAP[input.mode],
        settings: { create: {} },
        session: { create: {} },
      },
      include: { settings: true, session: true },
    });
    return serializeBot(bot);
  },

  async update(botId: string, actor: Actor, input: z.infer<typeof updateBotSchema>) {
    await authorizeBot(botId, actor);
    const bot = await prisma.bot.update({
      where: { id: botId },
      data: {
        name: input.name,
        prefix: input.prefix,
        mode: input.mode ? MODE_MAP[input.mode] : undefined,
        autoRead: input.autoRead,
        autoTyping: input.autoTyping,
        autoRecording: input.autoRecording,
        autoReact: input.autoReact,
      },
      include: { settings: true, session: true },
    });
    return serializeBot(bot);
  },

  async updateSettings(botId: string, actor: Actor, input: z.infer<typeof botSettingsSchema>) {
    await authorizeBot(botId, actor);
    await prisma.botSetting.upsert({
      where: { botId },
      create: { botId, ...input },
      update: input,
    });
    const bot = await prisma.bot.findUnique({
      where: { id: botId },
      include: { settings: true, session: true },
    });
    return serializeBot(bot!);
  },

  async remove(botId: string, actor: Actor) {
    await authorizeBot(botId, actor);
    await sessionManager.destroy(botId);
    await prisma.bot.delete({ where: { id: botId } });
  },

  async restart(botId: string, actor: Actor) {
    const bot = await authorizeBot(botId, actor);
    await sessionManager.restart(botId, bot.ownerId);
  },
};
