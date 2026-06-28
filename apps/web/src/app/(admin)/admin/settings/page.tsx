import type { Metadata } from 'next'
import { AdminSettingsPage } from '@/components/pages/admin/AdminSettingsPage'

export const metadata: Metadata = { title: 'Platform Settings' }

export default function AdminSettings() {
  return <AdminSettingsPage />
}
