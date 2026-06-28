import { apiClient } from '@/lib/api/client'
import type {
  AuthSession,
  AuthTokens,
  LoginCredentials,
  RegisterCredentials,
} from './types'

/**
 * Real authentication API. Mirrors the signatures of the former `mock.ts` so the
 * auth store can swap implementations transparently. The backend wraps every
 * response in `{ success, message, data }`; we unwrap `data` here.
 */

interface Envelope<T> {
  success: boolean
  message: string
  data: T
}

const DEVICE_ID_KEY = 'jb_device_id'

function getDeviceId(): string {
  if (typeof window === 'undefined') return 'server'
  let id = window.localStorage.getItem(DEVICE_ID_KEY)
  if (!id) {
    id = `dev_${crypto.randomUUID()}`
    window.localStorage.setItem(DEVICE_ID_KEY, id)
  }
  return id
}

const deviceHeaders = () => ({ 'X-Device-Id': getDeviceId() })

export async function apiLogin(credentials: LoginCredentials): Promise<{ session: AuthSession }> {
  const res = await apiClient.post<Envelope<{ session: AuthSession }>>(
    '/auth/login',
    credentials,
    { skipAuth: true, headers: deviceHeaders() },
  )
  return res.data
}

export async function apiRegister(payload: RegisterCredentials): Promise<{ session: AuthSession }> {
  const res = await apiClient.post<Envelope<{ session: AuthSession }>>(
    '/auth/register',
    payload,
    { skipAuth: true, headers: deviceHeaders() },
  )
  return res.data
}

export async function apiRefreshToken(refreshToken: string): Promise<AuthTokens> {
  const res = await apiClient.post<Envelope<{ session: AuthSession }>>(
    '/auth/refresh',
    { refreshToken },
    { skipAuth: true, skipRefresh: true, headers: deviceHeaders() },
  )
  return res.data.session.tokens
}

export async function apiLogout(_sessionId: string): Promise<void> {
  await apiClient.post('/auth/logout', undefined, { skipRefresh: true }).catch(() => undefined)
}

export async function apiLogoutAll(_userId: string): Promise<void> {
  await apiClient.post('/auth/logout-all', undefined, { skipRefresh: true }).catch(() => undefined)
}

export async function apiForgotPassword(email: string): Promise<void> {
  await apiClient.post('/auth/forgot-password', { email }, { skipAuth: true })
}
