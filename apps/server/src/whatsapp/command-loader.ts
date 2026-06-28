import fs from 'node:fs';
import path from 'node:path';
import type { proto } from '@whiskeysockets/baileys';
import { scopedLogger } from '../config/logger';
import { prisma } from '../lib/prisma';
import { redis } from '../lib/redis';
import { engineEvents } from './engine-events';
import { registerMessageHandler, type SessionInstance } from './session-manager';
import { buildContext } from './message-context';
import type { BotCommand } from './types';

const log = scopedLogger('commands');

/** In-memory registry of all loaded commands, keyed by name and alias. */
class CommandRegistry {
  private commands = new Map<string, BotCommand>();
  private aliases = new Map<string, string>();

  register(cmd: BotCommand): void {
    this.commands.set(cmd.name, cmd);
    for (const alias of cmd.aliases ?? []) this.aliases.set(alias, cmd.name);
  }

  get(nameOrAlias: string): BotCommand | undefined {
    const name = this.commands.has(nameOrAlias)
      ? nameOrAlias
      : this.aliases.get(nameOrAlias);
    return name ? this.commands.get(name) : undefined;
  }

  all(): BotCommand[] {
    return [...this.commands.values()];
  }

  clear(): void {
    this.commands.clear();
    this.aliases.clear();
  }
}

export const commandRegistry = new CommandRegistry();

const COMMANDS_DIR = path.join(__dirname, 'commands');

function listCommandFiles(dir: string): string[] {
  const files: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...listCommandFiles(full));
    else if (/\.(t|j)s$/.test(entry.name) && !entry.name.endsWith('.d.ts')) files.push(full);
  }
  return files;
}

/**
 * Scan the commands directory (recursively, supporting subfolders), import each
 * module and register the exported command. Also mirrors command metadata into
 * the database so the dashboard can manage them.
 */
export async function loadCommands(): Promise<number> {
  commandRegistry.clear();
  if (!fs.existsSync(COMMANDS_DIR)) return 0;

  for (const file of listCommandFiles(COMMANDS_DIR)) {
    try {
      delete require.cache[require.resolve(file)];
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const mod = require(file);
      const cmd: BotCommand | undefined = mod.default ?? mod.command;
      if (cmd?.name && typeof cmd.execute === 'function') {
        commandRegistry.register(cmd);
      }
    } catch (err) {
      log.error({ err, file }, 'failed to load command');
    }
  }

  await syncCommandsToDb();
  log.info(`loaded ${commandRegistry.all().length} command(s)`);
  return commandRegistry.all().length;
}

async function syncCommandsToDb(): Promise<void> {
  for (const cmd of commandRegistry.all()) {
    await prisma.command
      .upsert({
        where: { name: cmd.name },
        create: {
          name: cmd.name,
          aliases: cmd.aliases ?? [],
          description: cmd.description ?? '',
          category: cmd.category ?? 'general',
          ownerOnly: cmd.owner ?? false,
          adminOnly: cmd.admin ?? false,
          groupOnly: cmd.group ?? false,
          privateOnly: cmd.private ?? false,
          premium: cmd.premium ?? false,
          cooldown: cmd.cooldown ?? 3,
        },
        update: {
          aliases: cmd.aliases ?? [],
          description: cmd.description ?? '',
          category: cmd.category ?? 'general',
        },
      })
      .catch((err) => log.error({ err, cmd: cmd.name }, 'command db sync failed'));
  }
}

/** Reload all commands without restarting the process (hot reload). */
export async function reloadCommands(): Promise<number> {
  return loadCommands();
}

// Lightweight per-bot prefix cache to avoid a DB hit on every message.
const prefixCache = new Map<string, { prefix: string; enabled: Set<string>; expires: number }>();

async function getBotConfig(botId: string) {
  const cached = prefixCache.get(botId);
  if (cached && cached.expires > Date.now()) return cached;
  const bot = await prisma.bot.findUnique({ where: { id: botId } });
  const disabled = await prisma.command.findMany({
    where: { enabled: false },
    select: { name: true },
  });
  const value = {
    prefix: bot?.prefix ?? '.',
    enabled: new Set(disabled.map((d) => d.name)),
    expires: Date.now() + 30_000,
  };
  prefixCache.set(botId, value);
  return value;
}

async function onCooldown(botId: string, sender: string, name: string, seconds: number) {
  if (seconds <= 0) return false;
  const key = `cd:${botId}:${sender}:${name}`;
  const exists = await redis.get(key);
  if (exists) return true;
  await redis.set(key, '1', 'EX', seconds);
  return false;
}

/**
 * Dispatch incoming messages to the matching command. Registered with the
 * session manager so every bot shares the same command pipeline.
 */
async function handleUpsert(instance: SessionInstance, upsert: unknown): Promise<void> {
  const { messages, type } = upsert as {
    messages: proto.IWebMessageInfo[];
    type: string;
  };
  if (type !== 'notify') return;

  const config = await getBotConfig(instance.botId);

  for (const msg of messages) {
    if (!msg.message || !instance.sock) continue;
    const ctx = buildContext(instance.sock, instance, msg, config.prefix);

    engineEvents.emitEvent('message', {
      botId: instance.botId,
      ownerId: instance.ownerId,
      from: ctx.sender,
      body: ctx.body,
      fromMe: ctx.fromMe,
    });

    if (!ctx.command) continue;
    const cmd = commandRegistry.get(ctx.command);
    if (!cmd || config.enabled.has(cmd.name)) continue;

    if (cmd.group && !ctx.isGroup) {
      await ctx.reply('This command can only be used in groups.');
      continue;
    }
    if (cmd.private && ctx.isGroup) {
      await ctx.reply('This command can only be used in private chat.');
      continue;
    }
    if (await onCooldown(instance.botId, ctx.sender, cmd.name, cmd.cooldown ?? 0)) {
      continue;
    }

    try {
      await cmd.execute(ctx);
      await prisma.command
        .update({ where: { name: cmd.name }, data: { usage: { increment: 1 } } })
        .catch(() => undefined);
    } catch (err) {
      log.error({ err, cmd: cmd.name, botId: instance.botId }, 'command execution failed');
      engineEvents.emitEvent('log', {
        botId: instance.botId,
        ownerId: instance.ownerId,
        level: 'error',
        source: 'command',
        message: `Command "${cmd.name}" failed: ${(err as Error).message}`,
      });
    }
  }
}

/** Initialise the command system: load commands and wire the message handler. */
export async function initCommandSystem(): Promise<void> {
  await loadCommands();
  registerMessageHandler(handleUpsert);
}
