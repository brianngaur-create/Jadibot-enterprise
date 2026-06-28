import type { Metadata } from 'next'
import { ApiKeysPage } from '@/components/pages/dashboard/ApiKeysPage'

export const metadata: Metadata = { title: 'API Keys' }

export default function ApiKeys() {
  return <ApiKeysPage />
}
