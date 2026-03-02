'use client'
import { signUp } from '@/actions/auth'
import { useActionState } from 'react'
import Link from 'next/link'

export default function SignupPage() {
  const [state, action, pending] = useActionState(signUp, undefined)

  return (
    <div>
      <h2 className="text-xl font-semibold mb-6 text-center">Create your account</h2>
      <form action={action} className="space-y-4">
        {state?.error && (
          <p className="text-sm text-red-500 bg-red-50 dark:bg-red-950 p-3 rounded-md">
            {state.error}
          </p>
        )}
        <div className="space-y-1">
          <label htmlFor="email" className="text-sm font-medium">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]"
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="password" className="text-sm font-medium">Password</label>
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
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-md bg-[var(--brand)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
        >
          {pending ? 'Creating account...' : 'Create account'}
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link href="/login" className="text-[var(--brand)] hover:underline">Sign in</Link>
      </p>
    </div>
  )
}
