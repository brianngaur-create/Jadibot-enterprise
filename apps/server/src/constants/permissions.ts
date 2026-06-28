import type { Role } from '@prisma/client';

/**
 * Granular permissions. Kept in sync with the frontend's
 * `src/lib/auth/types.ts` so client and server agree on access control.
 */
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
  | 'commands:read'
  | 'commands:write'
  | 'notifications:read'
  | 'notifications:write'
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
  | 'superadmin:all';

const USER_PERMISSIONS: Permission[] = [
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
  'commands:read',
  'commands:write',
  'notifications:read',
  'notifications:write',
  'profile:read',
  'profile:write',
  'settings:read',
  'settings:write',
];

const ADMIN_PERMISSIONS: Permission[] = [
  ...USER_PERMISSIONS,
  'admin:read',
  'admin:write',
  'admin:users',
  'admin:monitoring',
  'admin:settings',
  'admin:maintenance',
];

const SUPER_ADMIN_PERMISSIONS: Permission[] = [
  ...ADMIN_PERMISSIONS,
  'superadmin:all',
];

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  USER: USER_PERMISSIONS,
  ADMIN: ADMIN_PERMISSIONS,
  SUPER_ADMIN: SUPER_ADMIN_PERMISSIONS,
};

export function hasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}

const ROLE_RANK: Record<Role, number> = {
  USER: 1,
  ADMIN: 2,
  SUPER_ADMIN: 3,
};

export function isRoleAtLeast(role: Role, required: Role): boolean {
  return ROLE_RANK[role] >= ROLE_RANK[required];
}
