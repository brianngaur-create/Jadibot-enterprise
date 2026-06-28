import { PrismaClient } from '@prisma/client';
import { isProduction } from '../config/env';
import { logger } from '../config/logger';

/**
 * Shared Prisma client singleton. A single pooled client is reused across the
 * whole process to avoid exhausting database connections under load.
 */
export const prisma = new PrismaClient({
  log: isProduction ? ['error', 'warn'] : ['error', 'warn'],
});

export async function connectPrisma(): Promise<void> {
  await prisma.$connect();
  logger.info('[prisma] connected to PostgreSQL');
}

export async function disconnectPrisma(): Promise<void> {
  await prisma.$disconnect();
  logger.info('[prisma] disconnected');
}
