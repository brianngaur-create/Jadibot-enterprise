import { EventEmitter } from 'node:events';
import type { BotStatus } from '@prisma/client';

/**
 * Decoupling layer between the WhatsApp engine and the realtime (Socket.IO) and
 * persistence layers. The engine only emits typed events here; the socket
 * gateway and queue workers subscribe. This avoids circular imports between the
 * engine and the socket server.
 */
export interface EngineEventMap {
  qr: { botId: string; ownerId: string; qr: string };
  pairing_code: { botId: string; ownerId: string; code: string };
  status: { botId: string; ownerId: string; status: BotStatus; reason?: string };
  ready: { botId: string; ownerId: string; jid: string };
  message: {
    botId: string;
    ownerId: string;
    from: string;
    body: string;
    fromMe: boolean;
  };
  log: {
    botId?: string;
    ownerId?: string;
    level: 'debug' | 'info' | 'warn' | 'error';
    source: string;
    message: string;
  };
}

class TypedEmitter extends EventEmitter {
  emitEvent<K extends keyof EngineEventMap>(event: K, payload: EngineEventMap[K]): void {
    this.emit(event, payload);
  }

  onEvent<K extends keyof EngineEventMap>(
    event: K,
    listener: (payload: EngineEventMap[K]) => void,
  ): void {
    this.on(event, listener as (payload: unknown) => void);
  }
}

export const engineEvents = new TypedEmitter();
engineEvents.setMaxListeners(0);
