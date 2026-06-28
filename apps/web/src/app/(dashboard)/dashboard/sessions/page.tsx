import type { Metadata } from 'next'
import { SessionManagerPage } from '@/components/pages/dashboard/SessionManagerPage'

export const metadata: Metadata = { title: 'Session Manager' }

export default function Sessions() {
  return <SessionManagerPage />
}
