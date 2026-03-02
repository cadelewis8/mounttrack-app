'use client'
import { createSubscriptionCheckout } from '@/actions/billing'
import { StepIndicator } from '@/components/step-indicator'
import { useActionState } from 'react'

export default function OnboardingStep2Page() {
  const [state, action, pending] = useActionState(createSubscriptionCheckout, undefined)

  return (
    <div>
      <StepIndicator current={2} total={2} />
      <h1 className="text-2xl font-bold mb-1">Subscribe to MountTrack</h1>
      <p className="text-muted-foreground mb-8">
        A flat monthly fee gives you full access. Cancel anytime from your billing settings.
      </p>

      {state?.error && (
        <p className="text-sm text-red-500 bg-red-50 dark:bg-red-950 p-3 rounded-md mb-6">
          {state.error}
        </p>
      )}

      <div className="border rounded-lg p-6 mb-6 bg-muted/30">
        <p className="text-sm font-medium text-muted-foreground mb-1">What you get</p>
        <ul className="text-sm space-y-2">
          <li>Unlimited jobs and customers</li>
          <li>Customer portal with real-time status</li>
          <li>Automated notifications (Phase 6)</li>
          <li>Payment collection (Phase 5)</li>
        </ul>
      </div>

      <form action={action}>
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-md bg-[var(--brand)] px-4 py-2.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
        >
          {pending ? 'Redirecting to payment...' : 'Subscribe and pay'}
        </button>
      </form>
      <p className="mt-3 text-xs text-center text-muted-foreground">
        Powered by Stripe. MountTrack does not store your card details.
      </p>
    </div>
  )
}
