import { useAuthStore } from '@/lib/auth/store'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? '/api'

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

export interface ApiRequestOptions extends RequestInit {
  skipAuth?: boolean
  skipRefresh?: boolean
  timeout?: number
}

export interface ApiError {
  status: number
  code: string
  message: string
  details?: unknown
}

export class ApiClientError extends Error {
  status: number
  code: string
  details?: unknown

  constructor(error: ApiError) {
    super(error.message)
    this.name = 'ApiClientError'
    this.status = error.status
    this.code = error.code
    this.details = error.details
  }
}

let isRefreshing = false
let refreshSubscribers: Array<(token: string) => void> = []

function onRefreshed(token: string): void {
  refreshSubscribers.forEach((cb) => cb(token))
  refreshSubscribers = []
}

function addRefreshSubscriber(cb: (token: string) => void): void {
  refreshSubscribers.push(cb)
}

async function refreshTokenIfNeeded(): Promise<string | null> {
  const state = useAuthStore.getState()
  const session = state.session
  if (!session) return null

  const { tokens } = session
  const now = Date.now()
  const expiresIn = tokens.accessTokenExpiresAt - now

  if (expiresIn > 60_000) return tokens.accessToken

  if (isRefreshing) {
    return new Promise((resolve) => {
      addRefreshSubscriber(resolve)
    })
  }

  isRefreshing = true
  try {
    await state.refreshSession()
    const newToken = useAuthStore.getState().session?.tokens.accessToken ?? null
    if (newToken) onRefreshed(newToken)
    return newToken
  } catch {
    useAuthStore.getState().logout()
    return null
  } finally {
    isRefreshing = false
  }
}

async function request<T>(
  path: string,
  method: HttpMethod,
  body?: unknown,
  options: ApiRequestOptions = {}
): Promise<T> {
  const { skipAuth = false, skipRefresh = false, timeout = 30_000, ...fetchOptions } = options

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      ...(fetchOptions.headers as Record<string, string>),
    }

    if (!skipAuth) {
      let token: string | null = null
      if (!skipRefresh) {
        token = await refreshTokenIfNeeded()
      } else {
        token = useAuthStore.getState().session?.tokens.accessToken ?? null
      }
      if (token) headers['Authorization'] = `Bearer ${token}`
    }

    const csrfToken = getCsrfToken()
    if (csrfToken && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      headers['X-CSRF-Token'] = csrfToken
    }

    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...fetchOptions,
      method,
      headers,
      body: body != null ? JSON.stringify(body) : undefined,
      signal: controller.signal,
      credentials: 'include',
    })

    if (response.status === 401) {
      if (!skipRefresh) {
        useAuthStore.getState().logout()
      }
      throw new ApiClientError({
        status: 401,
        code: 'UNAUTHORIZED',
        message: 'Your session has expired. Please sign in again.',
      })
    }

    if (response.status === 403) {
      throw new ApiClientError({
        status: 403,
        code: 'FORBIDDEN',
        message: 'You do not have permission to perform this action.',
      })
    }

    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After')
      throw new ApiClientError({
        status: 429,
        code: 'RATE_LIMITED',
        message: `Too many requests. Please wait ${retryAfter ?? 'a moment'} before trying again.`,
      })
    }

    if (!response.ok) {
      let errorData: ApiError
      try {
        errorData = await response.json()
      } catch {
        errorData = {
          status: response.status,
          code: 'API_ERROR',
          message: `Server error (${response.status})`,
        }
      }
      throw new ApiClientError(errorData)
    }

    if (response.status === 204) return undefined as T

    return response.json() as Promise<T>
  } finally {
    clearTimeout(timeoutId)
  }
}

function getCsrfToken(): string | null {
  if (typeof document === 'undefined') return null
  const meta = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')
  return meta?.content ?? null
}

export const apiClient = {
  get: <T>(path: string, options?: ApiRequestOptions) =>
    request<T>(path, 'GET', undefined, options),
  post: <T>(path: string, body?: unknown, options?: ApiRequestOptions) =>
    request<T>(path, 'POST', body, options),
  put: <T>(path: string, body?: unknown, options?: ApiRequestOptions) =>
    request<T>(path, 'PUT', body, options),
  patch: <T>(path: string, body?: unknown, options?: ApiRequestOptions) =>
    request<T>(path, 'PATCH', body, options),
  delete: <T>(path: string, options?: ApiRequestOptions) =>
    request<T>(path, 'DELETE', undefined, options),
}
