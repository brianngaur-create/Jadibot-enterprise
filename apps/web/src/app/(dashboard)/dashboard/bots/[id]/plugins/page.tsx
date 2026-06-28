import type { Metadata } from 'next'
import { PluginManagerPage } from '@/components/pages/dashboard/PluginManagerPage'

export const metadata: Metadata = { title: 'Plugin Manager' }

export default function Plugins() {
  return <PluginManagerPage />
}
