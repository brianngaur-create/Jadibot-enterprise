import type {
  ApiKey,
  Bot,
  BotSetting,
  Command,
  Log,
  Notification,
  Plugin,
  Role,
  User,
  WaSession,
} from '@prisma/client';

/**
 * Serializers translate Prisma records (UPPER_SNAKE enums, internal fields)
 * into the exact JSON shapes the Next.js frontend already expects. Keeping the
 * mapping in one place means the API contract is enforced consistently.
 */

const ROLE_MAP: Record<Role, 'user' | 'admin' | 'super_admin'> = {
  USER: 'user',
  ADMIN: 'admin',
  SUPER_ADMIN: 'super_admin',
};

export function serializeUser(user: User) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: ROLE_MAP[user.role],
    status: user.status === 'ACTIVE' ? 'active' : 'suspended',
    plan: user.plan.toLowerCase() as 'starter' | 'pro' | 'enterprise',
    avatarInitials: user.avatarInitials,
    emailVerified: user.emailVerified,
    twoFactorEnabled: user.twoFactorEnabled,
    createdAt: user.createdAt.toISOString(),
    lastLoginAt: (user.lastLoginAt ?? user.createdAt).toISOString(),
  };
}

export function serializeAdminUser(user: User & { _count?: { bots: number } }) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    plan: user.plan.toLowerCase(),
    bots: user._count?.bots ?? 0,
    status: user.status === 'ACTIVE' ? 'active' : 'suspended',
    joinedAt: user.createdAt.toISOString(),
  };
}

function humanizeUptime(start: Date | null): string {
  if (!start) return '—';
  const ms = Date.now() - start.getTime();
  const mins = Math.floor(ms / 60_000);
  const days = Math.floor(mins / 1440);
  const hours = Math.floor((mins % 1440) / 60);
  const minutes = mins % 60;
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

type BotWithRelations = Bot & {
  settings?: BotSetting | null;
  session?: WaSession | null;
};

export function serializeBot(bot: BotWithRelations) {
  return {
    id: bot.id,
    name: bot.name,
    status: bot.status === 'ONLINE' ? 'online' : 'offline',
    device: bot.session?.platform ?? bot.device,
    ping: bot.ping,
    uptime: bot.status === 'ONLINE' ? humanizeUptime(bot.uptimeStartedAt) : '—',
    messagesHandled: bot.messagesHandled,
    activeUsers: bot.activeUsers,
    prefix: bot.prefix,
    mode: bot.mode.toLowerCase() as 'public' | 'self' | 'group',
    autoRead: bot.autoRead,
    autoTyping: bot.autoTyping,
    autoRecording: bot.autoRecording,
    autoReact: bot.autoReact,
    ownerName: bot.settings?.ownerName ?? '',
    ownerNumber: bot.settings?.ownerNumber ?? '',
    bio: bot.settings?.bio ?? '',
    language: bot.settings?.language ?? 'id',
    timezone: bot.settings?.timezone ?? 'Asia/Jakarta',
    footer: bot.settings?.footer ?? 'JadiBot Enterprise',
  };
}

export function serializePlugin(plugin: Plugin) {
  return {
    id: plugin.id,
    name: plugin.name,
    description: plugin.description,
    category: plugin.category,
    status: plugin.status === 'ACTIVE' ? 'active' : 'inactive',
    version: plugin.version,
    author: plugin.author,
  };
}

export function serializeCommand(command: Command) {
  return {
    id: command.id,
    command: command.name,
    description: command.description,
    category: command.category,
    usage: command.usage,
    enabled: command.enabled,
  };
}

export function serializeLog(log: Log) {
  return {
    id: log.id,
    level: log.level.toLowerCase() as 'info' | 'warn' | 'error' | 'debug',
    message: log.message,
    timestamp: log.createdAt.toISOString(),
    source: log.source,
  };
}

export function serializeNotification(n: Notification) {
  return {
    id: n.id,
    type: n.type.toLowerCase() as 'error' | 'success' | 'warning' | 'info',
    title: n.title,
    message: n.message,
    time: n.createdAt.toISOString(),
    read: n.read,
  };
}

export function serializeApiKey(key: ApiKey) {
  return {
    id: key.id,
    name: key.name,
    prefix: key.prefix,
    maskedKey: `${key.prefix}••••••••••••`,
    scope: (key.scopes as string[]) ?? [],
    createdAt: key.createdAt.toISOString(),
    lastUsed: (key.lastUsedAt ?? key.createdAt).toISOString(),
  };
}
