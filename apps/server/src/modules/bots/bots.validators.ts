import { z } from 'zod';

export const createBotSchema = z.object({
  name: z.string().min(1).max(80),
  prefix: z.string().min(1).max(5).default('.'),
  mode: z.enum(['public', 'self', 'group']).default('public'),
});

export const updateBotSchema = z.object({
  name: z.string().min(1).max(80).optional(),
  prefix: z.string().min(1).max(5).optional(),
  mode: z.enum(['public', 'self', 'group']).optional(),
  autoRead: z.boolean().optional(),
  autoTyping: z.boolean().optional(),
  autoRecording: z.boolean().optional(),
  autoReact: z.boolean().optional(),
});

export const botSettingsSchema = z.object({
  ownerName: z.string().max(120).optional(),
  ownerNumber: z.string().max(30).optional(),
  bio: z.string().max(500).optional(),
  language: z.string().max(10).optional(),
  timezone: z.string().max(60).optional(),
  footer: z.string().max(200).optional(),
  welcome: z.boolean().optional(),
  goodbye: z.boolean().optional(),
  antiLink: z.boolean().optional(),
  antiSpam: z.boolean().optional(),
  antiCall: z.boolean().optional(),
  autoSticker: z.boolean().optional(),
});

export const botIdParam = z.object({ id: z.string().min(1) });
