import type { Role } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { ForbiddenError, NotFoundError } from '../../lib/errors';
import { isRoleAtLeast } from '../../constants/permissions';
import { sessionManager } from '../../whatsapp/session-manager';

interface Actor {
  id: string;
  role: Role;
}

async function authorizeBot(botId: string, actor: Actor) {
  const bot = await prisma.bot.findUnique({ where: { id: botId } });
  if (!bot) throw new NotFoundError('Bot not found');
  if (bot.ownerId !== actor.id && !isRoleAtLeast(actor.role, 'ADMIN')) {
    throw new ForbiddenError('You do not own this bot');
  }
  return bot;
}

function serializeSession(s: {
  id: string;
  botId: string;
  status: string;
  jid: string | null;
  platform: string | null;
  reconnectCount: number;
  lastConnectedAt: Date | null;
  lastSeenAt: Date | null;
  createdAt: Date;
  expiresAt: Date | null;
}) {
  return {
    id: s.id,
    botId: s.botId,
    status: s.status,
    jid: s.jid,
    phone: s.jid?.split(':')[0]?.split('@')[0] ?? null,
    platform: s.platform,
    device: s.platform ?? 'Unknown',
    reconnectCount: s.reconnectCount,
    lastConnectedAt: s.lastConnectedAt?.toISOString() ?? null,
    lastSeen: s.lastSeenAt?.toISOString() ?? null,
    createdAt: s.createdAt.toISOString(),
    expiresAt: s.expiresAt?.toISOString() ?? null,
    live: sessionManager.exists(s.botId),
  };
}

export const sessionsService = {
  async list(actor: Actor) {
    const where = isRoleAtLeast(actor.role, 'ADMIN')
      ? {}
      : { bot: { ownerId: actor.id } };
    const sessions = await prisma.waSession.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
    });
    return sessions.map(serializeSession);
  },

  /** Start (or resume) a session in QR mode and return its current state. */
  async create(botId: string, actor: Actor) {
    const bot = await authorizeBot(botId, actor);
    await sessionManager.create({ botId, ownerId: bot.ownerId });
    const session = await prisma.waSession.findUnique({ where: { botId } });
    return { botId, status: session?.status ?? 'PENDING', qr: session?.qr ?? null };
  },

  /** Ensure a QR session is running and return the latest QR data URL (if any). */
  async getQr(botId: string, actor: Actor) {
    const bot = await authorizeBot(botId, actor);
    if (!sessionManager.exists(botId)) {
      await sessionManager.create({ botId, ownerId: bot.ownerId });
    }
    const session = await prisma.waSession.findUnique({ where: { botId } });
    return { botId, status: session?.status ?? 'PENDING', qr: session?.qr ?? null };
  },

  async pairingCode(botId: string, phoneNumber: string, actor: Actor) {
    const bot = await authorizeBot(botId, actor);
    const code = await sessionManager.requestPairingCode(botId, bot.ownerId, phoneNumber);
    return { botId, code: code || null };
  },

  async reconnect(botId: string, actor: Actor) {
    const bot = await authorizeBot(botId, actor);
    await sessionManager.restart(botId, bot.ownerId);
    return { botId, status: 'CONNECTING' };
  },

  async disconnect(botId: string, actor: Actor) {
    await authorizeBot(botId, actor);
    await sessionManager.disconnect(botId);
    return { botId, status: 'DISCONNECTED' };
  },

  async logout(botId: string, actor: Actor) {
    await authorizeBot(botId, actor);
    await sessionManager.logout(botId);
    return { botId, status: 'LOGGED_OUT' };
  },

  async destroy(botId: string, actor: Actor) {
    await authorizeBot(botId, actor);
    await sessionManager.destroy(botId);
    await prisma.waSession.update({
      where: { botId },
      data: { status: 'PENDING', jid: null, qr: null, pairingCode: null },
    }).catch(() => undefined);
  },
};
