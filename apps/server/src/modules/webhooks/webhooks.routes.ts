import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../utils/async-handler';
import { requireAuth } from '../../middlewares/auth';
import { requirePermission } from '../../middlewares/rbac';
import { validate } from '../../middlewares/validate';
import { sendSuccess } from '../../lib/response';
import { prisma } from '../../lib/prisma';
import { NotFoundError } from '../../lib/errors';

const router = Router();
router.use(requireAuth, requirePermission('bots:write'));

const createSchema = z.object({
  botId: z.string().optional(),
  url: z.string().url(),
  events: z.array(z.string()).default([]),
  secret: z.string().optional(),
});
const idParam = z.object({ id: z.string().min(1) });

router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const webhooks = await prisma.webhook.findMany({ orderBy: { createdAt: 'desc' } });
    return sendSuccess(res, webhooks, 'Webhooks');
  }),
);

router.post(
  '/',
  validate({ body: createSchema }),
  asyncHandler(async (req, res) => {
    const webhook = await prisma.webhook.create({ data: req.body });
    return sendSuccess(res, webhook, 'Webhook created', 201);
  }),
);

router.delete(
  '/:id',
  validate({ params: idParam }),
  asyncHandler(async (req, res) => {
    const existing = await prisma.webhook.findUnique({ where: { id: req.params.id } });
    if (!existing) throw new NotFoundError('Webhook not found');
    await prisma.webhook.delete({ where: { id: req.params.id } });
    return sendSuccess(res, null, 'Webhook deleted');
  }),
);

export default router;
