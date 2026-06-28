import type { Metadata } from 'next'
import { LandingPage } from '@/components/pages/LandingPage'

export const metadata: Metadata = {
  title: 'JadiBot — Mission Control for WhatsApp Bots',
  description: 'Deploy, manage, and scale AI-powered WhatsApp bots without writing a single line of code.',
}

export default function Home() {
  return <LandingPage />
}
