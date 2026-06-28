import type { NextFunction, Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';
import { AppError } from '../lib/errors';
import type { ErrorEnvelope } from '../lib/response';
import { logger } from '../config/logger';
import { isProduction } from '../config/env';

/** 404 handler for unmatched routes. */
export function notFoundHandler(req: Request, res: Response): void {
  const body: ErrorEnvelope = {
    success: false,
    status: 404,
    code: 'NOT_FOUND',
    message: `Route ${req.method} ${req.originalUrl} not found`,
  };
  res.status(404).json(body);
}

/**
 * Global error handler. Normalises every thrown error — AppError, Zod, Prisma or
 * unknown — into the standard `{ success, status, code, message, error }` shape.
 */
export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  let status = 500;
  let code = 'INTERNAL_ERROR';
  let message = 'Something went wrong';
  let details: unknown;

  if (err instanceof AppError) {
    status = err.status;
    code = err.code;
    message = err.message;
    details = err.details;
  } else if (err instanceof ZodError) {
    status = 422;
    code = 'VALIDATION_ERROR';
    message = 'Validation failed';
    details = err.flatten();
  } else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      status = 409;
      code = 'CONFLICT';
      message = 'A record with these details already exists';
      details = err.meta;
    } else if (err.code === 'P2025') {
      status = 404;
      code = 'NOT_FOUND';
      message = 'Record not found';
    } else {
      status = 400;
      code = 'DATABASE_ERROR';
      message = 'Database request failed';
    }
  } else if (err instanceof Error) {
    message = err.message || message;
  }

  if (status >= 500) {
    logger.error({ err, reqId: req.id, path: req.originalUrl }, 'unhandled error');
  } else {
    logger.warn({ code, reqId: req.id, path: req.originalUrl, message }, 'request error');
  }

  const body: ErrorEnvelope = {
    success: false,
    status,
    code,
    message,
    error: details ?? message,
    details,
  };

  if (isProduction && status >= 500) {
    body.message = 'Internal server error';
    body.error = undefined;
    body.details = undefined;
  }

  res.status(status).json(body);
}
