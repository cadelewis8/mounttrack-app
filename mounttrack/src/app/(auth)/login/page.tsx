'use client'
import { signIn } from '@/actions/auth'
import { useActionState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function LoginForm() {
  const [state, action, pending] = useActionState(signIn, undefined)
  const searchParams = useSearchParams()
  const message = searchParams.get('message')

  return (
    <div>
      <h2 className="text-xl font-semibold mb-6 text-center">Sign in</h2>
      {message && (
        <p className="text-sm text-green-600 bg-green-50 dark:bg-green-950 p-3 rounded-md mb-4">
          {message}
        </p>
      )}
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
          <div className="flex justify-between items-center">
            <label htmlFor="password" className="text-sm font-medium">Password</label>
            <Link href="/forgot-password" className="text-xs text-[var(--brand)] hover:underline">
              Forgot password?
            </Link>
          </div>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]"
          />
        </div>
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-md bg-[var(--brand)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
        >
          {pending ? 'Signing in...' : 'Sign in'}
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-muted-foreground">
        No account?{' '}
        <Link href="/signup" className="text-[var(--brand)] hover:underline">Create one</Link>
      </p>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
