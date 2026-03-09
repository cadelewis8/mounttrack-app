'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Silently refreshes the portal RSC every 30 seconds so the estimated
 * completion date and stage stay current without a manual page reload.
 * Uses router.refresh() which re-runs the Server Component fetch
 * without a full navigation.
 */
export function PortalAutoRefresh({ intervalMs = 30_000 }: { intervalMs?: number }) {
  const router = useRouter()

  useEffect(() => {
    const id = setInterval(() => router.refresh(), intervalMs)
    return () => clearInterval(id)
  }, [router, intervalMs])

  return null
}
