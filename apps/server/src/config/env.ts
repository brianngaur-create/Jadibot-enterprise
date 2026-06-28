import 'dotenv/config';
import { z } from 'zod';

/**
 * Centralised, type-safe environment configuration.
 *
 * Every value the application reads from `process.env` is validated here once at
 * startup. If a required variable is missing or malformed the process fails fast
 * with a readable error instead of breaking deep inside a request handler.
 */
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  API_PREFIX: z.string().startsWith('/').default('/api'),

  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  REDIS_URL: z.string().min(1, 'REDIS_URL is required'),

  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 chars'),
  JWT_REFRESH_SECRET: z.string().min(16, 'JWT_REFRESH_SECRET must be at least 16 chars'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  JWT_REFRESH_REMEMBER_EXPIRES_IN: z.string().default('30d'),
  BCRYPT_SALT_ROUNDS: z.coerce.number().int().min(10).max(15).default(12),

  AUTH_COOKIE_NAME: z.string().default('jb_refresh'),
  COOKIE_DOMAIN: z.string().default('localhost'),
  COOKIE_SECURE: z
    .string()
    .default('false')
    .transform((v) => v === 'true'),

  CORS_ORIGIN: z.string().default('http://localhost:3000'),

  WA_SESSION_PATH: z.string().default('./storage/sessions'),
  WA_MAX_RECONNECT_ATTEMPTS: z.coerce.number().int().positive().default(10),

  GOOGLE_CLIENT_ID: z.string().optional().default(''),
  GOOGLE_CLIENT_SECRET: z.string().optional().default(''),
  GOOGLE_CALLBACK_URL: z.string().optional().default(''),

  LOG_LEVEL: z
    .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace'])
    .default('info'),

  SEED_ADMIN_EMAIL: z.string().email().default('admin@jadibot.local'),
  SEED_ADMIN_PASSWORD: z.string().min(8).default('Admin#12345'),
  SEED_ADMIN_NAME: z.string().default('Super Admin'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((i) => `  - ${i.path.join('.')}: ${i.message}`)
    .join('\n');
  // eslint-disable-next-line no-console
  console.error(`\n[config] Invalid environment configuration:\n${issues}\n`);
  process.exit(1);
}

export const env = parsed.data;

export const isProduction = env.NODE_ENV === 'production';
export const isTest = env.NODE_ENV === 'test';

/**
 * Refuse to boot in production with the placeholder secrets shipped in
 * `.env.example`. This prevents accidentally running a public deployment with
 * publicly-known JWT signing keys (which would let anyone forge tokens).
 */
if (isProduction) {
  const insecure: string[] = [];
  if (/change_me/i.test(env.JWT_SECRET)) insecure.push('JWT_SECRET');
  if (/change_me/i.test(env.JWT_REFRESH_SECRET)) insecure.push('JWT_REFRESH_SECRET');
  if (env.JWT_SECRET === env.JWT_REFRESH_SECRET) insecure.push('JWT_SECRET/JWT_REFRESH_SECRET must differ');
  if (insecure.length) {
    // eslint-disable-next-line no-console
    console.error(
      `\n[config] Refusing to start in production with insecure default secrets:\n  - ${insecure.join(
        '\n  - ',
      )}\nGenerate strong values: node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"\n`,
    );
    process.exit(1);
  }
}

/** Allowed CORS origins, parsed from the comma-separated CORS_ORIGIN var. */
export const corsOrigins = env.CORS_ORIGIN.split(',')
  .map((o) => o.trim())
  .filter(Boolean);
