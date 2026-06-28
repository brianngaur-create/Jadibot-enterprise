import type { Metadata } from 'next'
import { ForgotPasswordPage } from '@/components/pages/ForgotPasswordPage'

export const metadata: Metadata = {
  title: 'Reset Password',
  description: 'Reset your JadiBot account password.',
}

export default function ForgotPassword() {
  return <ForgotPasswordPage />
}
