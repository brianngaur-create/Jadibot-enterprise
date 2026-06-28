import type { AuthSession, AuthTokens } from './types'

const SESSION_KEY = 'jb_session'
const SESSION_KEY_PERSIST = 'jb_session_persist'

// Mirror of the auth cookie the Next.js middleware reads to gate protected
// routes. It carries only the role for routing decisions — the real tokens
// live in storage and the HttpOnly refresh cookie, and the backend always
// re-validates JWTs, so this routing hint being JS-readable is intentional.
const AUTH_COOKIE_NAME = 'jb_auth'

function writeAuthCookie(session: AuthSession): void {
  if (typeof document === 'undefined') return
  const value = btoa(JSON.stringify({ role: session.user.role }))
  const parts = [`${AUTH_COOKIE_NAME}=${value}`, 'path=/', 'SameSite=Lax']
  if (session.rememberMe) parts.push(`max-age=${30 * 24 * 60 * 60}`)
  document.cookie = parts.join('; ')
}

function clearAuthCookie(): void {
  if (typeof document === 'undefined') return
  document.cookie = `${AUTH_COOKIE_NAME}=; path=/; max-age=0; SameSite=Lax`
}

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
  writeAuthCookie(session)
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
  clearAuthCookie()
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
