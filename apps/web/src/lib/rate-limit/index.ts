interface RateLimitRecord {
  count: number
  firstAttemptAt: number
  blockedUntil: number | null
}

const store = new Map<string, RateLimitRecord>()

interface RateLimitConfig {
  maxAttempts: number
  windowMs: number
  blockDurationMs: number
}

const CONFIGS: Record<string, RateLimitConfig> = {
  login: { maxAttempts: 5, windowMs: 15 * 60 * 1000, blockDurationMs: 15 * 60 * 1000 },
  register: { maxAttempts: 3, windowMs: 60 * 60 * 1000, blockDurationMs: 60 * 60 * 1000 },
  forgotPassword: { maxAttempts: 3, windowMs: 60 * 60 * 1000, blockDurationMs: 60 * 60 * 1000 },
  otp: { maxAttempts: 5, windowMs: 10 * 60 * 1000, blockDurationMs: 10 * 60 * 1000 },
  qrGenerate: { maxAttempts: 10, windowMs: 60 * 1000, blockDurationMs: 30 * 1000 },
  pairingCode: { maxAttempts: 5, windowMs: 5 * 60 * 1000, blockDurationMs: 5 * 60 * 1000 },
  apiRetry: { maxAttempts: 3, windowMs: 5 * 1000, blockDurationMs: 10 * 1000 },
}

export interface RateLimitResult {
  allowed: boolean
  remainingAttempts: number
  blockedForMs: number
  blockedForLabel: string
}

function formatMs(ms: number): string {
  if (ms < 60_000) return `${Math.ceil(ms / 1000)}s`
  if (ms < 3_600_000) return `${Math.ceil(ms / 60_000)}m`
  return `${Math.ceil(ms / 3_600_000)}h`
}

export function checkRateLimit(action: string, identifier = 'global'): RateLimitResult {
  const config = CONFIGS[action]
  if (!config) return { allowed: true, remainingAttempts: Infinity, blockedForMs: 0, blockedForLabel: '' }

  const key = `${action}:${identifier}`
  const now = Date.now()
  const record = store.get(key)

  if (!record) {
    return { allowed: true, remainingAttempts: config.maxAttempts - 1, blockedForMs: 0, blockedForLabel: '' }
  }

  if (record.blockedUntil && record.blockedUntil > now) {
    const blockedForMs = record.blockedUntil - now
    return { allowed: false, remainingAttempts: 0, blockedForMs, blockedForLabel: formatMs(blockedForMs) }
  }

  if (record.firstAttemptAt + config.windowMs < now) {
    store.delete(key)
    return { allowed: true, remainingAttempts: config.maxAttempts - 1, blockedForMs: 0, blockedForLabel: '' }
  }

  return {
    allowed: record.count < config.maxAttempts,
    remainingAttempts: Math.max(0, config.maxAttempts - record.count),
    blockedForMs: 0,
    blockedForLabel: '',
  }
}

export function recordAttempt(action: string, identifier = 'global'): RateLimitResult {
  const config = CONFIGS[action]
  if (!config) return { allowed: true, remainingAttempts: Infinity, blockedForMs: 0, blockedForLabel: '' }

  const key = `${action}:${identifier}`
  const now = Date.now()
  const record = store.get(key)

  if (!record || record.firstAttemptAt + config.windowMs < now) {
    store.set(key, { count: 1, firstAttemptAt: now, blockedUntil: null })
    return { allowed: true, remainingAttempts: config.maxAttempts - 1, blockedForMs: 0, blockedForLabel: '' }
  }

  const newCount = record.count + 1

  if (newCount >= config.maxAttempts) {
    const blockedUntil = now + config.blockDurationMs
    store.set(key, { ...record, count: newCount, blockedUntil })
    const blockedForMs = config.blockDurationMs
    return { allowed: false, remainingAttempts: 0, blockedForMs, blockedForLabel: formatMs(blockedForMs) }
  }

  store.set(key, { ...record, count: newCount })
  return {
    allowed: true,
    remainingAttempts: config.maxAttempts - newCount,
    blockedForMs: 0,
    blockedForLabel: '',
  }
}

export function resetRateLimit(action: string, identifier = 'global'): void {
  store.delete(`${action}:${identifier}`)
}

export function useRateLimitedAction(action: string, identifier = 'global') {
  const check = () => checkRateLimit(action, identifier)
  const record = () => recordAttempt(action, identifier)
  const reset = () => resetRateLimit(action, identifier)
  return { check, record, reset }
}
