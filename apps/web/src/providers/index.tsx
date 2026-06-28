'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import { Toaster } from '@/components/ui/toaster'
import { useAuthStore } from '@/lib/auth/store'
import { initializeCsrf } from '@/lib/csrf'

function AuthInitializer() {
  const initialize = useAuthStore((s) => s.initialize)
  const initialized = useRef(false)

  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true
      initialize()
    }
    initializeCsrf()
  }, [initialize])

  return null
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            retry: (failureCount, error) => {
              if (
                error instanceof Error &&
                (error.message.includes('401') || error.message.includes('403'))
              ) {
                return false
              }
              return failureCount < 1
            },
            refetchOnWindowFocus: false,
          },
          mutations: {
            retry: 0,
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      <AuthInitializer />
      {children}
      <Toaster />
    </QueryClientProvider>
  )
}
