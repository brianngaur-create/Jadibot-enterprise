import type { WASocket, proto } from '@whiskeysockets/baileys';
import type { SessionInstance } from './session-manager';

/** Normalised message context passed to every command/event handler. */
export interface MessageContext {
  sock: WASocket;
  instance: SessionInstance;
  botId: string;
  ownerId: string;
  msg: proto.IWebMessageInfo;
  chat: string;
  sender: string;
  pushName: string;
  isGroup: boolean;
  fromMe: boolean;
  body: string;
  command: string | null;
  args: string[];
  text: string;
  prefix: string;
  /** Reply to the current chat, quoting the triggering message. */
  reply: (text: string) => Promise<void>;
  /** Send a plain message to the current chat. */
  send: (text: string) => Promise<void>;
  /** React to the triggering message with an emoji. */
  react: (emoji: string) => Promise<void>;
}

export interface BotCommand {
  name: string;
  aliases?: string[];
  category?: string;
  description?: string;
  owner?: boolean;
  admin?: boolean;
  group?: boolean;
  private?: boolean;
  premium?: boolean;
  cooldown?: number;
  usage?: string;
  example?: string;
  execute: (ctx: MessageContext) => Promise<void> | void;
}
