import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../utils/async-handler';
import { requireAuth } from '../../middlewares/auth';
import { requirePermission } from '../../middlewares/rbac';
import { validate } from '../../middlewares/validate';
import { listQuerySchema } from '../../utils/pagination';
import { sendSuccess, paginationMeta } from '../../lib/response';
import type { ListQuery } from '../../utils/pagination';
import { commandsService } from './commands.service';

const router = Router();
router.use(requireAuth);

const listSchema = listQuerySchema.extend({ category: z.string().optional() });
const updateSchema = z.object({ enabled: z.boolean().optional() });
const idParam = z.object({ id: z.string().min(1) });

router.get(
  '/',
  requirePermission('commands:read'),
  validate({ query: listSchema }),
  asyncHandler(async (req, res) => {
    const query = req.query as unknown as ListQuery & { category?: string };
    const { items, total } = await commandsService.list(query);
    return sendSuccess(res, items, 'Commands', 200, paginationMeta(total, query.page, query.pageSize));
  }),
);

router.post(
  '/reload',
  requirePermission('commands:write'),
  asyncHandler(async (_req, res) => {
    const data = await commandsService.reload();
    return sendSuccess(res, data, 'Commands reloaded');
  }),
);

router.patch(
  '/:id',
  requirePermission('commands:write'),
  validate({ params: idParam, body: updateSchema }),
  asyncHandler(async (req, res) => {
    const command = await commandsService.update(req.params.id, req.body);
    return sendSuccess(res, command, 'Command updated');
  }),
);

export default router;
