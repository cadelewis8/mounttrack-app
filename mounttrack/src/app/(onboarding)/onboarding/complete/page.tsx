'use client'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function OnboardingCompletePage() {
  const router = useRouter()
  const [attempts, setAttempts] = useState(0)
  const maxAttempts = 10  // 10 * 500ms = 5 seconds max wait

  useEffect(() => {
    // Poll the shop record until subscription_status = 'active'
    // This handles the race condition where the redirect arrives before the webhook
    async function checkSubscription() {
      const supabase = createClient()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: shop } = await (supabase.from('shops') as any)
        .select('subscription_status, onboarding_step')
        .single() as { data: { subscription_status: string | null; onboarding_step: number } | null }

      if (shop?.subscription_status === 'active' && shop.onboarding_step === 2) {
        router.push('/dashboard')
        return
      }

      if (attempts < maxAttempts) {
        setAttempts(prev => prev + 1)
        setTimeout(checkSubscription, 500)
      } else {
        // Fallback: proceed anyway — proxy.ts will re-check
        router.push('/dashboard')
      }
    }

    checkSubscription()
  }, [])  // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4 max-w-sm px-4">
        <div className="h-12 w-12 rounded-full bg-[var(--brand)] mx-auto flex items-center justify-center">
          <svg className="h-6 w-6 text-white animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
        <h1 className="text-xl font-bold">Setting up your account...</h1>
        <p className="text-sm text-muted-foreground">
          Confirming your subscription. This takes just a moment.
        </p>
      </div>
    </div>
  )
}
