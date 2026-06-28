import type { Metadata } from 'next'
import { AdminDashboardPage } from '@/components/pages/admin/AdminDashboardPage'

export const metadata: Metadata = { title: 'Admin Dashboard' }

export default function AdminDashboard() {
  return <AdminDashboardPage />
}
