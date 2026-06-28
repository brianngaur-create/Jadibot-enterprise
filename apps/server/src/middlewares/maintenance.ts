import type { NextFunction, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { isRoleAtLeast } from '../constants/permissions';
import type { ErrorEnvelope } from '../lib/response';

let cache: { enabled: boolean; message: string; expires: number } | null = null;

async function getMaintenance() {
  if (cache && cache.expires > Date.now()) return cache;
  const setting = await prisma.setting.findUnique({ where: { key: 'maintenance_mode' } });
  const value = (setting?.value as { enabled?: boolean; message?: string }) ?? {};
  cache = {
    enabled: Boolean(value.enabled),
    message: value.message ?? 'The platform is under maintenance. Please try again shortly.',
    expires: Date.now() + 10_000,
  };
  return cache;
}

/**
 * Blocks non-admin traffic when maintenance mode is enabled. Admins and the auth
 * endpoints stay reachable so operators can still sign in and toggle it off.
 */
export async function maintenanceGuard(req: Request, res: Response, next: NextFunction): Promise<void> {
  if (req.path.startsWith('/auth') || req.path.startsWith('/health') || req.path.startsWith('/admin')) {
    return next();
  }
  const state = await getMaintenance();
  if (!state.enabled) return next();
  if (req.auth && isRoleAtLeast(req.auth.role, 'ADMIN')) return next();

  const body: ErrorEnvelope = {
    success: false,
    status: 503,
    code: 'MAINTENANCE',
    message: state.message,
  };
  res.status(503).json(body);
}
