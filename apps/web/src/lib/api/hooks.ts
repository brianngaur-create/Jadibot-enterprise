'use client'

import { useCallback, useEffect, useState } from 'react'

interface ResourceState<T> {
  data: T
  isLoading: boolean
  error: string | null
  refetch: () => void
}

/**
 * Minimal data-fetching hook. Keeps pages declarative without pulling in a heavy
 * data layer: it runs `fetcher` on mount (and when `deps` change), exposing
 * loading/error state and a `refetch` for mutations.
 */
export function useResource<T>(
  fetcher: () => Promise<T>,
  initial: T,
  deps: ReadonlyArray<unknown> = [],
): ResourceState<T> {
  const [data, setData] = useState<T>(initial)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [nonce, setNonce] = useState(0)

  const refetch = useCallback(() => setNonce((n) => n + 1), [])

  useEffect(() => {
    let active = true
    setIsLoading(true)
    setError(null)
    fetcher()
      .then((result) => {
        if (active) setData(result)
      })
      .catch((err: unknown) => {
        if (active) setError(err instanceof Error ? err.message : 'Failed to load data')
      })
      .finally(() => {
        if (active) setIsLoading(false)
      })
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nonce, ...deps])

  return { data, isLoading, error, refetch }
}
