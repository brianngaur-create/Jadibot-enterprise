import { Router } from 'express';
import { asyncHandler } from '../../utils/async-handler';
import { sendSuccess } from '../../lib/response';
import { prisma } from '../../lib/prisma';
import { redis } from '../../lib/redis';
import { sessionManager } from '../../whatsapp/session-manager';

const router = Router();

router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const [db, redisOk] = await Promise.all([
      prisma.$queryRaw`SELECT 1`.then(() => true).catch(() => false),
      redis.ping().then((r) => r === 'PONG').catch(() => false),
    ]);
    const healthy = db && redisOk;
    return sendSuccess(
      res,
      {
        status: healthy ? 'ok' : 'degraded',
        database: db ? 'up' : 'down',
        redis: redisOk ? 'up' : 'down',
        whatsapp: 'up',
        socket: 'up',
        sessions: sessionManager.getAll().length,
        timestamp: new Date().toISOString(),
      },
      'Health check',
      healthy ? 200 : 503,
    );
  }),
);

export default router;
