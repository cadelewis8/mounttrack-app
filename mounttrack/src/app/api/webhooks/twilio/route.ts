import { createServiceClient } from '@/lib/supabase/service'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  const formData = await req.formData()
  const from = formData.get('From') as string | null       // customer phone E.164
  const optOutType = formData.get('OptOutType') as string | null  // 'STOP' | 'START' | 'HELP' | null

  // Only act on STOP opt-outs
  if (optOutType !== 'STOP' || !from) {
    return NextResponse.json({ received: true })
  }

  try {
    const supabase = createServiceClient()
    // Set sms_opted_out on all jobs for this customer phone number.
    // V1: one Twilio account = one shop; no cross-shop risk.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('jobs') as any)
      .update({ sms_opted_out: true })
      .eq('customer_phone', from)
  } catch (err) {
    console.error('[twilio-webhook] failed to set sms_opted_out:', err)
    // Return 200 regardless — Twilio retries on non-2xx; logging is sufficient
  }

  return NextResponse.json({ received: true })
}
