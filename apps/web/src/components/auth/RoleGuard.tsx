'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth/store'
import { isRoleAtLeast } from '@/lib/auth/types'
import type { UserRole, Permission } from '@/lib/auth/types'
import { hasPermission, hasAnyPermission } from '@/lib/auth/types'

interface RoleGuardProps {
  children: React.ReactNode
  requiredRole?: UserRole
  requiredPermission?: Permission
  requiredAnyPermission?: Permission[]
  fallback?: React.ReactNode
  redirectTo?: string
}

export function RoleGuard({
  children,
  requiredRole,
  requiredPermission,
  requiredAnyPermission,
  fallback,
  redirectTo = '/dashboard',
}: RoleGuardProps) {
  const { user, isAuthenticated } = useAuth()
  const router = useRouter()

  const isAuthorized = (() => {
    if (!isAuthenticated || !user) return false
    if (requiredRole && !isRoleAtLeast(user.role, requiredRole)) return false
    if (requiredPermission && !hasPermission(user.role, requiredPermission)) return false
    if (requiredAnyPermission && !hasAnyPermission(user.role, requiredAnyPermission)) return false
    return true
  })()

  useEffect(() => {
    if (isAuthenticated && !isAuthorized) {
      router.replace(redirectTo)
    }
  }, [isAuthenticated, isAuthorized, redirectTo, router])

  if (!isAuthorized) {
    return fallback ?? (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-3">
          <div className="text-4xl font-bold text-destructive">403</div>
          <h2 className="text-xl font-semibold text-foreground">Access Denied</h2>
          <p className="text-sm text-muted-foreground max-w-xs">
            You do not have the required permissions to view this page.
          </p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

export function AdminGuard({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return (
    <RoleGuard requiredRole="admin" redirectTo="/dashboard" fallback={fallback}>
      {children}
    </RoleGuard>
  )
}

export function SuperAdminGuard({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return (
    <RoleGuard requiredRole="super_admin" redirectTo="/dashboard" fallback={fallback}>
      {children}
    </RoleGuard>
  )
}
