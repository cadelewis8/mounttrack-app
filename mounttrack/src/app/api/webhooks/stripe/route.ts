import { stripe } from '@/lib/stripe/client'
import { createServiceClient } from '@/lib/supabase/service'
import type { SubscriptionStatus } from '@/types/database'
import { NextResponse } from 'next/server'

// Required: disable body parsing so raw body is available for signature verification
export const runtime = 'nodejs'

export async function POST(req: Request) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')

  if (!sig) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 })
  }

  let event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = createServiceClient()

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object
        const shopId = session.metadata?.shop_id
        if (!shopId) {
          console.warn('checkout.session.completed: no shop_id in metadata — skipping')
          break
        }
        // Fetch full subscription to get status
        const subscription = await stripe.subscriptions.retrieve(session.subscription as string)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase.from('shops') as any).update({
          stripe_customer_id: session.customer as string,
          stripe_subscription_id: subscription.id,
          subscription_status: subscription.status as SubscriptionStatus,
          onboarding_step: 2,  // Wizard complete
        }).eq('id', shopId)
        break
      }

      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object
        const shopId = subscription.metadata?.shop_id
        if (!shopId) {
          console.warn(`${event.type}: no shop_id in subscription metadata — skipping`)
          break
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase.from('shops') as any).update({
          subscription_status: subscription.status as SubscriptionStatus,
        }).eq('id', shopId)
        break
      }

      case 'invoice.paid':
      case 'invoice.payment_failed':
        // subscription.updated fires with the new status — no additional action needed
        break

      default:
        // Unhandled event type — no action
        break
    }
  } catch (err) {
    console.error('Webhook handler error:', err)
    return NextResponse.json({ error: 'Handler failed' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
