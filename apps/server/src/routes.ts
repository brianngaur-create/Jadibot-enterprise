import { Router } from 'express';
import authRoutes from './modules/auth/auth.routes';
import usersRoutes from './modules/users/users.routes';
import botsRoutes from './modules/bots/bots.routes';
import sessionsRoutes from './modules/sessions/sessions.routes';
import pluginsRoutes from './modules/plugins/plugins.routes';
import commandsRoutes from './modules/commands/commands.routes';
import analyticsRoutes from './modules/analytics/analytics.routes';
import logsRoutes from './modules/logs/logs.routes';
import notificationsRoutes from './modules/notifications/notifications.routes';
import apiKeysRoutes from './modules/apikeys/apikeys.routes';
import adminRoutes from './modules/admin/admin.routes';
import webhooksRoutes from './modules/webhooks/webhooks.routes';
import healthRoutes from './modules/health/health.routes';

/** Mounts every versioned API module under a single router. */
export function buildApiRouter(): Router {
  const router = Router();

  router.use('/health', healthRoutes);
  router.use('/auth', authRoutes);
  router.use('/users', usersRoutes);
  router.use('/bots', botsRoutes);
  router.use('/sessions', sessionsRoutes);
  router.use('/plugins', pluginsRoutes);
  router.use('/commands', commandsRoutes);
  router.use('/analytics', analyticsRoutes);
  router.use('/logs', logsRoutes);
  router.use('/notifications', notificationsRoutes);
  router.use('/api-keys', apiKeysRoutes);
  router.use('/admin', adminRoutes);
  router.use('/webhooks', webhooksRoutes);

  return router;
}
