import type { LogLevel } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { scopedLogger } from '../config/logger';
import { engineEvents } from './engine-events';
import { emitNotification } from '../socket';

const log = scopedLogger('persistence');

const LEVEL_MAP: Record<'debug' | 'info' | 'warn' | 'error', LogLevel> = {
  debug: 'DEBUG',
  info: 'INFO',
  warn: 'WARN',
  error: 'ERROR',
};

/**
 * Persist engine events to the database: connection/command logs become rows in
 * the `Log` table and important status changes create user notifications. Wiring
 * this through the event bus keeps the engine itself storage-agnostic.
 */
export function initPersistence(): void {
  engineEvents.onEvent('log', (p) => {
    prisma.log
      .create({
        data: {
          botId: p.botId ?? null,
          level: LEVEL_MAP[p.level],
          source: p.source,
          message: p.message,
        },
      })
      .catch((err) => log.error({ err }, 'failed to persist log'));
  });

  engineEvents.onEvent('status', (p) => {
    if (p.status === 'OFFLINE' && p.reason === 'logged_out') {
      prisma.notification
        .create({
          data: {
            userId: p.ownerId,
            type: 'WARNING',
            title: 'Bot disconnected',
            message: 'Your WhatsApp session was logged out. Please reconnect.',
          },
        })
        .then((n) =>
          emitNotification(p.ownerId, {
            id: n.id,
            type: 'warning',
            title: n.title,
            message: n.message,
            time: n.createdAt.toISOString(),
            read: false,
          }),
        )
        .catch((err) => log.error({ err }, 'failed to create notification'));
    }
  });
}
