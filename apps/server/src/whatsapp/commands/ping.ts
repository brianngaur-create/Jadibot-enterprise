import type { BotCommand } from '../types';

const command: BotCommand = {
  name: 'ping',
  aliases: ['p', 'speed'],
  category: 'tools',
  description: 'Check the bot response latency',
  private: true,
  cooldown: 3,
  async execute(ctx) {
    const start = Date.now();
    await ctx.reply('Pong! measuring...');
    const latency = Date.now() - start;
    await ctx.send(`🏓 Pong! ${latency} ms`);
  },
};

export default command;
