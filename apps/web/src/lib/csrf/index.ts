const CSRF_COOKIE_NAME = 'jb_csrf_token'
const CSRF_HEADER_NAME = 'X-CSRF-Token'
const CSRF_META_NAME = 'csrf-token'

function generateCsrfToken(): string {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const bytes = crypto.getRandomValues(new Uint8Array(32))
    return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

function getCsrfFromCookie(): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${CSRF_COOKIE_NAME}=([^;]+)`))
  return match ? decodeURIComponent(match[1]) : null
}

export function initializeCsrf(): string {
  let token = getCsrfFromCookie()
  if (!token) {
    token = generateCsrfToken()
    if (typeof document !== 'undefined') {
      document.cookie = `${CSRF_COOKIE_NAME}=${encodeURIComponent(token)}; SameSite=Strict; Secure; Path=/`
    }
  }

  if (typeof document !== 'undefined') {
    let meta = document.querySelector<HTMLMetaElement>(`meta[name="${CSRF_META_NAME}"]`)
    if (!meta) {
      meta = document.createElement('meta')
      meta.name = CSRF_META_NAME
      document.head.appendChild(meta)
    }
    meta.content = token
  }

  return token
}

export function getCsrfToken(): string | null {
  if (typeof document === 'undefined') return null
  const meta = document.querySelector<HTMLMetaElement>(`meta[name="${CSRF_META_NAME}"]`)
  return meta?.content ?? getCsrfFromCookie()
}

export function getCsrfHeader(): Record<string, string> {
  const token = getCsrfToken()
  if (!token) return {}
  return { [CSRF_HEADER_NAME]: token }
}

export { CSRF_HEADER_NAME, CSRF_COOKIE_NAME, CSRF_META_NAME }
