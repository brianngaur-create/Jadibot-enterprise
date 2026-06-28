import { Router } from 'express';
import { asyncHandler } from '../../utils/async-handler';
import { requireAuth } from '../../middlewares/auth';
import { requirePermission } from '../../middlewares/rbac';
import { validate } from '../../middlewares/validate';
import { listQuerySchema } from '../../utils/pagination';
import {
  botIdParam,
  botSettingsSchema,
  createBotSchema,
  updateBotSchema,
} from './bots.validators';
import { botsController } from './bots.controller';

const router = Router();
router.use(requireAuth);

router.get(
  '/',
  requirePermission('bots:read'),
  validate({ query: listQuerySchema }),
  asyncHandler(botsController.list),
);

router.post(
  '/',
  requirePermission('bots:write'),
  validate({ body: createBotSchema }),
  asyncHandler(botsController.create),
);

router.get(
  '/:id',
  requirePermission('bots:read'),
  validate({ params: botIdParam }),
  asyncHandler(botsController.get),
);

router.patch(
  '/:id',
  requirePermission('bots:write'),
  validate({ params: botIdParam, body: updateBotSchema }),
  asyncHandler(botsController.update),
);

router.patch(
  '/:id/settings',
  requirePermission('bots:write'),
  validate({ params: botIdParam, body: botSettingsSchema }),
  asyncHandler(botsController.updateSettings),
);

router.post(
  '/:id/restart',
  requirePermission('bots:write'),
  validate({ params: botIdParam }),
  asyncHandler(botsController.restart),
);

router.delete(
  '/:id',
  requirePermission('bots:delete'),
  validate({ params: botIdParam }),
  asyncHandler(botsController.remove),
);

export default router;
