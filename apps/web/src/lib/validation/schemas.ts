import { z } from 'zod'

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must be at most 128 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character')

const emailSchema = z
  .string()
  .min(1, 'Email is required')
  .max(254, 'Email is too long')
  .email('Please enter a valid email address')
  .toLowerCase()
  .trim()

const nameSchema = z
  .string()
  .min(1, 'This field is required')
  .max(50, 'Must be at most 50 characters')
  .regex(/^[\p{L}\p{M}' -]+$/u, 'Only letters, spaces, hyphens, and apostrophes are allowed')
  .trim()

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required').max(128, 'Password is too long'),
  rememberMe: z.boolean().default(false),
})
export type LoginFormValues = z.infer<typeof loginSchema>

export const registerSchema = z
  .object({
    firstName: nameSchema,
    lastName: nameSchema,
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'Please confirm your password'),
    plan: z.enum(['starter', 'pro', 'enterprise'], {
      errorMap: () => ({ message: 'Please select a plan' }),
    }),
    acceptTerms: z.literal(true, {
      errorMap: () => ({ message: 'You must accept the Terms of Service to continue' }),
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })
export type RegisterFormValues = z.infer<typeof registerSchema>

export const forgotPasswordSchema = z.object({
  email: emailSchema,
})
export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>

export const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })
export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>

const phoneNumberSchema = z
  .string()
  .min(7, 'Phone number is too short')
  .max(20, 'Phone number is too long')
  .regex(/^[0-9+\-() ]+$/, 'Invalid phone number format')
  .transform((v) => v.replace(/[\s\-()]/g, ''))

const botNameSchema = z
  .string()
  .min(2, 'Bot name must be at least 2 characters')
  .max(50, 'Bot name must be at most 50 characters')
  .regex(/^[\w\s-]+$/, 'Bot name may only contain letters, numbers, spaces, and hyphens')
  .trim()

export const createBotSchema = z.object({
  name: botNameSchema,
  prefix: z
    .string()
    .min(1, 'Prefix is required')
    .max(5, 'Prefix must be at most 5 characters')
    .regex(/^[^\s]+$/, 'Prefix cannot contain spaces'),
  ownerNumber: phoneNumberSchema,
  mode: z.enum(['public', 'self', 'group']),
  language: z.enum(['en', 'id', 'es']),
  timezone: z.enum(['Asia/Jakarta', 'UTC', 'America/New_York']),
  bio: z
    .string()
    .max(300, 'Bio must be at most 300 characters')
    .trim()
    .optional()
    .default(''),
})
export type CreateBotFormValues = z.infer<typeof createBotSchema>

export const apiKeySchema = z.object({
  name: z
    .string()
    .min(2, 'API key name must be at least 2 characters')
    .max(60, 'API key name must be at most 60 characters')
    .regex(/^[\w\s-]+$/, 'Name may only contain letters, numbers, spaces, and hyphens')
    .trim(),
  scope: z
    .array(z.enum(['read', 'write', 'admin']))
    .min(1, 'Select at least one permission scope'),
  expiresInDays: z.number().int().min(1).max(365).optional(),
})
export type ApiKeyFormValues = z.infer<typeof apiKeySchema>

export const profileSchema = z.object({
  firstName: nameSchema,
  lastName: nameSchema,
  email: emailSchema,
  currentPassword: z.string().optional(),
  newPassword: passwordSchema.optional(),
  confirmNewPassword: z.string().optional(),
}).refine(
  (d) => {
    if (d.newPassword && !d.currentPassword) return false
    return true
  },
  { message: 'Current password is required to set a new password', path: ['currentPassword'] }
).refine(
  (d) => {
    if (d.newPassword && d.newPassword !== d.confirmNewPassword) return false
    return true
  },
  { message: 'Passwords do not match', path: ['confirmNewPassword'] }
)
export type ProfileFormValues = z.infer<typeof profileSchema>

export const settingsSchema = z.object({
  notificationsEmail: z.boolean(),
  notificationsPush: z.boolean(),
  sessionTimeout: z.enum(['15', '30', '60', '120', 'never']),
  twoFactorEnabled: z.boolean(),
  timezone: z.string().min(1),
  language: z.enum(['en', 'id', 'es']),
})
export type SettingsFormValues = z.infer<typeof settingsSchema>

export const botSettingsSchema = z.object({
  autoRead: z.boolean(),
  autoTyping: z.boolean(),
  autoRecording: z.boolean(),
  autoReact: z.boolean(),
  prefix: z.string().min(1).max(5).regex(/^[^\s]+$/),
  bio: z.string().max(300).trim().optional().default(''),
  footer: z.string().max(100).trim().optional().default(''),
})
export type BotSettingsFormValues = z.infer<typeof botSettingsSchema>

export function sanitizeString(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
}

export function sanitizeSearchQuery(input: string): string {
  return input.replace(/[<>'";&|`$]/g, '').slice(0, 200).trim()
}
