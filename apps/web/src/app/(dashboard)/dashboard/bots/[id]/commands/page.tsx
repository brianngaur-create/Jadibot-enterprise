import type { Metadata } from 'next'
import { CommandManagerPage } from '@/components/pages/dashboard/CommandManagerPage'

export const metadata: Metadata = { title: 'Command Manager' }

export default function Commands() {
  return <CommandManagerPage />
}
