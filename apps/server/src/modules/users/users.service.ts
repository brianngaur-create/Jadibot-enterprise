import { Prisma, type Role } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { ForbiddenError, NotFoundError } from '../../lib/errors';
import { isRoleAtLeast } from '../../constants/permissions';
import { hashPassword, verifyPassword } from '../../lib/password';
import { serializeUser } from '../../utils/serializers';
import { UnauthorizedError } from '../../lib/errors';

interface Actor {
  id: string;
  role: Role;
}

export const usersService = {
  async get(id: string, actor: Actor) {
    if (id !== actor.id && !isRoleAtLeast(actor.role, 'ADMIN')) {
      throw new ForbiddenError('You can only view your own profile');
    }
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundError('User not found');
    return serializeUser(user);
  },

  async update(id: string, actor: Actor, data: { name?: string; avatarInitials?: string }) {
    if (id !== actor.id && !isRoleAtLeast(actor.role, 'ADMIN')) {
      throw new ForbiddenError('You can only edit your own profile');
    }
    const user = await prisma.user.update({
      where: { id },
      data: { name: data.name, avatarInitials: data.avatarInitials },
    });
    return serializeUser(user);
  },

  async changePassword(id: string, currentPassword: string, newPassword: string) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user?.passwordHash) throw new NotFoundError('User not found');
    const ok = await verifyPassword(currentPassword, user.passwordHash);
    if (!ok) throw new UnauthorizedError('Current password is incorrect');
    await prisma.user.update({ where: { id }, data: { passwordHash: await hashPassword(newPassword) } });
    await prisma.refreshToken.updateMany({ where: { userId: id, revokedAt: null }, data: { revokedAt: new Date() } });
  },

  async getSettings(userId: string) {
    const settings = await prisma.userSetting.findUnique({ where: { userId } });
    return settings?.data ?? {};
  },

  async updateSettings(userId: string, data: Record<string, unknown>) {
    const json = data as Prisma.InputJsonValue;
    const settings = await prisma.userSetting.upsert({
      where: { userId },
      create: { userId, data: json },
      update: { data: json },
    });
    return settings.data;
  },
};
