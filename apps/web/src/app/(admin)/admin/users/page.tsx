import type { Metadata } from 'next'
import { UserManagementPage } from '@/components/pages/admin/UserManagementPage'

export const metadata: Metadata = { title: 'User Management' }

export default function Users() {
  return <UserManagementPage />
}
