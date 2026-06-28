import type { Server as HttpServer } from 'node:http';
import { Server, type Namespace, type Socket } from 'socket.io';
import { corsOrigins } from '../config/env';
import { scopedLogger } from '../config/logger';
import { verifyAccessToken } from '../lib/jwt';
import { engineEvents } from '../whatsapp/engine-events';

const log = scopedLogger('socket');

let io: Server | null = null;

interface SocketAuth {
  id: string;
  role: string;
}

/** JWT handshake authentication shared by every namespace. */
function authMiddleware(socket: Socket, next: (err?: Error) => void): void {
  const token = (socket.handshake.auth?.token as string) || '';
  if (!token) return next(new Error('unauthorized'));
  try {
    const payload = verifyAccessToken(token);
    (socket.data as { auth: SocketAuth }).auth = { id: payload.sub, role: payload.role };
    next();
  } catch {
    next(new Error('unauthorized'));
  }
}

function room(ownerId: string): string {
  return `user:${ownerId}`;
}

function registerNamespace(nsp: Namespace): void {
  nsp.use(authMiddleware);
  nsp.on('connection', (socket) => {
    const auth = (socket.data as { auth: SocketAuth }).auth;
    socket.join(room(auth.id));
    log.debug({ user: auth.id, nsp: nsp.name }, 'socket connected');

    socket.on('disconnect', () => {
      log.debug({ user: auth.id, nsp: nsp.name }, 'socket disconnected');
    });
  });
}

/**
 * Initialise the Socket.IO server, its authenticated namespaces and the bridge
 * that forwards WhatsApp engine events to the owning user's room in realtime.
 */
export function initSocket(httpServer: HttpServer): Server {
  io = new Server(httpServer, {
    cors: { origin: corsOrigins.length ? corsOrigins : true, credentials: true },
    transports: ['websocket', 'polling'],
  });

  const root = io.of('/');
  const bots = io.of('/bots');
  const sessions = io.of('/sessions');
  registerNamespace(root);
  registerNamespace(bots);
  registerNamespace(sessions);

  const emitToOwner = (ownerId: string, event: string, payload: unknown) => {
    bots.to(room(ownerId)).emit(event, payload);
    sessions.to(room(ownerId)).emit(event, payload);
    root.to(room(ownerId)).emit(event, payload);
  };

  engineEvents.onEvent('qr', (p) => emitToOwner(p.ownerId, 'qr', p));
  engineEvents.onEvent('pairing_code', (p) => emitToOwner(p.ownerId, 'pairing_code', p));
  engineEvents.onEvent('status', (p) => {
    emitToOwner(p.ownerId, 'status', p);
    emitToOwner(p.ownerId, 'bot_status', p);
    emitToOwner(p.ownerId, 'session_status', p);
  });
  engineEvents.onEvent('ready', (p) => emitToOwner(p.ownerId, 'connected', p));
  engineEvents.onEvent('message', (p) => emitToOwner(p.ownerId, 'message', p));
  engineEvents.onEvent('log', (p) => {
    if (p.ownerId) emitToOwner(p.ownerId, 'log', p);
  });

  log.info('Socket.IO initialised (/, /bots, /sessions)');
  return io;
}

/** Emit a notification to a specific user (used by services/workers). */
export function emitNotification(userId: string, payload: unknown): void {
  io?.of('/').to(room(userId)).emit('notification', payload);
}

export function getIo(): Server | null {
  return io;
}
