import fs from 'node:fs';
import path from 'node:path';
import { scopedLogger } from '../config/logger';
import { prisma } from '../lib/prisma';
import { commandRegistry } from './command-loader';
import type { BotCommand } from './types';

const log = scopedLogger('plugins');

const PLUGINS_DIR = path.join(__dirname, 'plugins');

export interface PluginManifest {
  name: string;
  version?: string;
  author?: string;
  description?: string;
  category?: string;
  permissions?: string[];
}

export interface LoadedPlugin {
  manifest: PluginManifest;
  commands: BotCommand[];
}

const loaded = new Map<string, LoadedPlugin>();

/**
 * Discover local plugins. Each plugin lives in its own folder with a
 * `manifest.json` and an entry module (`index.ts`/`index.js`) exporting an array
 * of commands. Plugins register their commands into the shared registry so they
 * are available without restarting the bot.
 */
export async function loadPlugins(): Promise<number> {
  loaded.clear();
  if (!fs.existsSync(PLUGINS_DIR)) {
    fs.mkdirSync(PLUGINS_DIR, { recursive: true });
    return 0;
  }

  for (const entry of fs.readdirSync(PLUGINS_DIR, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const dir = path.join(PLUGINS_DIR, entry.name);
    const manifestPath = path.join(dir, 'manifest.json');
    if (!fs.existsSync(manifestPath)) continue;

    try {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8')) as PluginManifest;
      const entryFile = ['index.ts', 'index.js'].map((f) => path.join(dir, f)).find(fs.existsSync);
      const commands: BotCommand[] = [];
      if (entryFile) {
        delete require.cache[require.resolve(entryFile)];
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const mod = require(entryFile);
        const exported: BotCommand[] = mod.commands ?? mod.default ?? [];
        for (const cmd of exported) {
          if (cmd?.name && typeof cmd.execute === 'function') {
            commandRegistry.register(cmd);
            commands.push(cmd);
          }
        }
      }
      loaded.set(manifest.name, { manifest, commands });
      await syncPlugin(manifest, 'ACTIVE');
    } catch (err) {
      log.error({ err, plugin: entry.name }, 'failed to load plugin');
    }
  }

  log.info(`loaded ${loaded.size} plugin(s)`);
  return loaded.size;
}

async function syncPlugin(manifest: PluginManifest, status: 'ACTIVE' | 'INACTIVE'): Promise<void> {
  await prisma.plugin
    .upsert({
      where: { name: manifest.name },
      create: {
        name: manifest.name,
        description: manifest.description ?? '',
        category: manifest.category ?? 'general',
        version: manifest.version ?? '1.0.0',
        author: manifest.author ?? 'unknown',
        permissions: manifest.permissions ?? [],
        status,
      },
      update: {
        description: manifest.description ?? '',
        version: manifest.version ?? '1.0.0',
        status,
      },
    })
    .catch((err) => log.error({ err }, 'plugin db sync failed'));
}

export async function reloadPlugins(): Promise<number> {
  return loadPlugins();
}

export function getLoadedPlugins(): LoadedPlugin[] {
  return [...loaded.values()];
}
