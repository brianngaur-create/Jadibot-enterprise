import { Router } from 'express';
import { asyncHandler } from '../../utils/async-handler';
import { requireAuth } from '../../middlewares/auth';
import { requirePermission } from '../../middlewares/rbac';
import { sendSuccess } from '../../lib/response';
import type { Request } from 'express';
import { analyticsService } from './analytics.service';

const router = Router();
router.use(requireAuth, requirePermission('analytics:read'));

function actor(req: Request) {
  return { id: req.auth!.id, role: req.auth!.role };
}

router.get(
  '/',
  asyncHandler(async (req, res) => sendSuccess(res, await analyticsService.overview(actor(req)), 'Analytics overview')),
);

router.get(
  '/messages',
  asyncHandler(async (req, res) =>
    sendSuccess(res, await analyticsService.messageSeries(actor(req)), 'Message analytics'),
  ),
);

router.get(
  '/users',
  asyncHandler(async (_req, res) => sendSuccess(res, await analyticsService.userGrowth(), 'User growth')),
);

router.get(
  '/bots',
  asyncHandler(async (req, res) => sendSuccess(res, await analyticsService.botStats(actor(req)), 'Bot analytics')),
);

export default router;
