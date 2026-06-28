import { Redis } from 'ioredis';
import { env } from '../config/env';
import { logger } from '../config/logger';

/**
 * Redis connections.
 *
 * - `redis` is the general-purpose client (cache, rate-limit, pub/sub helpers).
 * - BullMQ requires connections with `maxRetriesPerRequest: null`, exposed via
 *   {@link createBullConnection}.
 */
export const redis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: 3,
  lazyConnect: true,
});

redis.on('error', (err) => logger.error({ err }, '[redis] connection error'));
redis.on('connect', () => logger.info('[redis] connected'));

export function createBullConnection(): Redis {
  return new Redis(env.REDIS_URL, { maxRetriesPerRequest: null });
}

export async function connectRedis(): Promise<void> {
  if (redis.status === 'wait' || redis.status === 'end') {
    await redis.connect();
  }
}

export async function disconnectRedis(): Promise<void> {
  await redis.quit();
}

/** Convenience cache helpers with JSON (de)serialisation. */
export const cache = {
  async get<T>(key: string): Promise<T | null> {
    const raw = await redis.get(key);
    return raw ? (JSON.parse(raw) as T) : null;
  },
  async set(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
    const raw = JSON.stringify(value);
    if (ttlSeconds) await redis.set(key, raw, 'EX', ttlSeconds);
    else await redis.set(key, raw);
  },
  async del(key: string): Promise<void> {
    await redis.del(key);
  },
};
