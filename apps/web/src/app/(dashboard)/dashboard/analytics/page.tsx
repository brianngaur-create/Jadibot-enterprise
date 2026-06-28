import type { Metadata } from 'next'
import { AnalyticsPage } from '@/components/pages/dashboard/AnalyticsPage'

export const metadata: Metadata = { title: 'Analytics' }

export default function Analytics() {
  return <AnalyticsPage />
}
