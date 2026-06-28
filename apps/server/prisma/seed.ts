import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? 'admin@jadibot.local';
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? 'Admin#12345';
const ADMIN_NAME = process.env.SEED_ADMIN_NAME ?? 'Super Admin';
const DEMO_EMAIL = 'demo@jadibot.local';
const DEMO_PASSWORD = 'Demo#12345';

async function main(): Promise<void> {
  const adminHash = await bcrypt.hash(ADMIN_PASSWORD, 12);
  const demoHash = await bcrypt.hash(DEMO_PASSWORD, 12);

  const admin = await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: { passwordHash: adminHash, name: ADMIN_NAME, role: 'SUPER_ADMIN' },
    create: {
      email: ADMIN_EMAIL,
      name: ADMIN_NAME,
      passwordHash: adminHash,
      role: 'SUPER_ADMIN',
      plan: 'ENTERPRISE',
      avatarInitials: 'SA',
      emailVerified: true,
      settings: { create: {} },
    },
  });

  const demo = await prisma.user.upsert({
    where: { email: DEMO_EMAIL },
    update: { passwordHash: demoHash },
    create: {
      email: DEMO_EMAIL,
      name: 'Demo User',
      passwordHash: demoHash,
      role: 'USER',
      plan: 'PRO',
      avatarInitials: 'DU',
      emailVerified: true,
      settings: { create: {} },
    },
  });

  // A couple of demo bots for the demo user.
  const existingBots = await prisma.bot.count({ where: { ownerId: demo.id } });
  if (existingBots === 0) {
    await prisma.bot.create({
      data: {
        ownerId: demo.id,
        name: 'Customer Support Bot',
        status: 'OFFLINE',
        mode: 'PUBLIC',
        prefix: '.',
        messagesHandled: 1280,
        activeUsers: 42,
        settings: { create: { ownerName: 'Demo User', ownerNumber: '628100000000' } },
        session: { create: {} },
      },
    });
    await prisma.bot.create({
      data: {
        ownerId: demo.id,
        name: 'Sales Assistant',
        status: 'OFFLINE',
        mode: 'SELF',
        prefix: '!',
        messagesHandled: 530,
        activeUsers: 17,
        settings: { create: { ownerName: 'Demo User', ownerNumber: '628100000000' } },
        session: { create: {} },
      },
    });
  }

  const existingNotifications = await prisma.notification.count({ where: { userId: demo.id } });
  if (existingNotifications === 0) {
    await prisma.notification.createMany({
      data: [
        {
          userId: demo.id,
          type: 'INFO',
          title: 'Welcome to JadiBot Enterprise',
          message: 'Connect your first WhatsApp number to get started.',
        },
        {
          userId: demo.id,
          type: 'SUCCESS',
          title: 'Account ready',
          message: 'Your demo account has been provisioned with sample bots.',
        },
      ],
    });
  }

  // eslint-disable-next-line no-console
  console.log('Seed complete:');
  // eslint-disable-next-line no-console
  console.log(`  Admin: ${admin.email} / ${ADMIN_PASSWORD}`);
  // eslint-disable-next-line no-console
  console.log(`  Demo:  ${demo.email} / ${DEMO_PASSWORD}`);
}

main()
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
