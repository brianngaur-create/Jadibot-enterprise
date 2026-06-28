import crypto from 'node:crypto';
import express, { type Express, type NextFunction, type Request, type Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import pinoHttp from 'pino-http';
import swaggerUi from 'swagger-ui-express';
import { env, corsOrigins } from './config/env';
import { logger } from './config/logger';
import { buildApiRouter } from './routes';
import { errorHandler, notFoundHandler } from './middlewares/error';
import { apiLimiter } from './middlewares/rate-limit';
import { optionalAuth } from './middlewares/auth';
import { maintenanceGuard } from './middlewares/maintenance';
import { openapiSpec } from './docs/openapi';

/** Build and configure the Express application (without starting it listening). */
export function createApp(): Express {
  const app = express();

  app.set('trust proxy', 1);

  // Correlation id for every request — surfaced in logs and error responses.
  app.use((req: Request, res: Response, next: NextFunction) => {
    req.id = (req.headers['x-request-id'] as string) || crypto.randomUUID();
    res.setHeader('x-request-id', req.id);
    next();
  });

  app.use(
    pinoHttp({
      logger,
      genReqId: (req) => (req as Request).id ?? crypto.randomUUID(),
      autoLogging: { ignore: (req) => req.url === `${env.API_PREFIX}/health` },
    }),
  );

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      contentSecurityPolicy: env.NODE_ENV === 'production' ? undefined : false,
    }),
  );
  app.use(
    cors({
      origin: corsOrigins.length ? corsOrigins : true,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-CSRF-Token',
        'X-Requested-With',
        'X-Device-Id',
        'X-API-Key',
        'X-Request-Id',
      ],
    }),
  );
  app.use(compression());
  app.use(express.json({ limit: '5mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  // API documentation (Swagger UI).
  app.use(`${env.API_PREFIX}/docs`, swaggerUi.serve, swaggerUi.setup(openapiSpec));
  app.get(`${env.API_PREFIX}/openapi.json`, (_req, res) => res.json(openapiSpec));

  // Global throttle + maintenance gating. optionalAuth lets the maintenance
  // guard recognise admins even before route-level auth runs.
  app.use(env.API_PREFIX, apiLimiter, optionalAuth, maintenanceGuard, buildApiRouter());

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
