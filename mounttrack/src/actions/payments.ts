'use server'
import { createClient } from '@/lib/supabase/server'

/**
 * PAY-04: Owner-triggered payment request.
 * Builds the portal payment URL and logs it to console.
 * TODO Phase 6: Replace console.log with Twilio SMS + Resend email delivery.
 */
export async function sendPaymentRequest(jobId: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  const userId = data?.claims?.sub ?? null
  if (!userId) return { error: 'Not authenticated' }

  // Fetch job to verify ownership and get portal token
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: job, error } = await (supabase.from('jobs') as any)
    .select('id, shop_id, portal_token, customer_name')
    .eq('id', jobId)
    .eq('shop_id', userId)  // RLS + explicit shop_id check — owner can only request for their own jobs
    .single() as { data: { id: string; shop_id: string; portal_token: string; customer_name: string } | null; error: { message: string } | null }

  if (error || !job) return { error: 'Job not found' }

  const portalUrl = `${process.env.NEXT_PUBLIC_URL}/portal/${job.portal_token}`

  // TODO Phase 6: send SMS via Twilio + email via Resend using portalUrl as payment link
  console.log(`[PAY-04] Manual payment request for job ${jobId} (${job.customer_name}) — payment link: ${portalUrl}`)

  return {}
}
