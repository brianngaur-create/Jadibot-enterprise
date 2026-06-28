import type { Metadata } from 'next'
import { BotSettingsPage } from '@/components/pages/dashboard/BotSettingsPage'

export const metadata: Metadata = { title: 'Bot Settings' }

export default async function BotSettings({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <BotSettingsPage id={id} />
}
