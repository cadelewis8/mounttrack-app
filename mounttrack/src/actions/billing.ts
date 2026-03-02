'use server'
import { stripe } from '@/lib/stripe/client'
import { createClient } from '@/lib/supabase/server'
import type { Shop } from '@/types/database'
import { redirect } from 'next/navigation'

type BillingState = { error: string } | undefined

export async function createSubscriptionCheckout(_prevState?: BillingState, _formData?: FormData): Promise<BillingState> {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  const userId = data?.claims?.sub ?? null
  if (!userId) redirect('/login')

  // Check if shop already has a customer ID (resuming after abandonment)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: shop } = await (supabase.from('shops') as any)
    .select('stripe_customer_id, email')
    .eq('id', userId)
    .single() as { data: Pick<Shop, 'stripe_customer_id' | 'email'> | null }

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: process.env.STRIPE_PRICE_ID!, quantity: 1 }],
    success_url: `${process.env.NEXT_PUBLIC_URL}/onboarding/complete?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_URL}/onboarding/step-2`,
    // Use existing customer if available; otherwise use email for pre-fill
    ...(shop?.stripe_customer_id
      ? { customer: shop.stripe_customer_id }
      : { customer_email: (data?.claims?.email as string | undefined) ?? undefined }
    ),
    metadata: { shop_id: userId },
    subscription_data: {
      metadata: { shop_id: userId },  // CRITICAL: required for subscription lifecycle webhooks
    },
  })

  redirect(session.url!)
}

export async function createPortalSession(): Promise<BillingState> {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  const userId = data?.claims?.sub ?? null
  if (!userId) redirect('/login')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: shop } = await (supabase.from('shops') as any)
    .select('stripe_customer_id')
    .eq('id', userId)
    .single() as { data: Pick<Shop, 'stripe_customer_id'> | null }

  if (!shop?.stripe_customer_id) {
    return { error: 'No subscription found' }
  }

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: shop.stripe_customer_id,
    return_url: `${process.env.NEXT_PUBLIC_URL}/settings/subscription`,
  })

  redirect(portalSession.url)
}
