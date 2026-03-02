import Link from 'next/link'

export default function CheckEmailPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-sm w-full px-4 text-center space-y-4">
        <h1 className="text-2xl font-bold">MountTrack</h1>
        <h2 className="text-xl font-semibold">Check your email</h2>
        <p className="text-sm text-muted-foreground">
          We sent a confirmation link to your email address. Click it to activate your account.
        </p>
        <Link href="/login" className="text-sm text-[var(--brand)] hover:underline">
          Back to sign in
        </Link>
      </div>
    </div>
  )
}
