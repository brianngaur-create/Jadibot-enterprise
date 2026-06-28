import type { Metadata } from 'next'
import { MaintenancePage } from '@/components/pages/admin/MaintenancePage'

export const metadata: Metadata = { title: 'Maintenance' }

export default function Maintenance() {
  return <MaintenancePage />
}
