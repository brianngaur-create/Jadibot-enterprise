import type { ReactNode } from 'react'
import { AppLayout } from '@/components/layout/AppLayout'
import { AuthGuard } from '@/components/auth/AuthGuard'
import { AdminGuard } from '@/components/auth/RoleGuard'

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGuard>
      <AdminGuard>
        <AppLayout>{children}</AppLayout>
      </AdminGuard>
    </AuthGuard>
  )
}
