import type { Metadata } from 'next'
import { LoginPage } from '@/components/pages/LoginPage'

export const metadata: Metadata = {
  title: 'Sign In',
  description: 'Sign in to your JadiBot enterprise workspace.',
}

export default function Login() {
  return <LoginPage />
}
