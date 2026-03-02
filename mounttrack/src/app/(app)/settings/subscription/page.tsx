import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SubscriptionGate } from '@/components/subscription-gate'
import { SettingsTabs } from '@/components/settings-tabs'
import { BillingPortalButton } from '@/components/billing-portal-button'
import type { Shop } from '@/types/database'

export default async function SettingsSubscriptionPage() {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  const userId = data?.claims?.sub ?? null
  if (!userId) redirect('/login')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: shop } = await (supabase.from('shops') as any)
    .select('subscription_status, stripe_customer_id')
    .eq('id', userId)
    .single() as { data: Pick<Shop, 'subscription_status' | 'stripe_customer_id'> | null }

  const isActive = shop?.subscription_status === 'active'

  if (!isActive) {
    return <SubscriptionGate />
  }

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>
      <SettingsTabs active="subscription" />

      <div className="mt-6 space-y-6">
        <div className="p-4 rounded-lg border bg-muted/30 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Subscription status</p>
            <p className="text-sm text-muted-foreground capitalize mt-0.5">
              {shop?.subscription_status ?? 'Unknown'}
            </p>
          </div>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
            Active
          </span>
        </div>

        <div>
          <p className="text-sm font-medium mb-2">Billing management</p>
          <p className="text-sm text-muted-foreground mb-4">
            Update your payment method, view invoices, or cancel your subscription via Stripe's secure billing portal.
          </p>
          <BillingPortalButton />
        </div>
      </div>
    </div>
  )
}
