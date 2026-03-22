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

        if (session.subscription) {
          // ── Existing subscription flow (unchanged) ──
          const shopId = session.metadata?.shop_id
          if (!shopId) {
            console.warn('checkout.session.completed: no shop_id in metadata — skipping')
            break
          }
          const subscription = await stripe.subscriptions.retrieve(session.subscription as string)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (supabase.from('shops') as any).update({
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: subscription.id,
            subscription_status: subscription.status as SubscriptionStatus,
            onboarding_step: 2,
          }).eq('id', shopId)
          break
        }

        // ── Job payment flow ──
        const jobId = session.metadata?.job_id
        if (!jobId) {
          console.warn('checkout.session.completed: no job_id in metadata — skipping')
          break
        }

        // Verify payment actually completed (guard for async edge cases)
        if (session.payment_status !== 'paid') {
          console.warn(`checkout.session.completed: payment_status is ${session.payment_status} — skipping`)
          break
        }

        // Idempotency check — stripe_session_id UNIQUE prevents duplicates at DB level,
        // but check first to avoid unnecessary insert attempts on webhook retries
        const { data: existing } = await (supabase.from('payments') as any)
          .select('id')
          .eq('stripe_session_id', session.id)
          .maybeSingle() as { data: { id: string } | null }

        if (existing) break  // already processed

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error: insertError } = await (supabase.from('payments') as any).insert({
          job_id: jobId,
          shop_id: session.metadata?.shop_id,
          stripe_session_id: session.id,
          stripe_payment_intent_id: session.payment_intent as string | null,
          amount_cents: session.amount_total ?? 0,
        })
        if (insertError) {
          console.error('payments insert failed:', insertError)
          throw insertError
        }
        console.log('payment recorded:', session.id, 'amount:', session.amount_total)
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
