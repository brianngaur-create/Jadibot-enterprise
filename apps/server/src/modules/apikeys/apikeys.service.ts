import crypto from 'node:crypto';
import { prisma } from '../../lib/prisma';
import { NotFoundError } from '../../lib/errors';
import { sha256 } from '../../lib/jwt';
import { serializeApiKey } from '../../utils/serializers';

export const apiKeysService = {
  async list(userId: string) {
    const keys = await prisma.apiKey.findMany({
      where: { userId, revokedAt: null },
      orderBy: { createdAt: 'desc' },
    });
    return keys.map(serializeApiKey);
  },

  /** Create a key. The plaintext secret is returned exactly once. */
  async create(userId: string, input: { name: string; scope?: string[] }) {
    const prefix = `jb_${crypto.randomBytes(4).toString('hex')}`;
    const secret = crypto.randomBytes(24).toString('hex');
    const fullKey = `${prefix}.${secret}`;

    const key = await prisma.apiKey.create({
      data: {
        userId,
        name: input.name,
        prefix,
        keyHash: sha256(fullKey),
        scopes: input.scope ?? ['bots:read'],
      },
    });

    return { ...serializeApiKey(key), key: fullKey };
  },

  async revoke(userId: string, id: string) {
    const key = await prisma.apiKey.findFirst({ where: { id, userId } });
    if (!key) throw new NotFoundError('API key not found');
    await prisma.apiKey.update({ where: { id }, data: { revokedAt: new Date() } });
  },
};
