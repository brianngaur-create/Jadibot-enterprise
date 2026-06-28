import type { AuthSession, AuthTokens } from './types'

const SESSION_KEY = 'jb_session'
const SESSION_KEY_PERSIST = 'jb_session_persist'

const SESSION_TIMEOUT_MS = 30 * 60 * 1000
const INACTIVITY_CHECK_INTERVAL_MS = 60 * 1000

type SessionExpiredCallback = () => void

let _inactivityTimer: ReturnType<typeof setInterval> | null = null
let _onSessionExpired: SessionExpiredCallback | null = null

export function saveSession(session: AuthSession): void {
  const data = JSON.stringify(session)
  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.setItem(SESSION_KEY, data)
  }
  if (session.rememberMe && typeof localStorage !== 'undefined') {
    localStorage.setItem(SESSION_KEY_PERSIST, data)
  }
}

export function loadSession(): AuthSession | null {
  if (typeof window === 'undefined') return null

  try {
    const raw = sessionStorage.getItem(SESSION_KEY) ?? localStorage.getItem(SESSION_KEY_PERSIST)
    if (!raw) return null

    const session = JSON.parse(raw) as AuthSession

    if (isRefreshTokenExpired(session.tokens)) {
      clearSession()
      return null
    }

    if (isSessionTimedOut(session) && !session.rememberMe) {
      clearSession()
      return null
    }

    return session
  } catch {
    clearSession()
    return null
  }
}

export function clearSession(): void {
  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.removeItem(SESSION_KEY)
    sessionStorage.removeItem('jb_device_id')
  }
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem(SESSION_KEY_PERSIST)
  }
  stopInactivityMonitor()
}

export function updateSessionActivity(session: AuthSession): AuthSession {
  const updated = { ...session, lastActiveAt: Date.now() }
  saveSession(updated)
  return updated
}

export function updateSessionTokens(session: AuthSession, tokens: AuthTokens): AuthSession {
  const updated = { ...session, tokens, lastActiveAt: Date.now() }
  saveSession(updated)
  return updated
}

export function isAccessTokenExpired(tokens: AuthTokens): boolean {
  return tokens.accessTokenExpiresAt < Date.now()
}

export function isAccessTokenExpiringSoon(tokens: AuthTokens, bufferMs = 60_000): boolean {
  return tokens.accessTokenExpiresAt < Date.now() + bufferMs
}

export function isRefreshTokenExpired(tokens: AuthTokens): boolean {
  return tokens.refreshTokenExpiresAt < Date.now()
}

export function isSessionTimedOut(session: AuthSession): boolean {
  return Date.now() - session.lastActiveAt > SESSION_TIMEOUT_MS
}

export function startInactivityMonitor(onExpired: SessionExpiredCallback): void {
  _onSessionExpired = onExpired
  if (_inactivityTimer) clearInterval(_inactivityTimer)
  _inactivityTimer = setInterval(() => {
    const session = loadSession()
    if (!session) {
      _onSessionExpired?.()
      stopInactivityMonitor()
      return
    }
    if (!session.rememberMe && isSessionTimedOut(session)) {
      clearSession()
      _onSessionExpired?.()
      stopInactivityMonitor()
    }
  }, INACTIVITY_CHECK_INTERVAL_MS)
}

export function stopInactivityMonitor(): void {
  if (_inactivityTimer) {
    clearInterval(_inactivityTimer)
    _inactivityTimer = null
  }
  _onSessionExpired = null
}
