import type { Metadata } from 'next'
import { BotListPage } from '@/components/pages/dashboard/BotListPage'

export const metadata: Metadata = { title: 'Bot Fleet' }

export default function Bots() {
  return <BotListPage />
}
