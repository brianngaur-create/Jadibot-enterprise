import type { NotificationType } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { serializeNotification } from '../../utils/serializers';
import { toSkipTake, type ListQuery } from '../../utils/pagination';

export const notificationsService = {
  async list(userId: string, query: ListQuery) {
    const [items, total, unread] = await Promise.all([
      prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        ...toSkipTake(query),
      }),
      prisma.notification.count({ where: { userId } }),
      prisma.notification.count({ where: { userId, read: false } }),
    ]);
    return { items: items.map(serializeNotification), total, unread };
  },

  async markRead(userId: string, id: string) {
    await prisma.notification.updateMany({ where: { id, userId }, data: { read: true } });
  },

  async markAllRead(userId: string) {
    await prisma.notification.updateMany({ where: { userId, read: false }, data: { read: true } });
  },

  async create(userId: string, data: { type: NotificationType; title: string; message: string }) {
    const n = await prisma.notification.create({ data: { userId, ...data } });
    return serializeNotification(n);
  },
};
