import path from 'node:path';
import fs from 'node:fs/promises';
import makeWASocket, {
  DisconnectReason,
  fetchLatestBaileysVersion,
  useMultiFileAuthState,
  Browsers,
  type WASocket,
  type ConnectionState,
} from '@whiskeysockets/baileys';
import QRCode from 'qrcode';
import pino from 'pino';
import type { BotStatus, SessionStatus } from '@prisma/client';
import { env } from '../config/env';
import { scopedLogger } from '../config/logger';
import { prisma } from '../lib/prisma';
import { engineEvents } from './engine-events';

const log = scopedLogger('whatsapp');

interface SessionPersist {
  status?: SessionStatus;
  jid?: string | null;
  qr?: string | null;
  pairingCode?: string | null;
  lastConnectedAt?: Date;
}

/** A message handler is registered by the command system at boot. */
export type MessageHandler = (instance: SessionInstance, upsert: unknown) => Promise<void>;

let messageHandler: MessageHandler | null = null;
export function registerMessageHandler(handler: MessageHandler): void {
  messageHandler = handler;
}

export interface SessionInstance {
  botId: string;
  ownerId: string;
  sock: WASocket | null;
  status: BotStatus;
  reconnectAttempts: number;
  usePairing: boolean;
  phoneNumber?: string;
  startedAt: number;
}

interface CreateOptions {
  botId: string;
  ownerId: string;
  usePairing?: boolean;
  phoneNumber?: string;
}

function statusCodeOf(state: Partial<ConnectionState>): number | undefined {
  const err = state.lastDisconnect?.error as { output?: { statusCode?: number } } | undefined;
  return err?.output?.statusCode;
}

/**
 * Central registry and lifecycle controller for every WhatsApp connection.
 *
 * Each bot maps to exactly one independent {@link SessionInstance}. A crash in
 * one session never affects the others. Sessions are persisted on disk via
 * Baileys' multi-file auth state so they survive process restarts.
 */
class SessionManager {
  private readonly sessions = new Map<string, SessionInstance>();
  private readonly waLogger = pino({ level: 'silent' });

  private sessionDir(botId: string): string {
    return path.join(env.WA_SESSION_PATH, `bot_${botId}`);
  }

  exists(botId: string): boolean {
    return this.sessions.has(botId);
  }

  get(botId: string): SessionInstance | undefined {
    return this.sessions.get(botId);
  }

  getAll(): SessionInstance[] {
    return [...this.sessions.values()];
  }

  /** Create (or return existing) session and begin connecting. */
  async create(options: CreateOptions): Promise<SessionInstance> {
    const existing = this.sessions.get(options.botId);
    if (existing) return existing;

    const instance: SessionInstance = {
      botId: options.botId,
      ownerId: options.ownerId,
      sock: null,
      status: 'CONNECTING',
      reconnectAttempts: 0,
      usePairing: options.usePairing ?? false,
      phoneNumber: options.phoneNumber,
      startedAt: Date.now(),
    };
    this.sessions.set(options.botId, instance);
    await this.start(instance);
    return instance;
  }

  private async start(instance: SessionInstance): Promise<void> {
    const dir = this.sessionDir(instance.botId);
    await fs.mkdir(dir, { recursive: true });

    const { state, saveCreds } = await useMultiFileAuthState(dir);
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
      version,
      auth: state,
      logger: this.waLogger,
      printQRInTerminal: false,
      browser: Browsers.ubuntu('Chrome'),
      syncFullHistory: false,
      markOnlineOnConnect: false,
    });
    instance.sock = sock;

    // Request a pairing code instead of QR when the bot opted in.
    if (instance.usePairing && instance.phoneNumber && !sock.authState.creds.registered) {
      setTimeout(async () => {
        try {
          const code = await sock.requestPairingCode(instance.phoneNumber!.replace(/\D/g, ''));
          await this.persist(instance.botId, { pairingCode: code, status: 'PAIRING' });
          await this.setStatus(instance, 'PAIRING');
          engineEvents.emitEvent('pairing_code', {
            botId: instance.botId,
            ownerId: instance.ownerId,
            code,
          });
        } catch (err) {
          log.error({ err, botId: instance.botId }, 'failed to request pairing code');
        }
      }, 3000);
    }

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
      const { connection, qr } = update;

      if (qr && !instance.usePairing) {
        const dataUrl = await QRCode.toDataURL(qr);
        await this.persist(instance.botId, { qr: dataUrl, status: 'QR' });
        engineEvents.emitEvent('qr', {
          botId: instance.botId,
          ownerId: instance.ownerId,
          qr: dataUrl,
        });
      }

      if (connection === 'open') {
        instance.reconnectAttempts = 0;
        instance.startedAt = Date.now();
        const jid = sock.user?.id ?? '';
        await this.persist(instance.botId, {
          status: 'CONNECTED',
          jid,
          qr: null,
          pairingCode: null,
          lastConnectedAt: new Date(),
        });
        await prisma.bot.update({
          where: { id: instance.botId },
          data: {
            status: 'ONLINE',
            uptimeStartedAt: new Date(),
            phoneNumber: jid.split(':')[0]?.split('@')[0] ?? null,
            device: 'WhatsApp',
          },
        });
        await this.setStatus(instance, 'ONLINE');
        engineEvents.emitEvent('ready', { botId: instance.botId, ownerId: instance.ownerId, jid });
        this.emitLog(instance, 'info', 'connection', 'WhatsApp session connected');
      }

      if (connection === 'close') {
        const code = statusCodeOf(update);
        const loggedOut = code === DisconnectReason.loggedOut;
        if (loggedOut) {
          this.emitLog(instance, 'warn', 'connection', 'Session logged out');
          await this.handleLogout(instance);
        } else {
          await this.scheduleReconnect(instance, code);
        }
      }
    });

    sock.ev.on('messages.upsert', async (upsert) => {
      try {
        if (messageHandler) await messageHandler(instance, upsert);
        await prisma.bot.update({
          where: { id: instance.botId },
          data: { messagesHandled: { increment: upsert.messages.length } },
        }).catch(() => undefined);
      } catch (err) {
        log.error({ err, botId: instance.botId }, 'message handler failed');
      }
    });
  }

  private async scheduleReconnect(instance: SessionInstance, code?: number): Promise<void> {
    if (instance.reconnectAttempts >= env.WA_MAX_RECONNECT_ATTEMPTS) {
      this.emitLog(instance, 'error', 'connection', 'Max reconnect attempts reached');
      await this.setStatus(instance, 'OFFLINE');
      await this.persist(instance.botId, { status: 'DISCONNECTED' });
      await prisma.bot.update({ where: { id: instance.botId }, data: { status: 'OFFLINE' } });
      return;
    }
    instance.reconnectAttempts += 1;
    // Exponential backoff capped at 60s, avoids hammering WhatsApp servers.
    const delay = Math.min(60_000, 2 ** instance.reconnectAttempts * 1000);
    this.emitLog(
      instance,
      'warn',
      'connection',
      `Connection closed (code ${code ?? '?'}); reconnecting in ${delay / 1000}s`,
    );
    await this.setStatus(instance, 'CONNECTING');
    await prisma.waSession.update({
      where: { botId: instance.botId },
      data: { reconnectCount: { increment: 1 }, status: 'DISCONNECTED' },
    }).catch(() => undefined);
    setTimeout(() => {
      this.start(instance).catch((err) =>
        log.error({ err, botId: instance.botId }, 'reconnect failed'),
      );
    }, delay);
  }

  private async handleLogout(instance: SessionInstance): Promise<void> {
    await this.removeAuthFolder(instance.botId);
    await this.persist(instance.botId, { status: 'LOGGED_OUT', jid: null });
    await prisma.bot.update({ where: { id: instance.botId }, data: { status: 'OFFLINE' } });
    await this.setStatus(instance, 'OFFLINE', 'logged_out');
    this.sessions.delete(instance.botId);
  }

  /** Gracefully end the socket but keep credentials so it can reconnect later. */
  async disconnect(botId: string): Promise<void> {
    const instance = this.sessions.get(botId);
    if (!instance?.sock) return;
    instance.sock.end(undefined);
    this.sessions.delete(botId);
    await this.persist(botId, { status: 'DISCONNECTED' });
    await prisma.bot.update({ where: { id: botId }, data: { status: 'OFFLINE' } }).catch(() => undefined);
  }

  /** Log out from WhatsApp and delete stored credentials. */
  async logout(botId: string): Promise<void> {
    const instance = this.sessions.get(botId);
    try {
      await instance?.sock?.logout();
    } catch {
      /* socket may already be dead */
    }
    await this.removeAuthFolder(botId);
    this.sessions.delete(botId);
    await this.persist(botId, { status: 'LOGGED_OUT', jid: null });
    await prisma.bot.update({ where: { id: botId }, data: { status: 'OFFLINE' } }).catch(() => undefined);
  }

  async restart(botId: string, ownerId: string): Promise<void> {
    await this.disconnect(botId);
    await this.create({ botId, ownerId });
  }

  async destroy(botId: string): Promise<void> {
    await this.disconnect(botId);
    await this.removeAuthFolder(botId);
    this.sessions.delete(botId);
  }

  async requestPairingCode(botId: string, ownerId: string, phoneNumber: string): Promise<string> {
    let instance = this.sessions.get(botId);
    if (!instance) {
      instance = await this.create({ botId, ownerId, usePairing: true, phoneNumber });
    }
    instance.usePairing = true;
    instance.phoneNumber = phoneNumber;
    if (instance.sock && !instance.sock.authState.creds.registered) {
      const code = await instance.sock.requestPairingCode(phoneNumber.replace(/\D/g, ''));
      await this.persist(botId, { pairingCode: code, status: 'PAIRING' });
      return code;
    }
    // Will be emitted asynchronously by the connection.update handler.
    return '';
  }

  /**
   * Re-establish all sessions that were connected before a restart. Invalid /
   * logged-out sessions are skipped and cleaned up.
   */
  async recoverAll(): Promise<void> {
    const sessions = await prisma.waSession.findMany({
      where: { status: { in: ['CONNECTED', 'DISCONNECTED'] } },
      include: { bot: true },
    });
    log.info(`recovering ${sessions.length} WhatsApp session(s)`);
    for (const s of sessions) {
      try {
        await this.create({ botId: s.botId, ownerId: s.bot.ownerId });
      } catch (err) {
        log.error({ err, botId: s.botId }, 'session recovery failed');
      }
    }
  }

  async shutdown(): Promise<void> {
    for (const instance of this.sessions.values()) {
      try {
        instance.sock?.end(undefined);
      } catch {
        /* ignore */
      }
    }
    this.sessions.clear();
  }

  private async removeAuthFolder(botId: string): Promise<void> {
    await fs.rm(this.sessionDir(botId), { recursive: true, force: true }).catch(() => undefined);
  }

  private async persist(botId: string, data: SessionPersist): Promise<void> {
    await prisma.waSession
      .upsert({
        where: { botId },
        create: { botId, ...data },
        update: { ...data, lastSeenAt: new Date() },
      })
      .catch((err) => log.error({ err, botId }, 'failed to persist session state'));
  }

  private async setStatus(instance: SessionInstance, status: BotStatus, reason?: string): Promise<void> {
    instance.status = status;
    engineEvents.emitEvent('status', {
      botId: instance.botId,
      ownerId: instance.ownerId,
      status,
      reason,
    });
  }

  private emitLog(
    instance: SessionInstance,
    level: 'debug' | 'info' | 'warn' | 'error',
    source: string,
    message: string,
  ): void {
    engineEvents.emitEvent('log', {
      botId: instance.botId,
      ownerId: instance.ownerId,
      level,
      source,
      message,
    });
  }
}

export const sessionManager = new SessionManager();
