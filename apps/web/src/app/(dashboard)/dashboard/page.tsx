import type { Metadata } from 'next'
import { DashboardPage } from '@/components/pages/dashboard/DashboardPage'

export const metadata: Metadata = { title: 'Dashboard' }

export default function Dashboard() {
  return <DashboardPage />
}
