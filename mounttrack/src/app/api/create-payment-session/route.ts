import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe/client'
import { createServiceClient } from '@/lib/supabase/service'
import type { Payment } from '@/types/database'

// Helper: sum all confirmed Stripe payments for a job
async function getTotalPaidCents(
  supabase: ReturnType<typeof createServiceClient>,
  jobId: string
): Promise<number> {
  const { data } = await (supabase.from('payments') as any)
    .select('amount_cents')
    .eq('job_id', jobId) as { data: Pick<Payment, 'amount_cents'>[] | null }
  return (data ?? []).reduce((s, p) => s + p.amount_cents, 0)
}

export async function POST(req: NextRequest) {
  let body: { portalToken?: string; amountCents?: number }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { portalToken, amountCents } = body

  if (!portalToken || typeof amountCents !== 'number') {
    return NextResponse.json({ error: 'Missing portalToken or amountCents' }, { status: 400 })
  }

  const supabase = createServiceClient()

  // Validate token and load job — service role bypasses RLS, no auth needed
  const { data: job } = await (supabase.from('jobs') as any)
    .select('id, shop_id, quoted_price, deposit_amount, customer_email, customer_name')
    .eq('portal_token', portalToken)
    .single() as {
      data: {
        id: string; shop_id: string; quoted_price: number
        deposit_amount: number | null; customer_email: string | null; customer_name: string
      } | null
    }

  if (!job) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  // Server-side amount validation — never trust client-supplied financial amounts
  const totalPaidCents = await getTotalPaidCents(supabase, job.id)
  const quotedCents = Math.round(job.quoted_price * 100)
  const depositCents = Math.round((job.deposit_amount ?? 0) * 100)
  const remainingCents = quotedCents - depositCents - totalPaidCents

  if (amountCents > remainingCents) {
    return NextResponse.json({ error: 'Amount exceeds remaining balance' }, { status: 400 })
  }
  // $50 minimum only applies to partial payments — allow any amount that clears the balance
  if (amountCents < 5000 && amountCents < remainingCents) {
    return NextResponse.json({ error: 'Minimum payment is $50.00' }, { status: 400 })
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: [{
      price_data: {
        currency: 'usd',
        product_data: { name: `Payment — ${job.customer_name}'s mount` },
        unit_amount: amountCents,
      },
      quantity: 1,
    }],
    customer_email: job.customer_email ?? undefined,
    success_url: `${process.env.NEXT_PUBLIC_URL}/portal/${portalToken}?payment=success`,
    cancel_url: `${process.env.NEXT_PUBLIC_URL}/portal/${portalToken}`,
    metadata: {
      job_id: job.id,
      shop_id: job.shop_id,
      portal_token: portalToken,
      amount_cents: String(amountCents),
    },
  })

  return NextResponse.json({ url: session.url })
}
