import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../utils/async-handler';
import { requireAuth } from '../../middlewares/auth';
import { requirePermission } from '../../middlewares/rbac';
import { validate } from '../../middlewares/validate';
import { sendSuccess } from '../../lib/response';
import type { Request } from 'express';
import { usersService } from './users.service';

const router = Router();
router.use(requireAuth);

function actor(req: Request) {
  return { id: req.auth!.id, role: req.auth!.role };
}

const updateSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  avatarInitials: z.string().min(1).max(3).optional(),
});
const passwordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(128),
});
const idParam = z.object({ id: z.string().min(1) });

router.get(
  '/me',
  requirePermission('profile:read'),
  asyncHandler(async (req, res) => sendSuccess(res, await usersService.get(req.auth!.id, actor(req)), 'Profile')),
);

router.patch(
  '/me',
  requirePermission('profile:write'),
  validate({ body: updateSchema }),
  asyncHandler(async (req, res) =>
    sendSuccess(res, await usersService.update(req.auth!.id, actor(req), req.body), 'Profile updated'),
  ),
);

router.post(
  '/me/password',
  requirePermission('profile:write'),
  validate({ body: passwordSchema }),
  asyncHandler(async (req, res) => {
    await usersService.changePassword(req.auth!.id, req.body.currentPassword, req.body.newPassword);
    return sendSuccess(res, null, 'Password changed');
  }),
);

router.get(
  '/me/settings',
  requirePermission('settings:read'),
  asyncHandler(async (req, res) => sendSuccess(res, await usersService.getSettings(req.auth!.id), 'Settings')),
);

router.patch(
  '/me/settings',
  requirePermission('settings:write'),
  validate({ body: z.record(z.unknown()) }),
  asyncHandler(async (req, res) =>
    sendSuccess(res, await usersService.updateSettings(req.auth!.id, req.body), 'Settings updated'),
  ),
);

router.get(
  '/:id',
  requirePermission('profile:read'),
  validate({ params: idParam }),
  asyncHandler(async (req, res) => sendSuccess(res, await usersService.get(req.params.id, actor(req)), 'User')),
);

router.patch(
  '/:id',
  requirePermission('profile:write'),
  validate({ params: idParam, body: updateSchema }),
  asyncHandler(async (req, res) =>
    sendSuccess(res, await usersService.update(req.params.id, actor(req), req.body), 'User updated'),
  ),
);

export default router;
