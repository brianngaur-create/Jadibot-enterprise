import type { NextFunction, Request, Response } from 'express';
import type { Role } from '@prisma/client';
import { ForbiddenError, UnauthorizedError } from '../lib/errors';
import { hasPermission, isRoleAtLeast, type Permission } from '../constants/permissions';

/** Require the authenticated user to hold a specific permission. */
export function requirePermission(...permissions: Permission[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.auth) throw new UnauthorizedError();
    const ok = permissions.every((p) => hasPermission(req.auth!.role, p));
    if (!ok) throw new ForbiddenError('You do not have permission to perform this action');
    next();
  };
}

/** Require the user to have at least the given role in the hierarchy. */
export function requireRole(minimum: Role) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.auth) throw new UnauthorizedError();
    if (!isRoleAtLeast(req.auth.role, minimum)) {
      throw new ForbiddenError('Insufficient role');
    }
    next();
  };
}
