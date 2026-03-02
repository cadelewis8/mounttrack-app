import { createPortalSession } from '@/actions/billing'
import type { NextRequest } from 'next/server'

export async function GET(_request: NextRequest) {
  // Delegates to Server Action which handles auth + redirect
  return await createPortalSession()
}
