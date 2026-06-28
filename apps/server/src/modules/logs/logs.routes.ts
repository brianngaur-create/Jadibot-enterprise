import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../utils/async-handler';
import { requireAuth } from '../../middlewares/auth';
import { requirePermission } from '../../middlewares/rbac';
import { validate } from '../../middlewares/validate';
import { listQuerySchema } from '../../utils/pagination';
import { sendSuccess, paginationMeta } from '../../lib/response';
import type { ListQuery } from '../../utils/pagination';
import { logsService } from './logs.service';

const router = Router();
router.use(requireAuth, requirePermission('logs:read'));

const listSchema = listQuerySchema.extend({
  level: z.enum(['debug', 'info', 'warn', 'error']).optional(),
  source: z.string().optional(),
  botId: z.string().optional(),
});

router.get(
  '/',
  validate({ query: listSchema }),
  asyncHandler(async (req, res) => {
    const query = req.query as unknown as ListQuery & { level?: string; source?: string; botId?: string };
    const { items, total } = await logsService.list({ id: req.auth!.id, role: req.auth!.role }, query);
    return sendSuccess(res, items, 'Logs', 200, paginationMeta(total, query.page, query.pageSize));
  }),
);

export default router;
