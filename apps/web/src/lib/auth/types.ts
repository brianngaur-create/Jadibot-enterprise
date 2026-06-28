export type UserRole = 'user' | 'admin' | 'super_admin'

export type UserStatus = 'active' | 'suspended' | 'pending_verification'

export interface AuthUser {
  id: string
  email: string
  name: string
  role: UserRole
  status: UserStatus
  plan: 'starter' | 'pro' | 'enterprise'
  avatarInitials: string
  emailVerified: boolean
  twoFactorEnabled: boolean
  createdAt: string
  lastLoginAt: string
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
  accessTokenExpiresAt: number
  refreshTokenExpiresAt: number
}

export interface AuthSession {
  user: AuthUser
  tokens: AuthTokens
  deviceId: string
  sessionId: string
  rememberMe: boolean
  createdAt: number
  lastActiveAt: number
}

export interface LoginCredentials {
  email: string
  password: string
  rememberMe: boolean
}

export interface RegisterCredentials {
  firstName: string
  lastName: string
  email: string
  password: string
  plan: 'starter' | 'pro' | 'enterprise'
  acceptTerms: boolean
}

export interface ForgotPasswordPayload {
  email: string
}

export interface AuthState {
  session: AuthSession | null
  isLoading: boolean
  isInitialized: boolean
  error: string | null
}

export type Permission =
  | 'bots:read'
  | 'bots:write'
  | 'bots:delete'
  | 'sessions:read'
  | 'sessions:write'
  | 'analytics:read'
  | 'logs:read'
  | 'api-keys:read'
  | 'api-keys:write'
  | 'api-keys:delete'
  | 'plugins:read'
  | 'plugins:write'
  | 'profile:read'
  | 'profile:write'
  | 'settings:read'
  | 'settings:write'
  | 'admin:read'
  | 'admin:write'
  | 'admin:users'
  | 'admin:monitoring'
  | 'admin:settings'
  | 'admin:maintenance'
  | 'superadmin:all'

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  user: [
    'bots:read',
    'bots:write',
    'bots:delete',
    'sessions:read',
    'sessions:write',
    'analytics:read',
    'logs:read',
    'api-keys:read',
    'api-keys:write',
    'api-keys:delete',
    'plugins:read',
    'plugins:write',
    'profile:read',
    'profile:write',
    'settings:read',
    'settings:write',
  ],
  admin: [
    'bots:read',
    'bots:write',
    'bots:delete',
    'sessions:read',
    'sessions:write',
    'analytics:read',
    'logs:read',
    'api-keys:read',
    'api-keys:write',
    'api-keys:delete',
    'plugins:read',
    'plugins:write',
    'profile:read',
    'profile:write',
    'settings:read',
    'settings:write',
    'admin:read',
    'admin:write',
    'admin:users',
    'admin:monitoring',
    'admin:settings',
    'admin:maintenance',
  ],
  super_admin: [
    'bots:read',
    'bots:write',
    'bots:delete',
    'sessions:read',
    'sessions:write',
    'analytics:read',
    'logs:read',
    'api-keys:read',
    'api-keys:write',
    'api-keys:delete',
    'plugins:read',
    'plugins:write',
    'profile:read',
    'profile:write',
    'settings:read',
    'settings:write',
    'admin:read',
    'admin:write',
    'admin:users',
    'admin:monitoring',
    'admin:settings',
    'admin:maintenance',
    'superadmin:all',
  ],
}

export function hasPermission(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission)
}

export function hasAnyPermission(role: UserRole, permissions: Permission[]): boolean {
  return permissions.some((p) => hasPermission(role, p))
}

export function hasAllPermissions(role: UserRole, permissions: Permission[]): boolean {
  return permissions.every((p) => hasPermission(role, p))
}

export function isRoleAtLeast(userRole: UserRole, requiredRole: UserRole): boolean {
  const hierarchy: Record<UserRole, number> = { user: 1, admin: 2, super_admin: 3 }
  return hierarchy[userRole] >= hierarchy[requiredRole]
}
