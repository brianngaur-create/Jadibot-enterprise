import { z } from 'zod';

export const botRefSchema = z.object({ botId: z.string().min(1) });

export const pairingSchema = z.object({
  botId: z.string().min(1),
  phoneNumber: z
    .string()
    .min(8)
    .max(20)
    .regex(/^[0-9+\s-]+$/, 'Invalid phone number'),
});

export const sessionIdParam = z.object({ id: z.string().min(1) });
