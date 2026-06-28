export type BotStatus = 'online' | 'offline'
export type BotMode = 'public' | 'self' | 'group'
export type LogLevel = 'info' | 'warn' | 'error' | 'debug'
export type NotificationType = 'error' | 'success' | 'warning' | 'info'
export type UserStatus = 'active' | 'suspended'
export type PluginStatus = 'active' | 'inactive'

export interface Bot {
  id: string
  name: string
  status: BotStatus
  device: string
  ping: number | null
  uptime: string
  messagesHandled: number
  activeUsers: number
  prefix: string
  mode: BotMode
  autoRead: boolean
  autoTyping: boolean
  autoRecording: boolean
  autoReact: boolean
  ownerName: string
  ownerNumber: string
  bio: string
  language: string
  timezone: string
  footer: string
}

export interface Activity {
  id: number
  type: 'connect' | 'message' | 'disconnect'
  botId: string
  message: string
  time: string
  location: string
}

export interface ChartDataPoint {
  date: string
  messages: number
  users: number
}

export interface Plugin {
  id: string
  name: string
  description: string
  category: string
  status: PluginStatus
  version: string
  author: string
}

export interface Command {
  id: string
  command: string
  description: string
  category: string
  usage: number
  enabled: boolean
}

export interface Log {
  id: string
  level: LogLevel
  message: string
  timestamp: string
  source: string
}

export interface AppNotification {
  id: string
  type: NotificationType
  title: string
  message: string
  time: string
  read: boolean
}

export interface ApiKey {
  id: string
  name: string
  prefix: string
  maskedKey: string
  scope: string[]
  createdAt: string
  lastUsed: string
}

export interface AdminUser {
  id: string
  name: string
  email: string
  plan: string
  bots: number
  status: UserStatus
  joinedAt: string
}

export interface NavLink {
  href: string
  icon: React.ElementType
  label: string
  badge?: number
}

export type { UserRole, Permission } from '@/lib/auth/types'
export { hasPermission, hasAnyPermission, hasAllPermissions, isRoleAtLeast, ROLE_PERMISSIONS } from '@/lib/auth/types'
