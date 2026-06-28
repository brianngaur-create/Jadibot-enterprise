import type { Metadata } from 'next'
import { ProfilePage } from '@/components/pages/dashboard/ProfilePage'

export const metadata: Metadata = { title: 'Profile' }

export default function Profile() {
  return <ProfilePage />
}
