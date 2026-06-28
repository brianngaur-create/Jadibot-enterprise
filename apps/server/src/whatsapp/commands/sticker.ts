import { downloadMediaMessage } from '@whiskeysockets/baileys';
import type { BotCommand } from '../types';

/**
 * Convert an image/short-video into a WhatsApp sticker. Ported in spirit from
 * the legacy YANN_BOT `sticker` plugin but using Baileys' native sticker send.
 */
const command: BotCommand = {
  name: 'sticker',
  aliases: ['s', 'stiker'],
  category: 'sticker',
  description: 'Convert a replied/sent image into a sticker',
  cooldown: 5,
  async execute(ctx) {
    const target =
      ctx.msg.message?.imageMessage ||
      ctx.msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage;
    if (!target) {
      await ctx.reply('Send or reply to an image with the sticker command.');
      return;
    }
    try {
      const buffer = (await downloadMediaMessage(ctx.msg, 'buffer', {})) as Buffer;
      await ctx.sock.sendMessage(ctx.chat, { sticker: buffer }, { quoted: ctx.msg });
    } catch {
      await ctx.reply('Failed to create the sticker. Please try another image.');
    }
  },
};

export default command;
