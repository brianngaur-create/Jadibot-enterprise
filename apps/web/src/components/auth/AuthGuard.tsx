'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth/store'

interface AuthGuardProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function AuthGuard({ children, fallback }: AuthGuardProps) {
  const { isAuthenticated, isInitialized, initialize, touchSession } = useAuth()
  const router = useRouter()
  const initialized = useRef(false)

  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true
      initialize()
    }
  }, [initialize])

  useEffect(() => {
    const handleActivity = () => touchSession()
    if (isAuthenticated) {
      window.addEventListener('click', handleActivity, { passive: true })
      window.addEventListener('keydown', handleActivity, { passive: true })
      return () => {
        window.removeEventListener('click', handleActivity)
        window.removeEventListener('keydown', handleActivity)
      }
    }
  }, [isAuthenticated, touchSession])

  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      const returnUrl = encodeURIComponent(window.location.pathname + window.location.search)
      router.replace(`/login?returnUrl=${returnUrl}`)
    }
  }, [isInitialized, isAuthenticated, router])

  if (!isInitialized) {
    return fallback ?? (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Verifying session&hellip;</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return fallback ?? (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Redirecting&hellip;</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
