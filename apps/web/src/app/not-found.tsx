import Link from 'next/link'
import { Bot } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0c1321] text-foreground">
      <div className="text-center">
        <div className="w-16 h-16 rounded-xl bg-[#1a2540] border border-[#2a3a5a] flex items-center justify-center mx-auto mb-6">
          <Bot className="w-9 h-9 text-[#adc6ff]" />
        </div>
        <h1 className="text-6xl font-bold text-white mb-4">404</h1>
        <p className="text-lg text-muted-foreground mb-8">Page not found.</p>
        <Link
          href="/"
          className="bg-primary text-primary-foreground px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity"
        >
          Back to Home
        </Link>
      </div>
    </div>
  )
}
