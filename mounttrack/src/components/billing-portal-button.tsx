'use client'
import { createPortalSession } from '@/actions/billing'
import { useActionState } from 'react'

export function BillingPortalButton() {
  const [state, action, pending] = useActionState(createPortalSession, undefined)

  return (
    <div>
      {state?.error && (
        <p className="text-sm text-red-500 mb-3">{state.error}</p>
      )}
      <form action={action}>
        <button
          type="submit"
          disabled={pending}
          className="rounded-md border border-input px-4 py-2 text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50"
        >
          {pending ? 'Opening portal...' : 'Open billing portal'}
        </button>
      </form>
    </div>
  )
}
