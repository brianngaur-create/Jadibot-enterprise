import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../utils/async-handler';
import { requireAuth } from '../../middlewares/auth';
import { requirePermission } from '../../middlewares/rbac';
import { validate } from '../../middlewares/validate';
import { sendSuccess } from '../../lib/response';
import { apiKeysService } from './apikeys.service';

const router = Router();
router.use(requireAuth);

const createSchema = z.object({
  name: z.string().min(1).max(80),
  scope: z.array(z.string()).optional(),
});
const idParam = z.object({ id: z.string().min(1) });

router.get(
  '/',
  requirePermission('api-keys:read'),
  asyncHandler(async (req, res) => sendSuccess(res, await apiKeysService.list(req.auth!.id), 'API keys')),
);

router.post(
  '/',
  requirePermission('api-keys:write'),
  validate({ body: createSchema }),
  asyncHandler(async (req, res) => {
    const key = await apiKeysService.create(req.auth!.id, req.body);
    return sendSuccess(res, key, 'API key created — copy it now, it will not be shown again', 201);
  }),
);

router.delete(
  '/:id',
  requirePermission('api-keys:delete'),
  validate({ params: idParam }),
  asyncHandler(async (req, res) => {
    await apiKeysService.revoke(req.auth!.id, req.params.id);
    return sendSuccess(res, null, 'API key revoked');
  }),
);

export default router;
