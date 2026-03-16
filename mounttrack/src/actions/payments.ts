'use server'
import { createClient } from '@/lib/supabase/server'
import { sendPaymentRequestNotification } from '@/lib/notifications'

/**
 * PAY-04: Owner-triggered payment request.
 * Builds the portal payment URL and sends SMS + email to the customer.
 */
export async function sendPaymentRequest(jobId: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  const userId = data?.claims?.sub ?? null
  if (!userId) return { error: 'Not authenticated' }

  // Fetch job to verify ownership and get all notification fields
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: job, error } = await (supabase.from('jobs') as any)
    .select('id, shop_id, portal_token, customer_name, customer_phone, customer_email, sms_opted_out')
    .eq('id', jobId)
    .eq('shop_id', userId)  // RLS + explicit shop_id check — owner can only request for their own jobs
    .single() as { data: { id: string; shop_id: string; portal_token: string; customer_name: string; customer_phone: string | null; customer_email: string | null; sms_opted_out: boolean } | null; error: { message: string } | null }

  if (error || !job) return { error: 'Job not found' }

  // Fetch shop branding for notification
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: shop } = await (supabase.from('shops') as any)
    .select('shop_name, logo_url, brand_color')
    .eq('id', userId)
    .single() as { data: { shop_name: string; logo_url: string | null; brand_color: string } | null }

  const portalUrl = `${process.env.NEXT_PUBLIC_URL}/portal/${job.portal_token}`

  try {
    await sendPaymentRequestNotification({
      customerPhone: job.customer_phone,
      customerEmail: job.customer_email,
      smsOptedOut: job.sms_opted_out,
      customerName: job.customer_name,
      portalUrl,
      shopName: shop?.shop_name ?? '',
      shopLogoUrl: shop?.logo_url ?? null,
      brandColor: shop?.brand_color ?? '#000000',
      jobId: job.id,
      shopId: userId,
    })
  } catch (err) {
    console.error('[sendPaymentRequest] notification error:', err)
  }

  return {}
}
