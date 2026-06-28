import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../utils/async-handler';
import { requireAuth } from '../../middlewares/auth';
import { requirePermission } from '../../middlewares/rbac';
import { validate } from '../../middlewares/validate';
import { listQuerySchema } from '../../utils/pagination';
import { sendSuccess, paginationMeta } from '../../lib/response';
import type { ListQuery } from '../../utils/pagination';
import { notificationsService } from './notifications.service';

const router = Router();
router.use(requireAuth, requirePermission('notifications:read'));

router.get(
  '/',
  validate({ query: listQuerySchema }),
  asyncHandler(async (req, res) => {
    const query = req.query as unknown as ListQuery;
    const { items, total, unread } = await notificationsService.list(req.auth!.id, query);
    return sendSuccess(res, items, 'Notifications', 200, {
      ...paginationMeta(total, query.page, query.pageSize),
      unread,
    });
  }),
);

router.patch(
  '/read',
  validate({ body: z.object({ id: z.string().min(1) }) }),
  asyncHandler(async (req, res) => {
    await notificationsService.markRead(req.auth!.id, req.body.id);
    return sendSuccess(res, null, 'Notification marked as read');
  }),
);

router.patch(
  '/read-all',
  asyncHandler(async (req, res) => {
    await notificationsService.markAllRead(req.auth!.id);
    return sendSuccess(res, null, 'All notifications marked as read');
  }),
);

export default router;
