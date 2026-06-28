import type { Metadata } from 'next'
import { MonitoringPage } from '@/components/pages/admin/MonitoringPage'

export const metadata: Metadata = { title: 'System Monitoring' }

export default function Monitoring() {
  return <MonitoringPage />
}
