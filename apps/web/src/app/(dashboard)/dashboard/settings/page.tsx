import type { Metadata } from 'next'
import { SettingsPage } from '@/components/pages/dashboard/SettingsPage'

export const metadata: Metadata = { title: 'Settings' }

export default function Settings() {
  return <SettingsPage />
}
