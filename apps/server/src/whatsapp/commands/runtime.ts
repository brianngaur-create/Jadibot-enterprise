import os from 'node:os';
import type { BotCommand } from '../types';

function fmt(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${d}d ${h}h ${m}m`;
}

const command: BotCommand = {
  name: 'runtime',
  aliases: ['uptime', 'status'],
  category: 'info',
  description: 'Show bot runtime, memory and host information',
  cooldown: 5,
  async execute(ctx) {
    const mem = process.memoryUsage();
    const text = [
      '*Bot Runtime*',
      `Uptime: ${fmt(process.uptime())}`,
      `RAM: ${(mem.rss / 1024 / 1024).toFixed(1)} MB`,
      `Platform: ${os.platform()} ${os.arch()}`,
      `Node: ${process.version}`,
    ].join('\n');
    await ctx.reply(text);
  },
};

export default command;
