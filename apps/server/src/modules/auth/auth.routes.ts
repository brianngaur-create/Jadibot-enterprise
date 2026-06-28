import { Router } from 'express';
import { asyncHandler } from '../../utils/async-handler';
import { validate } from '../../middlewares/validate';
import { requireAuth } from '../../middlewares/auth';
import {
  loginLimiter,
  registerLimiter,
  forgotPasswordLimiter,
} from '../../middlewares/rate-limit';
import {
  forgotPasswordSchema,
  loginSchema,
  refreshSchema,
  registerSchema,
  resetPasswordSchema,
} from './auth.validators';
import { authController } from './auth.controller';

const router = Router();

router.post(
  '/register',
  registerLimiter,
  validate({ body: registerSchema }),
  asyncHandler(authController.register),
);

router.post(
  '/login',
  loginLimiter,
  validate({ body: loginSchema }),
  asyncHandler(authController.login),
);

router.post(
  '/refresh',
  validate({ body: refreshSchema }),
  asyncHandler(authController.refresh),
);

router.post('/logout', asyncHandler(authController.logout));
router.post('/logout-all', requireAuth, asyncHandler(authController.logoutAll));

router.post(
  '/forgot-password',
  forgotPasswordLimiter,
  validate({ body: forgotPasswordSchema }),
  asyncHandler(authController.forgotPassword),
);

router.post(
  '/reset-password',
  validate({ body: resetPasswordSchema }),
  asyncHandler(authController.resetPassword),
);

router.get('/me', requireAuth, asyncHandler(authController.me));

export default router;
