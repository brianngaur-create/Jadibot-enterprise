import type { Metadata } from 'next'
import { NotificationsPage } from '@/components/pages/dashboard/NotificationsPage'

export const metadata: Metadata = { title: 'Notifications' }

export default function Notifications() {
  return <NotificationsPage />
}
