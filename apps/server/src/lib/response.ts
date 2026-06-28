import type { Response } from 'express';

export interface SuccessEnvelope<T> {
  success: true;
  message: string;
  data: T;
  meta?: Record<string, unknown>;
}

export interface ErrorEnvelope {
  success: false;
  status: number;
  code: string;
  message: string;
  error?: unknown;
  details?: unknown;
}

/** Send a standardised success response: `{ success, message, data }`. */
export function sendSuccess<T>(
  res: Response,
  data: T,
  message = 'Success',
  status = 200,
  meta?: Record<string, unknown>,
): Response {
  const body: SuccessEnvelope<T> = { success: true, message, data };
  if (meta) body.meta = meta;
  return res.status(status).json(body);
}

/** Build a pagination `meta` object used by list endpoints. */
export function paginationMeta(total: number, page: number, pageSize: number) {
  return {
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}
