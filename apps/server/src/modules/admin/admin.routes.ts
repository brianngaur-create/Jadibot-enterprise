import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../utils/async-handler';
import { requireAuth } from '../../middlewares/auth';
import { requirePermission } from '../../middlewares/rbac';
import { validate } from '../../middlewares/validate';
import { listQuerySchema } from '../../utils/pagination';
import { sendSuccess, paginationMeta } from '../../lib/response';
import type { ListQuery } from '../../utils/pagination';
import { adminService } from './admin.service';

const router = Router();
router.use(requireAuth, requirePermission('admin:read'));

const idParam = z.object({ id: z.string().min(1) });
const updateUserSchema = z.object({
  status: z.enum(['ACTIVE', 'SUSPENDED', 'BANNED']).optional(),
  role: z.enum(['USER', 'ADMIN', 'SUPER_ADMIN']).optional(),
  plan: z.enum(['STARTER', 'PRO', 'ENTERPRISE']).optional(),
});
const maintenanceSchema = z.object({
  enabled: z.boolean(),
  message: z.string().max(280).optional(),
});

router.get(
  '/dashboard',
  asyncHandler(async (_req, res) => sendSuccess(res, await adminService.dashboard(), 'Admin dashboard')),
);

router.get(
  '/monitoring',
  requirePermission('admin:monitoring'),
  asyncHandler(async (_req, res) => sendSuccess(res, await adminService.monitoring(), 'Monitoring')),
);

router.get(
  '/users',
  requirePermission('admin:users'),
  validate({ query: listQuerySchema }),
  asyncHandler(async (req, res) => {
    const query = req.query as unknown as ListQuery;
    const { items, total } = await adminService.listUsers(query);
    return sendSuccess(res, items, 'Users', 200, paginationMeta(total, query.page, query.pageSize));
  }),
);

router.patch(
  '/users/:id',
  requirePermission('admin:users'),
  validate({ params: idParam, body: updateUserSchema }),
  asyncHandler(async (req, res) => sendSuccess(res, await adminService.updateUser(req.params.id, req.body), 'User updated')),
);

router.delete(
  '/users/:id',
  requirePermission('admin:users'),
  validate({ params: idParam }),
  asyncHandler(async (req, res) => {
    await adminService.deleteUser(req.params.id);
    return sendSuccess(res, null, 'User deleted');
  }),
);

router.get(
  '/maintenance',
  requirePermission('admin:maintenance'),
  asyncHandler(async (_req, res) => sendSuccess(res, await adminService.getMaintenance(), 'Maintenance status')),
);

router.post(
  '/maintenance',
  requirePermission('admin:maintenance'),
  validate({ body: maintenanceSchema }),
  asyncHandler(async (req, res) =>
    sendSuccess(res, await adminService.setMaintenance(req.body.enabled, req.body.message), 'Maintenance updated'),
  ),
);

export default router;
