import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../utils/async-handler';
import { requireAuth } from '../../middlewares/auth';
import { requirePermission } from '../../middlewares/rbac';
import { validate } from '../../middlewares/validate';
import { listQuerySchema } from '../../utils/pagination';
import { sendSuccess, paginationMeta } from '../../lib/response';
import type { ListQuery } from '../../utils/pagination';
import { pluginsService } from './plugins.service';

const router = Router();
router.use(requireAuth);

const installSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  category: z.string().optional(),
  version: z.string().optional(),
  author: z.string().optional(),
  source: z.string().optional(),
});

const updateSchema = z.object({ status: z.enum(['active', 'inactive']).optional() });
const idParam = z.object({ id: z.string().min(1) });

router.get(
  '/',
  requirePermission('plugins:read'),
  validate({ query: listQuerySchema }),
  asyncHandler(async (req, res) => {
    const query = req.query as unknown as ListQuery;
    const { items, total } = await pluginsService.list(query);
    return sendSuccess(res, items, 'Plugins', 200, paginationMeta(total, query.page, query.pageSize));
  }),
);

router.post(
  '/install',
  requirePermission('plugins:write'),
  validate({ body: installSchema }),
  asyncHandler(async (req, res) => {
    const plugin = await pluginsService.install(req.body);
    return sendSuccess(res, plugin, 'Plugin installed', 201);
  }),
);

router.post(
  '/reload',
  requirePermission('plugins:write'),
  asyncHandler(async (_req, res) => {
    const data = await pluginsService.reload();
    return sendSuccess(res, data, 'Plugins reloaded');
  }),
);

router.patch(
  '/:id',
  requirePermission('plugins:write'),
  validate({ params: idParam, body: updateSchema }),
  asyncHandler(async (req, res) => {
    const plugin = await pluginsService.update(req.params.id, req.body);
    return sendSuccess(res, plugin, 'Plugin updated');
  }),
);

router.delete(
  '/:id',
  requirePermission('plugins:write'),
  validate({ params: idParam }),
  asyncHandler(async (req, res) => {
    await pluginsService.remove(req.params.id);
    return sendSuccess(res, null, 'Plugin removed');
  }),
);

export default router;
