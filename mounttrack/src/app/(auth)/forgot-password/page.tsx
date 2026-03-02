'use client'
import { forgotPassword } from '@/actions/auth'
import { useActionState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Suspense } from 'react'

function ForgotPasswordForm() {
  const [, action, pending] = useActionState(forgotPassword, undefined)
  const searchParams = useSearchParams()
  const sent = searchParams.get('sent')

  if (sent) {
    return (
      <div className="text-center space-y-4">
        <h2 className="text-xl font-semibold">Check your email</h2>
        <p className="text-sm text-muted-foreground">
          If an account exists for that email, we sent a password reset link.
        </p>
        <Link href="/login" className="text-sm text-[var(--brand)] hover:underline">
          Back to sign in
        </Link>
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-2 text-center">Reset password</h2>
      <p className="text-sm text-muted-foreground text-center mb-6">
        Enter your email and we&apos;ll send a reset link.
      </p>
      <form action={action} className="space-y-4">
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
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-md bg-[var(--brand)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
        >
          {pending ? 'Sending...' : 'Send reset link'}
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-muted-foreground">
        <Link href="/login" className="text-[var(--brand)] hover:underline">Back to sign in</Link>
      </p>
    </div>
  )
}

export default function ForgotPasswordPage() {
  return (
    <Suspense>
      <ForgotPasswordForm />
    </Suspense>
  )
}
