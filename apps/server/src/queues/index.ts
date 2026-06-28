import { Queue, Worker, type Job } from 'bullmq';
import { createBullConnection } from '../lib/redis';
import { scopedLogger } from '../config/logger';
import { prisma } from '../lib/prisma';

const log = scopedLogger('queue');

const QUEUE_NAME = 'jadibot-maintenance';

let queue: Queue | null = null;
let worker: Worker | null = null;

interface JobData {
  task: 'aggregate-analytics' | 'cleanup-logs' | 'cleanup-tokens';
}

async function aggregateAnalytics(): Promise<void> {
  const bots = await prisma.bot.findMany({ select: { id: true, messagesHandled: true, activeUsers: true } });
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (const bot of bots) {
    await prisma.analyticsDaily.upsert({
      where: { date_botId: { date: today, botId: bot.id } },
      create: { date: today, botId: bot.id, messages: bot.messagesHandled, activeUsers: bot.activeUsers },
      update: { messages: bot.messagesHandled, activeUsers: bot.activeUsers },
    });
  }
}

async function cleanupLogs(): Promise<void> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 30);
  const { count } = await prisma.log.deleteMany({ where: { createdAt: { lt: cutoff } } });
  if (count) log.info(`cleaned ${count} old log(s)`);
}

async function cleanupTokens(): Promise<void> {
  const { count } = await prisma.refreshToken.deleteMany({
    where: { OR: [{ expiresAt: { lt: new Date() } }, { revokedAt: { not: null } }] },
  });
  if (count) log.info(`pruned ${count} expired/revoked token(s)`);
}

async function process(job: Job<JobData>): Promise<void> {
  switch (job.data.task) {
    case 'aggregate-analytics':
      return aggregateAnalytics();
    case 'cleanup-logs':
      return cleanupLogs();
    case 'cleanup-tokens':
      return cleanupTokens();
    default:
      log.warn({ task: job.data.task }, 'unknown job');
  }
}

/** Start the BullMQ queue, worker and the repeatable maintenance schedule. */
export async function startQueues(): Promise<void> {
  const connection = createBullConnection();
  queue = new Queue(QUEUE_NAME, { connection });
  worker = new Worker<JobData>(QUEUE_NAME, process, { connection });

  worker.on('failed', (job, err) => log.error({ err, job: job?.id }, 'job failed'));

  // Repeatable jobs — analytics every 15m, cleanup daily.
  await queue.add(
    'aggregate-analytics',
    { task: 'aggregate-analytics' },
    { repeat: { every: 15 * 60 * 1000 }, removeOnComplete: true, removeOnFail: 50 },
  );
  await queue.add(
    'cleanup-logs',
    { task: 'cleanup-logs' },
    { repeat: { pattern: '0 3 * * *' }, removeOnComplete: true, removeOnFail: 50 },
  );
  await queue.add(
    'cleanup-tokens',
    { task: 'cleanup-tokens' },
    { repeat: { pattern: '0 4 * * *' }, removeOnComplete: true, removeOnFail: 50 },
  );

  log.info('queues started');
}

export async function stopQueues(): Promise<void> {
  await worker?.close();
  await queue?.close();
}
