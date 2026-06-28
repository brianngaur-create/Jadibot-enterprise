export const APP_NAME = 'JadiBot'
export const APP_DESCRIPTION = 'Mission Control for WhatsApp Bots'
export const APP_URL = 'https://jadibot.com'

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? '/api'
export const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL ?? 'http://localhost:3001'

export const PLANS = [
  {
    name: 'Starter',
    price: 'Free',
    bots: '1 bot',
    msgs: '5,000 msg/mo',
    features: ['Basic dashboard', 'QR linking', 'Community support'],
  },
  {
    name: 'Pro',
    price: '$29',
    bots: '10 bots',
    msgs: '100,000 msg/mo',
    features: ['Analytics', 'API access', 'Priority support'],
    highlight: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    bots: 'Unlimited',
    msgs: 'Unlimited',
    features: ['Custom plugins', 'SLA', 'Dedicated infra'],
  },
] as const
