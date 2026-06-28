import { apiClient } from './client'
import type {
  AdminUser,
  ApiKey,
  Bot,
  ChartDataPoint,
  Command,
  Log,
  AppNotification,
  Plugin,
} from '@/types'

/**
 * Typed access to the backend REST API. Every backend response uses the envelope
 * `{ success, message, data, meta }`; these helpers unwrap `data` so callers get
 * clean domain objects matching the shared `@/types` definitions.
 */

interface Envelope<T> {
  success: boolean
  message: string
  data: T
  meta?: Record<string, unknown>
}

function qs(params?: Record<string, string | number | undefined>): string {
  if (!params) return ''
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== '')
  if (entries.length === 0) return ''
  return `?${entries.map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`).join('&')}`
}

const unwrap = <T>(res: Envelope<T>): T => res.data

// ── Bots ──────────────────────────────────────────────────────
export const botsApi = {
  list: () => apiClient.get<Envelope<Bot[]>>('/bots?pageSize=100').then(unwrap),
  get: (id: string) => apiClient.get<Envelope<Bot>>(`/bots/${id}`).then(unwrap),
  create: (payload: { name: string; prefix?: string; mode?: string }) =>
    apiClient.post<Envelope<Bot>>('/bots', payload).then(unwrap),
  update: (id: string, payload: Partial<Bot>) =>
    apiClient.patch<Envelope<Bot>>(`/bots/${id}`, payload).then(unwrap),
  updateSettings: (id: string, payload: Record<string, unknown>) =>
    apiClient.patch<Envelope<Bot>>(`/bots/${id}/settings`, payload).then(unwrap),
  restart: (id: string) => apiClient.post<Envelope<null>>(`/bots/${id}/restart`).then(unwrap),
  remove: (id: string) => apiClient.delete<Envelope<null>>(`/bots/${id}`).then(unwrap),
}

// ── Sessions ──────────────────────────────────────────────────
export interface SessionInfo {
  id: string
  botId: string
  status: string
  jid: string | null
  phone: string | null
  device: string
  reconnectCount: number
  lastConnectedAt: string | null
  lastSeen: string | null
  createdAt: string
  live: boolean
}

export const sessionsApi = {
  list: () => apiClient.get<Envelope<SessionInfo[]>>('/sessions').then(unwrap),
  create: (botId: string) =>
    apiClient.post<Envelope<{ botId: string; status: string; qr: string | null }>>('/sessions/create', { botId }).then(unwrap),
  qr: (botId: string) =>
    apiClient.post<Envelope<{ botId: string; status: string; qr: string | null }>>('/sessions/qr', { botId }).then(unwrap),
  pairing: (botId: string, phoneNumber: string) =>
    apiClient.post<Envelope<{ botId: string; code: string | null }>>('/sessions/pairing-code', { botId, phoneNumber }).then(unwrap),
  reconnect: (botId: string) => apiClient.post<Envelope<unknown>>('/sessions/reconnect', { botId }).then(unwrap),
  disconnect: (botId: string) => apiClient.post<Envelope<unknown>>('/sessions/disconnect', { botId }).then(unwrap),
  logout: (botId: string) => apiClient.post<Envelope<unknown>>('/sessions/logout', { botId }).then(unwrap),
  destroy: (id: string) => apiClient.delete<Envelope<null>>(`/sessions/${id}`).then(unwrap),
}

// ── Plugins ───────────────────────────────────────────────────
export const pluginsApi = {
  list: () => apiClient.get<Envelope<Plugin[]>>('/plugins?pageSize=100').then(unwrap),
  install: (payload: { name: string; description?: string; category?: string }) =>
    apiClient.post<Envelope<Plugin>>('/plugins/install', payload).then(unwrap),
  setStatus: (id: string, status: 'active' | 'inactive') =>
    apiClient.patch<Envelope<Plugin>>(`/plugins/${id}`, { status }).then(unwrap),
  remove: (id: string) => apiClient.delete<Envelope<null>>(`/plugins/${id}`).then(unwrap),
  reload: () => apiClient.post<Envelope<{ reloaded: number }>>('/plugins/reload').then(unwrap),
}

// ── Commands ──────────────────────────────────────────────────
export const commandsApi = {
  list: () => apiClient.get<Envelope<Command[]>>('/commands?pageSize=200').then(unwrap),
  setEnabled: (id: string, enabled: boolean) =>
    apiClient.patch<Envelope<Command>>(`/commands/${id}`, { enabled }).then(unwrap),
  reload: () => apiClient.post<Envelope<{ reloaded: number }>>('/commands/reload').then(unwrap),
}

// ── Analytics ─────────────────────────────────────────────────
export interface AnalyticsOverview {
  totalBots: number
  onlineBots: number
  offlineBots: number
  messagesHandled: number
  activeUsers: number
  chart: ChartDataPoint[]
}

export const analyticsApi = {
  overview: () => apiClient.get<Envelope<AnalyticsOverview>>('/analytics').then(unwrap),
  messages: () => apiClient.get<Envelope<ChartDataPoint[]>>('/analytics/messages').then(unwrap),
  bots: () =>
    apiClient
      .get<Envelope<Array<{ id: string; name: string; status: string; messages: number }>>>('/analytics/bots')
      .then(unwrap),
}

// ── Logs ──────────────────────────────────────────────────────
export const logsApi = {
  list: (params?: { level?: string; source?: string; search?: string; botId?: string }) =>
    apiClient.get<Envelope<Log[]>>(`/logs${qs({ pageSize: 100, ...params })}`).then(unwrap),
}

// ── Notifications ─────────────────────────────────────────────
export const notificationsApi = {
  list: () => apiClient.get<Envelope<AppNotification[]>>('/notifications?pageSize=50').then(unwrap),
  markRead: (id: string) => apiClient.patch<Envelope<null>>('/notifications/read', { id }).then(unwrap),
  markAllRead: () => apiClient.patch<Envelope<null>>('/notifications/read-all').then(unwrap),
}

// ── API keys ──────────────────────────────────────────────────
export const apiKeysApi = {
  list: () => apiClient.get<Envelope<ApiKey[]>>('/api-keys').then(unwrap),
  create: (payload: { name: string; scope?: string[] }) =>
    apiClient.post<Envelope<ApiKey & { key: string }>>('/api-keys', payload).then(unwrap),
  revoke: (id: string) => apiClient.delete<Envelope<null>>(`/api-keys/${id}`).then(unwrap),
}

// ── Admin ─────────────────────────────────────────────────────
export interface AdminDashboard {
  totals: {
    users: number
    bots: number
    onlineBots: number
    offlineBots: number
    sessions: number
    liveSessions: number
    messages: number
  }
  health: Record<string, string>
  system: {
    cpu: number
    memory: { percent: number; used: number; total: number }
    uptime: number
    platform: string
    cores: number
  }
}

export const adminApi = {
  dashboard: () => apiClient.get<Envelope<AdminDashboard>>('/admin/dashboard').then(unwrap),
  monitoring: () => apiClient.get<Envelope<AdminDashboard>>('/admin/monitoring').then(unwrap),
  users: () => apiClient.get<Envelope<AdminUser[]>>('/admin/users?pageSize=100').then(unwrap),
  updateUser: (id: string, payload: { status?: string; role?: string; plan?: string }) =>
    apiClient.patch<Envelope<AdminUser>>(`/admin/users/${id}`, payload).then(unwrap),
  deleteUser: (id: string) => apiClient.delete<Envelope<null>>(`/admin/users/${id}`).then(unwrap),
}
