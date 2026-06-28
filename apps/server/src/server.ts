import { createServer } from 'node:http';
import { createApp } from './app';
import { env } from './config/env';
import { logger } from './config/logger';
import { connectPrisma, disconnectPrisma } from './lib/prisma';
import { connectRedis, disconnectRedis } from './lib/redis';
import { initSocket } from './socket';
import { initCommandSystem } from './whatsapp/command-loader';
import { loadPlugins } from './whatsapp/plugin-loader';
import { initPersistence } from './whatsapp/persistence';
import { sessionManager } from './whatsapp/session-manager';
import { startQueues, stopQueues } from './queues';

async function bootstrap(): Promise<void> {
  await connectPrisma();
  await connectRedis();

  const app = createApp();
  const httpServer = createServer(app);
  initSocket(httpServer);

  // Realtime persistence + command/plugin systems must be ready before sessions
  // start producing events.
  initPersistence();
  await initCommandSystem();
  await loadPlugins();
  await startQueues();

  httpServer.listen(env.PORT, () => {
    logger.info(`JadiBot server listening on http://localhost:${env.PORT}${env.API_PREFIX}`);
    logger.info(`API docs at http://localhost:${env.PORT}${env.API_PREFIX}/docs`);
  });

  // Recover previously-connected WhatsApp sessions in the background so startup
  // is not blocked by network handshakes.
  sessionManager.recoverAll().catch((err) => logger.error({ err }, 'session recovery failed'));

  const shutdown = async (signal: string): Promise<void> => {
    logger.info(`received ${signal}, shutting down gracefully`);
    httpServer.close();
    await sessionManager.shutdown();
    await stopQueues();
    await disconnectRedis();
    await disconnectPrisma();
    process.exit(0);
  };

  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('unhandledRejection', (reason) => logger.error({ reason }, 'unhandled rejection'));
  process.on('uncaughtException', (err) => logger.fatal({ err }, 'uncaught exception'));
}

bootstrap().catch((err) => {
  logger.fatal({ err }, 'failed to start server');
  process.exit(1);
});
