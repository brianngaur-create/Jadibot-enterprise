'use client'

import { create } from 'zustand'
import type { AuthState, LoginCredentials, RegisterCredentials } from './types'
import {
  saveSession,
  loadSession,
  clearSession,
  updateSessionActivity,
  updateSessionTokens,
  startInactivityMonitor,
  stopInactivityMonitor,
  isAccessTokenExpiringSoon,
  isRefreshTokenExpired,
} from './session'
import {
  apiLogin,
  apiRegister,
  apiRefreshToken,
  apiLogout,
  apiLogoutAll,
  apiForgotPassword,
} from './api'

interface AuthStore extends AuthState {
  initialize: () => Promise<void>
  login: (credentials: LoginCredentials) => Promise<void>
  register: (payload: RegisterCredentials) => Promise<void>
  logout: () => Promise<void>
  logoutAllDevices: () => Promise<void>
  forgotPassword: (email: string) => Promise<void>
  refreshSession: () => Promise<void>
  touchSession: () => void
  clearError: () => void
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  session: null,
  isLoading: false,
  isInitialized: false,
  error: null,

  initialize: async () => {
    const existing = loadSession()
    if (existing) {
      if (isRefreshTokenExpired(existing.tokens)) {
        clearSession()
        set({ session: null, isInitialized: true })
        return
      }
      if (isAccessTokenExpiringSoon(existing.tokens)) {
        try {
          const newTokens = await apiRefreshToken(existing.tokens.refreshToken)
          const updated = updateSessionTokens(existing, newTokens)
          set({ session: updated, isInitialized: true })
        } catch {
          clearSession()
          set({ session: null, isInitialized: true })
          return
        }
      } else {
        set({ session: existing, isInitialized: true })
      }
      startInactivityMonitor(() => {
        set({ session: null })
      })
    } else {
      set({ session: null, isInitialized: true })
    }
  },

  login: async (credentials) => {
    set({ isLoading: true, error: null })
    try {
      const { session } = await apiLogin(credentials)
      saveSession(session)
      startInactivityMonitor(() => set({ session: null }))
      set({ session, isLoading: false, error: null })
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Login failed. Please try again.'
      set({ isLoading: false, error: msg })
      throw err
    }
  },

  register: async (payload) => {
    set({ isLoading: true, error: null })
    try {
      const { session } = await apiRegister(payload)
      saveSession(session)
      startInactivityMonitor(() => set({ session: null }))
      set({ session, isLoading: false, error: null })
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Registration failed. Please try again.'
      set({ isLoading: false, error: msg })
      throw err
    }
  },

  logout: async () => {
    const session = get().session
    set({ isLoading: true })
    try {
      if (session) await apiLogout(session.sessionId)
    } finally {
      clearSession()
      stopInactivityMonitor()
      set({ session: null, isLoading: false, error: null })
    }
  },

  logoutAllDevices: async () => {
    const session = get().session
    set({ isLoading: true })
    try {
      if (session) await apiLogoutAll(session.user.id)
    } finally {
      clearSession()
      stopInactivityMonitor()
      set({ session: null, isLoading: false, error: null })
    }
  },

  forgotPassword: async (email) => {
    set({ isLoading: true, error: null })
    try {
      await apiForgotPassword(email)
      set({ isLoading: false })
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to send reset email.'
      set({ isLoading: false, error: msg })
      throw err
    }
  },

  refreshSession: async () => {
    const session = get().session
    if (!session) return
    try {
      const newTokens = await apiRefreshToken(session.tokens.refreshToken)
      const updated = updateSessionTokens(session, newTokens)
      set({ session: updated })
    } catch {
      clearSession()
      stopInactivityMonitor()
      set({ session: null })
    }
  },

  touchSession: () => {
    const session = get().session
    if (!session) return
    const updated = updateSessionActivity(session)
    set({ session: updated })
  },

  clearError: () => set({ error: null }),
}))

export function useAuth() {
  const store = useAuthStore()
  const session = store.session
  const user = session?.user ?? null

  return {
    user,
    session,
    isLoading: store.isLoading,
    isInitialized: store.isInitialized,
    isAuthenticated: !!session,
    isAdmin: user?.role === 'admin' || user?.role === 'super_admin',
    isSuperAdmin: user?.role === 'super_admin',
    error: store.error,
    login: store.login,
    register: store.register,
    logout: store.logout,
    logoutAllDevices: store.logoutAllDevices,
    forgotPassword: store.forgotPassword,
    refreshSession: store.refreshSession,
    touchSession: store.touchSession,
    clearError: store.clearError,
    initialize: store.initialize,
  }
}
