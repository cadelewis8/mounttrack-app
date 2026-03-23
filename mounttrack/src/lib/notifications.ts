import twilio from 'twilio'
import { Resend } from 'resend'
import { render } from '@react-email/components'
import { StageUpdateEmail } from '@/emails/StageUpdateEmail'
import { createServiceClient } from '@/lib/supabase/service'

// Lazy-initialized clients — created on first use so missing env vars don't
// crash the app at module load time (e.g. during local dev without API keys).
let _twilioClient: ReturnType<typeof twilio> | null = null
let _resend: Resend | null = null

function getTwilioClient() {
  if (!_twilioClient) {
    _twilioClient = twilio(
      process.env.TWILIO_ACCOUNT_SID!,
      process.env.TWILIO_AUTH_TOKEN!
    )
  }
  return _twilioClient
}

function getResend() {
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY!)
  }
  return _resend
}

// ---------------------------------------------------------------------------
// Payload types
// ---------------------------------------------------------------------------

interface StageNotificationPayload {
  customerPhone: string | null
  customerEmail: string | null
  smsOptedOut: boolean
  customerName: string
  stageName: string
  portalUrl: string
  shopName: string
  shopLogoUrl: string | null
  brandColor: string
  jobId: string
  shopId: string
}

interface PaymentRequestNotificationPayload {
  customerPhone: string | null
  customerEmail: string | null
  smsOptedOut: boolean
  customerName: string
  portalUrl: string
  shopName: string
  shopLogoUrl: string | null
  brandColor: string
  jobId: string
  shopId: string
}

interface WaitlistSmsPayload {
  customerPhone: string
  shopName: string
  animalType: string
  shopId: string
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

async function sendSms(to: string, body: string): Promise<boolean> {
  try {
    await getTwilioClient().messages.create({
      from: process.env.TWILIO_PHONE_NUMBER!,
      to,
      body,
    })
    return true
  } catch (err) {
    console.error('[notifications] SMS send failed:', err)
    return false
  }
}

async function sendEmail(opts: {
  to: string
  from: string
  subject: string
  html: string
}): Promise<boolean> {
  try {
    await getResend().emails.send(opts)
    return true
  } catch (err) {
    console.error('[notifications] Email send failed:', err)
    return false
  }
}

async function persistNotification(row: {
  shop_id: string
  job_id: string | null
  channel: 'sms' | 'email'
  type: 'stage_update' | 'payment_request' | 'waitlist_confirm'
  stage_name: string | null
}): Promise<void> {
  try {
    const supabase = createServiceClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('notifications') as any).insert(row)
  } catch (err) {
    console.error('[notifications] Failed to persist notification:', err)
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Send SMS + email notification when a job moves to a new stage.
 * Never throws — all errors are logged internally.
 */
export async function sendStageNotification(payload: StageNotificationPayload): Promise<void> {
  const {
    customerPhone,
    customerEmail,
    smsOptedOut,
    customerName,
    stageName,
    portalUrl,
    shopName,
    shopLogoUrl,
    brandColor,
    jobId,
    shopId,
  } = payload

  // SMS — skip if no phone or opted out
  if (customerPhone && !smsOptedOut) {
    const smsBody = `${shopName}: Great news! Your mount has moved to ${stageName}. Track progress: ${portalUrl}`
    const sent = await sendSms(customerPhone, smsBody)
    if (sent) {
      await persistNotification({
        shop_id: shopId,
        job_id: jobId,
        channel: 'sms',
        type: 'stage_update',
        stage_name: stageName,
      })
    }
  }

  // Email — skip if no email address
  if (customerEmail) {
    try {
      const html = await render(
        StageUpdateEmail({ shopName, shopLogoUrl, brandColor, customerName, stageName, portalUrl })
      )
      const sent = await sendEmail({
        to: customerEmail,
        from: `${shopName} <notifications@mounttrack.net>`,
        subject: `Your mount has moved to ${stageName}`,
        html,
      })
      if (sent) {
        await persistNotification({
          shop_id: shopId,
          job_id: jobId,
          channel: 'email',
          type: 'stage_update',
          stage_name: stageName,
        })
      }
    } catch (err) {
      console.error('[notifications] Stage email render failed:', err)
    }
  }
}

/**
 * Send SMS + email notification for a payment request.
 * Never throws — all errors are logged internally.
 */
export async function sendPaymentRequestNotification(payload: PaymentRequestNotificationPayload): Promise<void> {
  const {
    customerPhone,
    customerEmail,
    smsOptedOut,
    customerName,
    portalUrl,
    shopName,
    shopLogoUrl,
    brandColor,
    jobId,
    shopId,
  } = payload

  // SMS
  if (customerPhone && !smsOptedOut) {
    const smsBody = `${shopName}: Your mount is ready! Complete your payment here: ${portalUrl}`
    const sent = await sendSms(customerPhone, smsBody)
    if (sent) {
      await persistNotification({
        shop_id: shopId,
        job_id: jobId,
        channel: 'sms',
        type: 'payment_request',
        stage_name: null,
      })
    }
  }

  // Email
  if (customerEmail) {
    try {
      const html = await render(
        StageUpdateEmail({
          shopName,
          shopLogoUrl,
          brandColor,
          customerName,
          stageName: 'Ready for Pickup',
          portalUrl,
        })
      )
      const sent = await sendEmail({
        to: customerEmail,
        from: `${shopName} <notifications@mounttrack.net>`,
        subject: 'Your mount is ready — complete payment',
        html,
      })
      if (sent) {
        await persistNotification({
          shop_id: shopId,
          job_id: jobId,
          channel: 'email',
          type: 'payment_request',
          stage_name: null,
        })
      }
    } catch (err) {
      console.error('[notifications] Payment request email render failed:', err)
    }
  }
}

/**
 * Send waitlist confirmation SMS only (no email per product decisions).
 * Never throws — all errors are logged internally.
 */
export async function sendWaitlistSms(payload: WaitlistSmsPayload): Promise<void> {
  const { customerPhone, shopName, animalType, shopId } = payload

  const smsBody = `${shopName}: You're on our waitlist! We'll reach out when we're ready for your ${animalType}.`
  const sent = await sendSms(customerPhone, smsBody)
  if (sent) {
    await persistNotification({
      shop_id: shopId,
      job_id: null,
      channel: 'sms',
      type: 'waitlist_confirm',
      stage_name: null,
    })
  }
}
