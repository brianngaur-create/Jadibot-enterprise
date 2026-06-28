import type { Metadata } from 'next'
import { CreateBotPage } from '@/components/pages/dashboard/CreateBotPage'

export const metadata: Metadata = { title: 'Deploy New Bot' }

export default function CreateBot() {
  return <CreateBotPage />
}
