import type { BotCommand } from '../types';
import { commandRegistry } from '../command-loader';

const command: BotCommand = {
  name: 'menu',
  aliases: ['help', 'list'],
  category: 'tools',
  description: 'Show the list of available commands',
  cooldown: 5,
  async execute(ctx) {
    const byCategory = new Map<string, string[]>();
    for (const cmd of commandRegistry.all()) {
      const cat = cmd.category ?? 'general';
      if (!byCategory.has(cat)) byCategory.set(cat, []);
      byCategory.get(cat)!.push(cmd.name);
    }

    let text = `*JadiBot Enterprise*\nPrefix: ${ctx.prefix}\n`;
    for (const [cat, names] of [...byCategory.entries()].sort()) {
      text += `\n*${cat.toUpperCase()}*\n`;
      text += names
        .sort()
        .map((n) => `• ${ctx.prefix}${n}`)
        .join('\n');
      text += '\n';
    }
    await ctx.reply(text.trim());
  },
};

export default command;
