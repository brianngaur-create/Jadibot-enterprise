import type { Metadata } from 'next'
import { BotDetailPage } from '@/components/pages/dashboard/BotDetailPage'

export const metadata: Metadata = { title: 'Bot Details' }

export default async function BotDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <BotDetailPage id={id} />
}
