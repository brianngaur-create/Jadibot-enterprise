import pino from 'pino';
import { env, isProduction } from './env';

/**
 * Application-wide Pino logger.
 *
 * In development we pretty-print for readability; in production we emit
 * structured JSON which plays nicely with log aggregators (Loki, Datadog, ...).
 */
export const logger = pino({
  level: env.LOG_LEVEL,
  base: { service: 'jadibot-server' },
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'password',
      '*.password',
      'token',
      '*.token',
    ],
    censor: '[redacted]',
  },
  transport: isProduction
    ? undefined
    : {
        target: 'pino-pretty',
        options: { colorize: true, translateTime: 'SYS:HH:MM:ss', ignore: 'pid,hostname,service' },
      },
});

/** Create a child logger scoped to a subsystem (e.g. "whatsapp", "queue"). */
export function scopedLogger(scope: string) {
  return logger.child({ scope });
}
