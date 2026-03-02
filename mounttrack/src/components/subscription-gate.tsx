'use client'
import { createPortalSession } from '@/actions/billing'
import { useActionState } from 'react'

export function SubscriptionGate() {
  const [state, action, pending] = useActionState(createPortalSession, undefined)

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="h-12 w-12 rounded-full bg-red-100 dark:bg-red-950 mx-auto flex items-center justify-center">
          <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <div>
          <h1 className="text-2xl font-bold mb-2">Subscription inactive</h1>
          <p className="text-muted-foreground">
            Your MountTrack subscription is no longer active. Renew to access your dashboard and job data.
          </p>
        </div>
        {state?.error && (
          <p className="text-sm text-red-500">{state.error}</p>
        )}
        <form action={action}>
          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-md bg-[var(--brand)] px-6 py-3 font-medium text-white hover:opacity-90 disabled:opacity-50"
          >
            {pending ? 'Opening billing portal...' : 'Renew subscription'}
          </button>
        </form>
        <p className="text-xs text-muted-foreground">
          All your shop data is preserved and will be accessible immediately upon renewal.
        </p>
      </div>
    </div>
  )
}
