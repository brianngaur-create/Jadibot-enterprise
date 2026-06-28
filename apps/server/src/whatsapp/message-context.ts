import type { WASocket, proto } from '@whiskeysockets/baileys';
import type { SessionInstance } from './session-manager';
import type { MessageContext } from './types';

/** Extract the plain-text body from the many possible message shapes. */
export function extractText(msg: proto.IWebMessageInfo): string {
  const m = msg.message;
  if (!m) return '';
  return (
    m.conversation ||
    m.extendedTextMessage?.text ||
    m.imageMessage?.caption ||
    m.videoMessage?.caption ||
    m.buttonsResponseMessage?.selectedButtonId ||
    m.listResponseMessage?.singleSelectReply?.selectedRowId ||
    ''
  );
}

/** Build the normalised {@link MessageContext} handed to command handlers. */
export function buildContext(
  sock: WASocket,
  instance: SessionInstance,
  msg: proto.IWebMessageInfo,
  prefix: string,
): MessageContext {
  const chat = msg.key.remoteJid ?? '';
  const isGroup = chat.endsWith('@g.us');
  const fromMe = msg.key.fromMe ?? false;
  const sender = isGroup ? msg.key.participant ?? chat : chat;
  const body = extractText(msg);

  let command: string | null = null;
  let args: string[] = [];
  if (body.startsWith(prefix)) {
    const parts = body.slice(prefix.length).trim().split(/\s+/);
    command = (parts.shift() ?? '').toLowerCase() || null;
    args = parts;
  }

  return {
    sock,
    instance,
    botId: instance.botId,
    ownerId: instance.ownerId,
    msg,
    chat,
    sender,
    pushName: msg.pushName ?? 'User',
    isGroup,
    fromMe,
    body,
    command,
    args,
    text: args.join(' '),
    prefix,
    reply: async (text: string) => {
      await sock.sendMessage(chat, { text }, { quoted: msg });
    },
    send: async (text: string) => {
      await sock.sendMessage(chat, { text });
    },
    react: async (emoji: string) => {
      await sock.sendMessage(chat, { react: { text: emoji, key: msg.key } });
    },
  };
}
