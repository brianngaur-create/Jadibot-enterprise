import type { Metadata } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import { Providers } from '@/providers'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'JadiBot — Mission Control for WhatsApp Bots',
    template: '%s | JadiBot',
  },
  description:
    'Deploy, manage, and scale AI-powered WhatsApp bots without writing a single line of code. Built for developers, designed for serious operators.',
  keywords: ['WhatsApp bot', 'SaaS', 'automation', 'chatbot', 'AI', 'enterprise'],
  authors: [{ name: 'JadiBot Enterprise' }],
  creator: 'JadiBot Enterprise',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://jadibot.com',
    title: 'JadiBot — Mission Control for WhatsApp Bots',
    description:
      'Deploy, manage, and scale AI-powered WhatsApp bots without writing a single line of code.',
    siteName: 'JadiBot',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'JadiBot — Mission Control for WhatsApp Bots',
    description:
      'Deploy, manage, and scale AI-powered WhatsApp bots without writing a single line of code.',
    creator: '@jadibot',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable} dark`} suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
