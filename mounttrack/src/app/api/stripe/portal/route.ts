import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe/client'
import type { Shop } from '@/types/database'

export async function GET() {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  const userId = data?.claims?.sub ?? null

  if (!userId) {
    return NextResponse.redirect(new URL('/login', process.env.NEXT_PUBLIC_URL!))
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: shop } = await (supabase.from('shops') as any)
    .select('stripe_customer_id')
    .eq('id', userId)
    .single() as { data: Pick<Shop, 'stripe_customer_id'> | null }

  if (!shop?.stripe_customer_id) {
    return NextResponse.json({ error: 'No subscription found' }, { status: 400 })
  }

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: shop.stripe_customer_id,
    return_url: `${process.env.NEXT_PUBLIC_URL}/settings/subscription`,
  })

  return NextResponse.redirect(portalSession.url)
}
