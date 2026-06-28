import { Router } from 'express';
import { asyncHandler } from '../../utils/async-handler';
import { requireAuth } from '../../middlewares/auth';
import { requirePermission } from '../../middlewares/rbac';
import { validate } from '../../middlewares/validate';
import { qrLimiter } from '../../middlewares/rate-limit';
import { botRefSchema, pairingSchema, sessionIdParam } from './sessions.validators';
import { sessionsController } from './sessions.controller';

const router = Router();
router.use(requireAuth);

router.get('/', requirePermission('sessions:read'), asyncHandler(sessionsController.list));

router.post(
  '/create',
  requirePermission('sessions:write'),
  validate({ body: botRefSchema }),
  asyncHandler(sessionsController.create),
);

router.post(
  '/qr',
  qrLimiter,
  requirePermission('sessions:write'),
  validate({ body: botRefSchema }),
  asyncHandler(sessionsController.qr),
);

router.post(
  '/pairing-code',
  qrLimiter,
  requirePermission('sessions:write'),
  validate({ body: pairingSchema }),
  asyncHandler(sessionsController.pairing),
);

router.post(
  '/reconnect',
  requirePermission('sessions:write'),
  validate({ body: botRefSchema }),
  asyncHandler(sessionsController.reconnect),
);

router.post(
  '/disconnect',
  requirePermission('sessions:write'),
  validate({ body: botRefSchema }),
  asyncHandler(sessionsController.disconnect),
);

router.post(
  '/logout',
  requirePermission('sessions:write'),
  validate({ body: botRefSchema }),
  asyncHandler(sessionsController.logout),
);

router.delete(
  '/:id',
  requirePermission('sessions:write'),
  validate({ params: sessionIdParam }),
  asyncHandler(sessionsController.destroy),
);

export default router;
