import type { Metadata } from 'next'
import { LogsPage } from '@/components/pages/dashboard/LogsPage'

export const metadata: Metadata = { title: 'System Logs' }

export default function Logs() {
  return <LogsPage />
}
