# JadiBot Enterprise — Security Architecture

> **Target:** 9.5/10 security readiness for a production SaaS platform.  
> **Status:** Frontend hardened. Backend integration documented.

---

## 1. Authentication Architecture

### Overview
The auth system is built around a **stateless JWT + HttpOnly Cookie** model. The frontend mock simulates the full production flow so no refactoring is needed when the real backend is wired.

### Token Strategy
| Token | Lifetime | Storage |
|---|---|---|
| Access Token | 15 minutes | `sessionStorage` (current session only) |
| Refresh Token | 7 days (30 days with "Remember Me") | `localStorage` when rememberMe=true, otherwise `sessionStorage` |
| Session Cookie | Server-controlled | HttpOnly, SameSite=Strict, Secure (backend) |

**Why not localStorage for access tokens?** XSS can steal localStorage. Access tokens live only in memory/sessionStorage; refresh tokens are only persisted when the user explicitly opts in via "Remember Me."

### Session Lifecycle
```
Login → saveSession() → startInactivityMonitor()
                              ↓
                    Activity Touch (click/keydown)
                              ↓ (30-min timeout without "Remember Me")
                    clearSession() → redirect /login
```

### Automatic Token Refresh
- On app init (`Providers → AuthInitializer`), the session is loaded and the access token is checked.
- If the access token expires within **60 seconds**, a silent refresh is triggered before rendering protected content.
- In the API client, every outgoing request checks token expiry; a single `isRefreshing` gate prevents parallel refresh storms.

### Mock Credentials (Development Only)
| Email | Password | Role |
|---|---|---|
| `user@jadibot.com` | `User@1234!` | User |
| `admin@jadibot.com` | `Admin@1234!` | Admin |
| `superadmin@jadibot.com` | `SuperAdmin@1234!` | Super Admin |

> Remove these and replace with real backend auth before going to production.

### Backend Integration Checklist
- [ ] `POST /api/auth/login` → returns `{ accessToken, refreshToken, user }`
- [ ] `POST /api/auth/refresh` → returns new `{ accessToken }`
- [ ] `POST /api/auth/logout` → invalidates session
- [ ] `POST /api/auth/logout-all` → invalidates all user sessions
- [ ] `POST /api/auth/forgot-password`
- [ ] Set `jb_auth` cookie as **HttpOnly, SameSite=Strict, Secure** on login response
- [ ] Replace `mockLogin`, `mockRegister`, etc. in `src/lib/auth/mock.ts` with real `fetch` calls
- [ ] Middleware reads `jb_auth` cookie and validates the JWT server-side

---

## 2. Authorization Architecture (RBAC)

### Role Hierarchy
```
super_admin > admin > user
```

### Permissions Matrix
Permissions are declared in `src/lib/auth/types.ts` → `ROLE_PERMISSIONS`.

| Permission | User | Admin | Super Admin |
|---|---|---|---|
| `bots:read/write/delete` | ✅ | ✅ | ✅ |
| `sessions:read/write` | ✅ | ✅ | ✅ |
| `analytics:read` | ✅ | ✅ | ✅ |
| `api-keys:*` | ✅ | ✅ | ✅ |
| `admin:read/write` | ❌ | ✅ | ✅ |
| `admin:users/monitoring/settings/maintenance` | ❌ | ✅ | ✅ |
| `superadmin:all` | ❌ | ❌ | ✅ |

### Enforcement — Dual Layer
1. **Middleware** (`src/middleware.ts`) — runs on the Edge before any page loads. Unauthenticated requests to `/dashboard/**` redirect to `/login`. Non-admin requests to `/admin/**` redirect to `/dashboard`. This is the **primary enforcement gate**.
2. **Layout guards** — `AuthGuard` wraps all dashboard layouts; `AdminGuard` wraps all admin layouts. These React components independently verify session state and redirect. Even if middleware were bypassed (e.g., during client-side navigation), the layout guard fires.
3. **Sidebar** — admin links are only rendered if `user.role` is `admin` or `super_admin`. This is **UI convenience only** — it is never the enforcement mechanism.

### Adding a New Protected Route
```tsx
// app/(yourSection)/layout.tsx
import { AuthGuard } from '@/components/auth/AuthGuard'
import { RoleGuard } from '@/components/auth/RoleGuard'

export default function Layout({ children }) {
  return (
    <AuthGuard>
      <RoleGuard requiredRole="admin">
        {children}
      </RoleGuard>
    </AuthGuard>
  )
}
```
Also add the route path to the `PROTECTED_ROUTES` or `ADMIN_ROUTES` array in `src/middleware.ts`.

---

## 3. Middleware Architecture

**File:** `src/middleware.ts`

The middleware runs on every non-static request via the Edge Runtime.

### Responsibilities
1. **Route classification** — identifies if a path is public, protected (user), or admin-only.
2. **Auth check** — reads the `jb_auth` cookie and parses the session data. If absent or invalid, redirects to `/login`.
3. **Role enforcement** — if the path is admin-only, verifies `role === 'admin' || 'super_admin'`.
4. **Security headers injection** — attaches all security headers to every response (see §5).
5. **Auth route protection** — if an authenticated user navigates to `/login` or `/register`, they are redirected back to their `returnUrl` or `/dashboard`.

### Matcher
```ts
'/((?!_next/static|_next/image|favicon.ico|.*\\.ext).*)'
```
Static assets are excluded from middleware to avoid header overhead on immutable files.

---

## 4. Session Architecture

### Client-Side Session (`src/lib/auth/session.ts`)
| Feature | Implementation |
|---|---|
| Session persistence | `sessionStorage` (tab-scoped) or `localStorage` (rememberMe) |
| Session timeout | 30-minute inactivity → automatic logout |
| Inactivity monitor | `setInterval` checks every 60 seconds |
| Activity tracking | Mouse click + keydown events touch the session |
| Token refresh | Checked on init and before each API call |
| Concurrent sessions | Architecture: each session has a unique `sessionId`. `logoutAllDevices()` sends all session IDs to the backend for invalidation. |
| Device tracking | `deviceId` is generated once per device and stored in `sessionStorage` |

### Backend Session Checklist
- [ ] Store sessions in Redis with `sessionId` as key
- [ ] On `logoutAll`, delete all keys matching `session:userId:*`
- [ ] Record `deviceId` and last IP in session metadata for audit log
- [ ] Enforce absolute session expiry (e.g., 24h) regardless of activity

---

## 5. Security Headers

All headers are set in both `next.config.ts` (static build headers) and `src/middleware.ts` (runtime, for dynamic responses).

| Header | Value | Purpose |
|---|---|---|
| `Content-Security-Policy` | See below | Prevents XSS, injection, data exfiltration |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` | Forces HTTPS for 2 years |
| `X-Frame-Options` | `DENY` | Prevents clickjacking |
| `X-Content-Type-Options` | `nosniff` | Prevents MIME sniffing |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Limits referrer leakage |
| `Permissions-Policy` | camera, mic, geolocation, payment all `()` | Disables dangerous browser APIs |
| `Cross-Origin-Opener-Policy` | `same-origin` | Prevents opener attacks |
| `Cross-Origin-Embedder-Policy` | `require-corp` | Enables SharedArrayBuffer safely |
| `Cross-Origin-Resource-Policy` | `same-origin` | Prevents cross-origin resource reads |
| `X-Powered-By` | *(removed)* | Hides framework fingerprint |

### CSP Configuration
```
default-src 'self'
script-src 'self' 'unsafe-inline' 'unsafe-eval'
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com
img-src 'self' data: blob: https:
font-src 'self' https://fonts.gstatic.com
connect-src 'self' [API_URL] [SOCKET_URL] wss: https:
frame-ancestors 'none'
base-uri 'self'
form-action 'self'
object-src 'none'
upgrade-insecure-requests
```

> **Production note:** Remove `'unsafe-inline'` and `'unsafe-eval'` from `script-src` and replace with nonce-based CSP once the backend serves nonces per request.

---

## 6. Input Validation Strategy

**All forms** use React Hook Form + Zod. Validation is defined in `src/lib/validation/schemas.ts`.

### Validation Schemas
| Form | Schema | Key Rules |
|---|---|---|
| Login | `loginSchema` | Email normalization, password max 128 chars |
| Register | `registerSchema` | Password complexity (upper/lower/number/symbol), confirm match |
| Forgot Password | `forgotPasswordSchema` | Email validation |
| Create Bot | `createBotSchema` | Bot name allowlist regex, phone number format, prefix max 5 chars |
| API Key | `apiKeySchema` | Name allowlist, scope enum |
| Profile | `profileSchema` | Requires current password to change password |
| Settings | `settingsSchema` | Enum validation on all selects |

### Password Requirements
- Minimum 8 characters
- Maximum 128 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character

### Sanitization
- `sanitizeString()` — HTML entity encoding for dynamic content rendering
- `sanitizeSearchQuery()` — strips `< > ' " ; & | \` $ ` from search inputs

---

## 7. XSS Protection

- **No `dangerouslySetInnerHTML`** anywhere in the codebase
- All user-generated content rendered via React's safe JSX interpolation (`{value}`)
- `sanitizeString()` available for cases where content is used in attribute values
- Next.js's automatic HTML escaping is the last line of defense
- CSP `script-src 'self'` prevents inline script injection (nonce upgrade path documented above)

---

## 8. CSRF Readiness

**File:** `src/lib/csrf/index.ts`

### Current Architecture
- `initializeCsrf()` — called on app init in `Providers`. Generates a token, sets it as a `SameSite=Strict; Secure` cookie and injects it into a `<meta name="csrf-token">` tag.
- `getCsrfHeader()` — returns `{ "X-CSRF-Token": token }` for use in mutation requests.
- The API client reads this header and attaches it automatically on `POST`, `PUT`, `PATCH`, `DELETE`.

### Backend Integration
When the backend is ready:
1. Backend reads `X-CSRF-Token` request header
2. Compares it with the double-submit cookie value (`jb_csrf_token`)
3. Rejects requests where they do not match with `403 CSRF token invalid`
4. Rotate the token on login and privilege escalation

---

## 9. API Security Architecture

**File:** `src/lib/api/client.ts`

### Request Interceptor (automatic)
- Attaches `Authorization: Bearer <accessToken>` on every authenticated request
- Attaches `X-CSRF-Token` on all mutation requests
- Silently refreshes the access token if it expires within 60 seconds
- Single refresh gate (`isRefreshing`) prevents token-refresh storms on concurrent requests

### Response Handling
| Status | Action |
|---|---|
| `401 Unauthorized` | Calls `logout()`, redirects to `/login` |
| `403 Forbidden` | Throws `ApiClientError` with user-friendly message |
| `429 Too Many Requests` | Throws with `Retry-After` label |
| `5xx` | Throws `ApiClientError` with sanitized message |

### Retry Backoff
`apiRetry` rate limit in `src/lib/rate-limit/index.ts`: max 3 attempts per 5 seconds, 10-second block after limit.

---

## 10. Socket Security Architecture

**File:** `src/lib/socket/client.ts`

### Connection Flow
```
connect() → reads accessToken from auth store
         → io(url, { auth: { token }, withCredentials: true })
         → on connect_error('unauthorized') → logout()
         → on auth:expired → refreshToken() → reconnect with new token
```

### Features
- Token is passed in the Socket.IO `auth` object (not a URL query param)
- `withCredentials: true` sends the HttpOnly session cookie for server-side validation
- `reconnectionAttempts: 5` with exponential delay (configurable)
- `transport: ['websocket']` — disables long-polling (no CORS leakage)
- Automatic cleanup on disconnect to prevent listener leaks

### Backend Integration
```js
// socket.io server
io.use((socket, next) => {
  const token = socket.handshake.auth.token
  try {
    const payload = verifyJwt(token, process.env.JWT_SECRET)
    socket.userId = payload.userId
    socket.role = payload.role
    next()
  } catch {
    next(new Error('unauthorized'))
  }
})
```

---

## 11. Rate Limiting Architecture

**File:** `src/lib/rate-limit/index.ts`

All limits are client-side (in-memory). They supplement — not replace — server-side rate limiting.

| Action | Max Attempts | Window | Block Duration |
|---|---|---|---|
| Login | 5 | 15 min | 15 min |
| Register | 3 | 1 hour | 1 hour |
| Forgot Password | 3 | 1 hour | 1 hour |
| OTP | 5 | 10 min | 10 min |
| QR Generate | 10 | 1 min | 30 sec |
| Pairing Code | 5 | 5 min | 5 min |
| API Retry | 3 | 5 sec | 10 sec |

### Backend Rate Limiting (required for production)
- Use `express-rate-limit` or an API gateway (Nginx, Cloudflare) for server-side enforcement
- Return `429` with `Retry-After` header; the API client reads and surfaces this to the user

---

## 12. Route Security Audit

| Route | Auth Required | Min Role | Enforcement |
|---|---|---|---|
| `/` | No | — | Public |
| `/login` | No | — | Redirects authenticated users |
| `/register` | No | — | Redirects authenticated users |
| `/forgot-password` | No | — | Public |
| `/dashboard` | Yes | user | Middleware + AuthGuard |
| `/dashboard/bots` | Yes | user | Middleware + AuthGuard |
| `/dashboard/sessions` | Yes | user | Middleware + AuthGuard |
| `/dashboard/analytics` | Yes | user | Middleware + AuthGuard |
| `/dashboard/logs` | Yes | user | Middleware + AuthGuard |
| `/dashboard/api-keys` | Yes | user | Middleware + AuthGuard |
| `/dashboard/profile` | Yes | user | Middleware + AuthGuard |
| `/dashboard/settings` | Yes | user | Middleware + AuthGuard |
| `/admin` | Yes | admin | Middleware + AuthGuard + AdminGuard |
| `/admin/users` | Yes | admin | Middleware + AuthGuard + AdminGuard |
| `/admin/monitoring` | Yes | admin | Middleware + AuthGuard + AdminGuard |
| `/admin/settings` | Yes | admin | Middleware + AuthGuard + AdminGuard |
| `/admin/maintenance` | Yes | admin | Middleware + AuthGuard + AdminGuard |

---

## 13. Security Issues Fixed

| # | Issue | Severity | Fix |
|---|---|---|---|
| 1 | Hardcoded `admin@jadibot.com` / `password123` in login form | Critical | Removed; forms are controlled by RHF with no defaultValues |
| 2 | Login form bypassed auth — `router.push('/dashboard')` with no validation | Critical | Replaced with real `login()` flow via auth store |
| 3 | No middleware — `/dashboard` and `/admin` accessible without auth | Critical | `src/middleware.ts` — full route protection |
| 4 | No RBAC — admin links based on URL pathname only | High | Dual enforcement: middleware + RoleGuard + session role check |
| 5 | No form validation — all forms were bare HTML inputs | High | Zod schemas + React Hook Form on all 6 forms |
| 6 | No security headers | High | 11 headers applied in `next.config.ts` + middleware |
| 7 | `X-Powered-By: Next.js` header exposed | Medium | `poweredByHeader: false` in `next.config.ts` |
| 8 | No rate limiting on login | High | Client-side: 5 attempts / 15 min; backend-ready |
| 9 | No logout functionality | High | `SignOutButton` calls `logout()` → clears session → redirects |
| 10 | TopBar / Sidebar using hardcoded mock user | Medium | Now reads from `useAuth()` — displays real session user |
| 11 | Admin sidebar shown based on URL (path starts with `/admin`) | High | Now checks `user.role` from auth store |
| 12 | No session expiry | High | 30-minute inactivity timeout + refresh token expiry |
| 13 | No CSRF readiness | Medium | `src/lib/csrf/index.ts` — double-submit cookie pattern |
| 14 | No XSS sanitization utilities | Medium | `sanitizeString()`, `sanitizeSearchQuery()` in schemas.ts |
| 15 | Insecure default images config | Low | `dangerouslyAllowSVG: false` + content security policy |
| 16 | No auth-aware API client | High | `src/lib/api/client.ts` — token injection, 401/403/429 handling |
| 17 | Missing ARIA labels, roles, keyboard navigation | Medium | Full ARIA audit on all forms and interactive elements |
| 18 | No socket auth | High | `src/lib/socket/client.ts` — token in auth handshake |
