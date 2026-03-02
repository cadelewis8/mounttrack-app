'use client'
import { updatePassword } from '@/actions/auth'
import { useActionState } from 'react'

export default function UpdatePasswordPage() {
  const [state, action, pending] = useActionState(updatePassword, undefined)

  return (
    <div>
      <h2 className="text-xl font-semibold mb-6 text-center">Set new password</h2>
      <form action={action} className="space-y-4">
        {state?.error && (
          <p className="text-sm text-red-500 bg-red-50 dark:bg-red-950 p-3 rounded-md">
            {state.error}
          </p>
        )}
        <div className="space-y-1">
          <label htmlFor="password" className="text-sm font-medium">New password</label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]"
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="confirmPassword" className="text-sm font-medium">Confirm password</label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]"
          />
        </div>
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-md bg-[var(--brand)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
        >
          {pending ? 'Updating...' : 'Update password'}
        </button>
      </form>
    </div>
  )
}
