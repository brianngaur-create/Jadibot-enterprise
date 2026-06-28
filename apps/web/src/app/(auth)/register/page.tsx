import type { Metadata } from 'next'
import { RegisterPage } from '@/components/pages/RegisterPage'

export const metadata: Metadata = {
  title: 'Create Account',
  description: 'Create your JadiBot enterprise workspace.',
}

export default function Register() {
  return <RegisterPage />
}
