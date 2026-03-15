# Phase 6: Notifications & Waitlist - Research

**Researched:** 2026-03-14
**Domain:** Twilio SMS, Resend transactional email, React Email templates, Supabase schema additions, A2P 10DLC compliance
**Confidence:** HIGH (core stack verified via official docs), MEDIUM (A2P 10DLC operational detail), HIGH (existing codebase patterns)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Message content & tone**
- SMS includes: shop name prefix + stage name + portal link
  - Format: "Buck's Taxidermy: Your mount has moved to [Stage Name]! Track your progress here: [portal link]"
- Shop name prefixed on every SMS (not just first message) — customer always knows who it's from
- Email includes: shop logo + brand color header + stage update message + portal CTA button
- Tone: warm and friendly — e.g. "Great news! Your mount has moved to Tanning."
- Email is HTML-templated (not plain text)

**Notification trigger rules**
- Every stage change fires — no exclusions (owner controls which stages exist)
- Bulk moves trigger individual notifications per job (each customer gets their own)
- If customer phone is missing → skip SMS silently (no error to owner)
- If customer email is missing → skip email silently (no error to owner)
- Each sent notification is persisted to a `notifications` table in Supabase (type, channel, stage, job_id, timestamp) — feeds JOB-05 communication history, but the UI for that history is a future phase

**SMS opt-out & compliance**
- `sms_opted_out` boolean flag on the `jobs` table (per-job scoped — not global per customer)
- Opt-out triggered via Twilio inbound webhook at `/api/webhooks/twilio` — Twilio POSTs when STOP received, we match phone to job and set flag
- Opt-out is SMS-only — email notifications continue when customer opts out
- Owner sees a badge/indicator on the job detail page when a customer has opted out of SMS

**Waitlist UI & flow**
- Dedicated `/waitlist` page with a nav link
- Add entry form: name + phone + animal type (3 fields only — matches WAIT-01)
- Entries displayed as a simple list ordered by date added (name, animal type, phone, date)
- Actions: delete only — owner removes entry manually when they convert it via normal job intake form
- On creation: customer immediately receives branded SMS confirmation ("You're on the waitlist at Buck's Taxidermy! We'll be in touch when we're ready for your [animal type].")

### Claude's Discretion
- Email HTML template design (layout, spacing, typography — use shop brand_color and logo_url)
- Supabase `notifications` table schema design
- Error handling for Twilio/Resend API failures (log and continue, don't block stage move)
- Twilio phone number provisioning instructions (out of scope — document in README/setup)

### Deferred Ideas (OUT OF SCOPE)
- None — discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| NOTIF-01 | Every stage change automatically sends the customer a branded SMS via Twilio | Twilio `messages.create()` called from `updateJobStage` and `bulkMoveJobs` after successful DB update; existing TODO stub in place |
| NOTIF-02 | Every stage change automatically sends the customer a branded email via Resend | Resend `resend.emails.send()` with React Email template called alongside NOTIF-01; same hook points |
| NOTIF-03 | All SMS and email notifications display shop name/logo — no MountTrack branding | Shop record has `shop_name`, `logo_url`, `brand_color` — passed to Twilio body and React Email template props |
| NOTIF-04 | Customers can opt out of SMS via STOP keyword; handled A2P 10DLC compliant | Twilio handles blocking automatically (error 21610 on future sends); our `/api/webhooks/twilio` records `sms_opted_out=true` on job via `OptOutType` field |
| WAIT-01 | Owner can add customer to pre-intake waitlist with name, phone, animal type | New `waitlist` Supabase table + `/waitlist` page with 3-field form + server action |
| WAIT-02 | Waitlisted customer automatically receives branded SMS confirming they are on the list | Same Twilio `messages.create()` called from `createWaitlistEntry` server action |
</phase_requirements>

---

## Summary

Phase 6 integrates two external communication APIs — Twilio for SMS and Resend for email — into the existing Next.js server-action architecture. The phase expands two existing server action functions (`updateJobStage`, `bulkMoveJobs`) by replacing their Phase 6 TODO stubs with real notification dispatch, and replaces the stub in `sendPaymentRequest` as well. The notification system follows the fire-and-forget pattern (log failures, do not block the stage move) to keep UX smooth.

The A2P 10DLC compliance story for STOP is cleaner than it first appears: Twilio automatically adds opted-out numbers to a blocklist (future sends return error 21610) AND fires an inbound webhook with `OptOutType=STOP`. The project's job is to receive that webhook and flip `sms_opted_out=true` on the matching job record — so the owner badge indicator is accurate even though Twilio would block the send anyway.

The waitlist is a self-contained feature: a new `waitlist` Supabase table, a `/waitlist` page, a simple 3-field form with server action, and a single Twilio SMS on creation. No email is sent for waitlist entries per the decisions (phone only). The nav link addition to `nav-links.tsx` is the only change to shared layout.

**Primary recommendation:** Implement notification dispatch in a dedicated `src/lib/notifications.ts` helper module called from server actions — keeps the actions thin and makes the notification logic independently testable. Use `@react-email/components` for the HTML email template, `resend` for sending, and `twilio` for SMS.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `twilio` | 5.13.0 (latest) | Twilio Node.js SDK — SMS dispatch | Official Twilio SDK; TypeScript included; `messages.create()` is the standard API |
| `resend` | 6.9.3 (latest) | Resend email API client | Built-in Next.js compatibility; `{ data, error }` pattern matches existing codebase style |
| `@react-email/components` | 1.0.8 (latest) | Pre-built email UI components | Official React Email component library; tested across Gmail, Outlook, Apple Mail |
| `react-email` | latest | React Email dev tools + render | Required peer for `@react-email/components` v5 compatibility |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| (none new) | — | Supabase, Next.js, Zod already installed | All DB/validation infrastructure already present |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `@react-email/components` | Plain HTML string | React Email gives cross-client tested components; hand-written HTML tables are fragile across email clients |
| `resend` (react prop) | `resend` (html prop + render()) | `react` prop is cleaner — Resend handles rendering internally; avoids manual `render()` call |

**Installation:**
```bash
npm install twilio resend @react-email/components react-email
```

Note: `react-email` and `@react-email/components` must be updated together (React Email 5.0 requirement). Install both at latest.

---

## Architecture Patterns

### Recommended Project Structure
```
mounttrack/src/
├── lib/
│   └── notifications.ts        # Shared notification dispatch helper
├── emails/
│   └── StageUpdateEmail.tsx    # React Email template component
├── actions/
│   ├── jobs.ts                 # updateJobStage + bulkMoveJobs get notification calls
│   ├── payments.ts             # sendPaymentRequest TODO stub replaced
│   └── waitlist.ts             # New: createWaitlistEntry, deleteWaitlistEntry
└── app/
    ├── (app)/
    │   └── waitlist/
    │       └── page.tsx        # New: waitlist management page
    └── api/
        └── webhooks/
            └── twilio/
                └── route.ts   # New: inbound SMS webhook (STOP handling)
```

### Pattern 1: Notification Dispatch Helper (`src/lib/notifications.ts`)

**What:** A module that exports `sendStageNotification()` and `sendWaitlistSms()`. Accepts pre-fetched job + shop data, calls Twilio and Resend, logs failures silently. Server actions call this after successful DB operations.

**When to use:** Any point where a notification must be sent. Centralizes all Twilio/Resend logic away from business logic.

```typescript
// Source: Twilio official docs + Resend official docs pattern
import twilio from 'twilio'
import { Resend } from 'resend'
import { StageUpdateEmail } from '@/emails/StageUpdateEmail'

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!
)
const resend = new Resend(process.env.RESEND_API_KEY!)

interface NotificationPayload {
  customerPhone: string | null
  customerEmail: string | null
  customerName: string
  stageName: string
  portalUrl: string
  shopName: string
  shopLogoUrl: string | null
  brandColor: string
  jobId: string
  shopId: string
}

export async function sendStageNotification(payload: NotificationPayload) {
  const { customerPhone, customerEmail, smsOptedOut, ... } = payload

  // SMS: skip silently if no phone or opted out
  if (customerPhone && !payload.smsOptedOut) {
    try {
      await twilioClient.messages.create({
        body: `${payload.shopName}: Great news! Your mount has moved to ${payload.stageName}. Track progress: ${payload.portalUrl}`,
        from: process.env.TWILIO_PHONE_NUMBER!,
        to: customerPhone,
      })
      // persist to notifications table
    } catch (err) {
      console.error('[notifications] SMS send failed:', err)
      // do not rethrow — stage move already committed
    }
  }

  // Email: skip silently if no email
  if (customerEmail) {
    try {
      await resend.emails.send({
        from: `${payload.shopName} <notifications@yourdomain.com>`,
        to: customerEmail,
        subject: `Your mount has moved to ${payload.stageName}`,
        react: StageUpdateEmail({ ...payload }),
      })
      // persist to notifications table
    } catch (err) {
      console.error('[notifications] Email send failed:', err)
    }
  }
}
```

### Pattern 2: Twilio Inbound Webhook (`/api/webhooks/twilio/route.ts`)

**What:** Receives Twilio POST when a customer replies STOP. Parses `application/x-www-form-urlencoded` body, extracts `From` (customer phone) and `OptOutType` field. If `OptOutType === 'STOP'`, finds matching job by `customer_phone` and sets `sms_opted_out = true`.

**When to use:** Every time a Twilio inbound message fires to this endpoint.

**Key facts verified:**
- Twilio POSTs `application/x-www-form-urlencoded` (NOT JSON)
- `OptOutType` field is included in webhook payload when STOP/START/HELP received
- Must parse with `request.formData()` in Next.js App Router (no body parser)
- Twilio automatically blocks the number on their side (error 21610); webhook is for our DB record
- The `api/webhooks/` path is already excluded from auth middleware by the proxy.ts matcher pattern: `/((?!_next/static|_next/image|favicon.ico|api/webhooks/|...)`

```typescript
// Source: Twilio messaging-webhooks official docs
import { createServiceClient } from '@/lib/supabase/service'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  const formData = await req.formData()
  const from = formData.get('From') as string    // E.164 format: +14155551234
  const optOutType = formData.get('OptOutType') as string | null

  // Only act on STOP keywords
  if (optOutType !== 'STOP' || !from) {
    return NextResponse.json({ received: true })
  }

  const supabase = createServiceClient()

  // Match by customer_phone — may affect multiple jobs from same customer
  // per-job sms_opted_out flag as decided
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase.from('jobs') as any)
    .update({ sms_opted_out: true })
    .eq('customer_phone', from)

  return NextResponse.json({ received: true })
}
```

### Pattern 3: React Email Template (`src/emails/StageUpdateEmail.tsx`)

**What:** A React component using `@react-email/components` that produces a cross-client HTML email with shop logo, brand color header, stage message, and portal CTA button.

```typescript
// Source: react.email official components, @react-email/components 1.0.8
import {
  Html, Head, Body, Container, Section, Img, Text, Button, Hr
} from '@react-email/components'

interface StageUpdateEmailProps {
  shopName: string
  shopLogoUrl: string | null
  brandColor: string
  customerName: string
  stageName: string
  portalUrl: string
}

export function StageUpdateEmail({
  shopName, shopLogoUrl, brandColor, customerName, stageName, portalUrl
}: StageUpdateEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={{ fontFamily: 'sans-serif', backgroundColor: '#f9f9f9' }}>
        <Container style={{ maxWidth: '560px', margin: '0 auto' }}>
          <Section style={{ backgroundColor: brandColor, padding: '24px', textAlign: 'center' }}>
            {shopLogoUrl && (
              <Img src={shopLogoUrl} alt={shopName} height="60" style={{ margin: '0 auto' }} />
            )}
          </Section>
          <Section style={{ backgroundColor: '#ffffff', padding: '32px' }}>
            <Text style={{ fontSize: '20px', fontWeight: 'bold' }}>
              Great news, {customerName}!
            </Text>
            <Text>
              Your mount has moved to <strong>{stageName}</strong>.
            </Text>
            <Button
              href={portalUrl}
              style={{
                backgroundColor: brandColor,
                color: '#ffffff',
                padding: '12px 24px',
                borderRadius: '6px',
                textDecoration: 'none',
                display: 'inline-block',
              }}
            >
              Track Your Progress
            </Button>
          </Section>
          <Hr />
          <Text style={{ fontSize: '12px', color: '#888', textAlign: 'center' }}>
            {shopName}
          </Text>
        </Container>
      </Body>
    </Html>
  )
}
```

### Pattern 4: Integration into Existing Server Actions

**What:** `updateJobStage` needs to fetch additional job and shop data after the stage update, then call `sendStageNotification()`. This is additive — no existing logic changes.

```typescript
// Extension of existing updateJobStage in src/actions/jobs.ts
// After successful stage update:
const [stageRes, jobRes, shopRes] = await Promise.all([
  (supabase.from('stages') as any).select('name').eq('id', stageId).single(),
  (supabase.from('jobs') as any)
    .select('customer_name, customer_phone, customer_email, portal_token, sms_opted_out')
    .eq('id', jobId).single(),
  (supabase.from('shops') as any)
    .select('shop_name, logo_url, brand_color')
    .eq('id', userId).single(),
])

const portalUrl = `${process.env.NEXT_PUBLIC_URL}/portal/${jobRes.data?.portal_token}`

await sendStageNotification({
  customerPhone: jobRes.data?.customer_phone ?? null,
  customerEmail: jobRes.data?.customer_email ?? null,
  smsOptedOut: jobRes.data?.sms_opted_out ?? false,
  customerName: jobRes.data?.customer_name ?? '',
  stageName: stageRes.data?.name ?? '',
  portalUrl,
  shopName: shopRes.data?.shop_name ?? '',
  shopLogoUrl: shopRes.data?.logo_url ?? null,
  brandColor: shopRes.data?.brand_color ?? '#000000',
  jobId,
  shopId: userId,
})
```

**For `bulkMoveJobs`:** Loop over each jobId, fetch job data individually, call `sendStageNotification` per job. Use `Promise.allSettled()` so one failure doesn't block others.

### Anti-Patterns to Avoid

- **Blocking stage move on notification failure:** Never `await` notification dispatch in a way that throws to the caller — catch all errors and continue.
- **Sending SMS without checking `sms_opted_out`:** Always check the flag before calling Twilio. Even though Twilio blocks at their layer (error 21610), our flag check prevents unnecessary API calls and avoids logging spurious errors.
- **Building HTML email strings by hand:** Use `@react-email/components` — cross-client email HTML is notoriously broken when hand-written.
- **Putting Twilio/Resend client init inside the function call:** Initialize clients at module level (singleton pattern) to avoid re-creating on each invocation.
- **Forgetting `createServiceClient()` in the Twilio webhook:** The webhook route has no authenticated session. Use service client (not `createClient()`) for the DB write.
- **Parsing Twilio webhook body as JSON:** Twilio sends `application/x-www-form-urlencoded`. Use `req.formData()` in App Router.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Cross-client HTML emails | Custom HTML tables with inline styles | `@react-email/components` | Email client rendering varies wildly; React Email components are tested across Gmail, Outlook, Apple Mail, Yahoo |
| SMS delivery | Custom HTTP calls to Twilio REST API | `twilio` npm SDK | Handles auth, retries, TypeScript types; error 21610 detection built in |
| Email delivery | Custom SMTP or other provider | `resend` | Next.js native, `{ data, error }` pattern, React component support built in |
| Opt-out blocklist | Custom blocklist table + send-time lookup | Twilio's automatic blocklist | Twilio blocks at their layer automatically when STOP is received; error 21610 is their enforcement |

**Key insight:** Twilio handles the opt-out _enforcement_ automatically — we only need to record the opt-out in our DB for the owner badge indicator. We don't need to check our DB flag to prevent duplicate sends; Twilio's error 21610 is the authoritative block.

---

## Common Pitfalls

### Pitfall 1: Twilio Webhook Body Format
**What goes wrong:** Next.js App Router does not auto-parse `application/x-www-form-urlencoded`. If you call `req.json()` on a Twilio webhook, you get a parse error.
**Why it happens:** Twilio sends form-encoded, not JSON.
**How to avoid:** Use `const formData = await req.formData()` then `formData.get('From')`, `formData.get('Body')`, `formData.get('OptOutType')`.
**Warning signs:** Empty body object or JSON parse error in webhook logs.

### Pitfall 2: `sms_opted_out` Flag Scope
**What goes wrong:** Storing opt-out globally per phone number. If a customer has two jobs at the same shop and opts out, both are affected — which is correct. But if they opt out at one shop it shouldn't affect another shop.
**Why it happens:** The flag is on `jobs` table (per-job, shop-scoped via `shop_id`) — this is correct. But the Twilio webhook update query must filter by shop somehow, or it will match across all shops' jobs. The webhook needs to identify which shop's Twilio number received the STOP.
**How to avoid:** Include `shop_id` lookup in the webhook. Twilio posts the `To` field (your Twilio number). Map `TWILIO_PHONE_NUMBER` env var → shop. In v1 with one shop per Twilio account, matching on phone number alone is safe, but the update should still include `.eq('shop_id', shopId)` for correctness.
**Warning signs:** Customers from multiple shops getting incorrectly opted out.

### Pitfall 3: Missing `sms_opted_out` Column Migration
**What goes wrong:** `updateJobStage` calls `sendStageNotification` which reads `sms_opted_out` from job, but the column doesn't exist in DB.
**Why it happens:** Forgetting the Supabase migration for the new column.
**How to avoid:** Wave 0 task must include: `ALTER TABLE jobs ADD COLUMN sms_opted_out BOOLEAN NOT NULL DEFAULT false;` and update the `Job` TypeScript interface.
**Warning signs:** Supabase query returns null for `sms_opted_out`; TypeScript errors on the field.

### Pitfall 4: React Email 5.0 Breaking Change
**What goes wrong:** Using `renderAsync()` from older docs — it no longer exists in React Email 5.0.
**Why it happens:** React Email 5.0 (November 2025) removed `renderAsync` in favor of synchronous `render`.
**How to avoid:** Use the `react` prop on `resend.emails.send()` — Resend handles rendering internally, so you don't need to call `render()` manually at all.
**Warning signs:** `TypeError: renderAsync is not a function`.

### Pitfall 5: Twilio Phone Number Not Configured for Inbound
**What goes wrong:** STOP replies don't fire the webhook because the Twilio number's inbound webhook URL isn't configured.
**Why it happens:** Sending SMS from a number doesn't automatically configure that number to receive/forward inbound messages to your webhook.
**How to avoid:** In Twilio Console: Phone Numbers → Active Numbers → select number → Messaging Configuration → set webhook URL to `https://yourdomain.com/api/webhooks/twilio`.
**Warning signs:** STOP replies received by Twilio but webhook never fires.

### Pitfall 6: Notification Persistence Blocking Stage Move
**What goes wrong:** DB insert into `notifications` table fails and causes the whole `updateJobStage` to return an error, even though the stage was already moved.
**Why it happens:** Awaiting the notification insert without a try/catch.
**How to avoid:** Wrap all notification dispatch (SMS, email, DB persist) in a top-level try/catch. Log errors, do not rethrow.
**Warning signs:** Stage move UI shows error after Twilio/Resend API blip.

### Pitfall 7: A2P 10DLC Registration Timing
**What goes wrong:** SMS sends fail in production with carrier filtering because A2P 10DLC registration is not complete.
**Why it happens:** A2P 10DLC campaign registration takes 2-4 weeks for carrier approval. This was flagged in STATE.md as a known blocker.
**How to avoid:** Initiate A2P 10DLC registration in Twilio Console immediately — don't wait until code is done. Document as a deploy prerequisite.
**Warning signs:** Messages delivered in dev (Twilio test) but failing in production with carrier rejection errors.

---

## Code Examples

### Sending SMS with Twilio Node.js SDK
```typescript
// Source: https://www.twilio.com/docs/messaging/quickstart
import twilio from 'twilio'

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!
)

const message = await client.messages.create({
  body: "Buck's Taxidermy: Great news! Your mount has moved to Tanning! Track progress: https://...",
  from: process.env.TWILIO_PHONE_NUMBER!,  // E.164 format: +12345678901
  to: '+15558675310',                       // Customer phone in E.164 format
})
// message.sid is the message identifier
```

### Sending Email with Resend + React Email
```typescript
// Source: https://resend.com/nodejs + https://resend.com/docs/send-with-nextjs
import { Resend } from 'resend'
import { StageUpdateEmail } from '@/emails/StageUpdateEmail'

const resend = new Resend(process.env.RESEND_API_KEY!)

const { data, error } = await resend.emails.send({
  from: 'Buck\'s Taxidermy <notifications@mounttrack.app>',
  to: 'customer@example.com',
  subject: 'Your mount has moved to Tanning',
  react: StageUpdateEmail({
    shopName: "Buck's Taxidermy",
    shopLogoUrl: 'https://...',
    brandColor: '#2563eb',
    customerName: 'John Smith',
    stageName: 'Tanning',
    portalUrl: 'https://mounttrack.app/portal/abc123',
  }),
})

if (error) {
  console.error('[notifications] Resend error:', error)
}
```

### Parsing Twilio Inbound Webhook in App Router
```typescript
// Source: https://www.twilio.com/docs/messaging/guides/webhook-request
export async function POST(req: Request) {
  // CRITICAL: use formData(), not json() — Twilio sends x-www-form-urlencoded
  const formData = await req.formData()
  const from = formData.get('From') as string         // '+15558675310'
  const body = formData.get('Body') as string         // 'STOP'
  const optOutType = formData.get('OptOutType') as string | null  // 'STOP' | 'START' | 'HELP' | null
  const to = formData.get('To') as string             // your Twilio number

  // optOutType is only present for opt-out/in/help keywords
  if (optOutType === 'STOP') {
    // update sms_opted_out on matching jobs
  }

  return NextResponse.json({ received: true })
}
```

### Supabase `notifications` Table Schema
```sql
-- New table for communication history (feeds JOB-05 in future phase)
CREATE TABLE notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id     UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  job_id      UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  channel     TEXT NOT NULL CHECK (channel IN ('sms', 'email')),
  type        TEXT NOT NULL CHECK (type IN ('stage_update', 'payment_request', 'waitlist_confirm')),
  stage_name  TEXT,           -- stage name at time of send (denormalized)
  sent_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS: owner reads only their shop's notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "shop_owner_notifications" ON notifications
  FOR ALL USING (shop_id = auth.uid());
```

### Supabase `waitlist` Table Schema
```sql
CREATE TABLE waitlist (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id     UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  phone       TEXT NOT NULL,
  animal_type TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;
CREATE POLICY "shop_owner_waitlist" ON waitlist
  FOR ALL USING (shop_id = auth.uid());
```

### TypeScript types to add to `database.ts`
```typescript
export interface Notification {
  id: string
  shop_id: string
  job_id: string
  channel: 'sms' | 'email'
  type: 'stage_update' | 'payment_request' | 'waitlist_confirm'
  stage_name: string | null
  sent_at: string
}

export interface WaitlistEntry {
  id: string
  shop_id: string
  name: string
  phone: string
  animal_type: string
  created_at: string
}
```

And add `sms_opted_out: boolean` to the `Job` interface.

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `renderAsync()` in React Email | `render()` (sync) or `react` prop | React Email 5.0, Nov 2025 | `renderAsync` is removed; use `react` prop on Resend send call instead |
| Install individual `@react-email/` packages | Install `@react-email/components` bundle | 2024 | Single package replaces individual `@react-email/html`, `@react-email/body`, etc. |
| FCC opt-out keywords list | Expanded: REVOKE and OPTOUT added | April 2025 | Twilio auto-handles `REVOKE` and `OPTOUT` as stop keywords now |

**Deprecated/outdated:**
- `renderAsync` from `@react-email/render`: removed in React Email 5.0. Do not use.
- Installing individual `@react-email/html`, `@react-email/body` etc.: use `@react-email/components` bundle.

---

## Open Questions

1. **Resend sender domain verification**
   - What we know: Resend requires a verified sending domain for production email delivery. Emails from `onboarding@resend.dev` work in dev/testing.
   - What's unclear: What domain will be used for the `from` address in production? (`notifications@mounttrack.app` assumed)
   - Recommendation: Plan Wave 0 to include a task for documenting Resend domain verification as a deployment prerequisite. For now, use a placeholder `from` address. This is an operational concern, not a code concern.

2. **Twilio phone number type for A2P 10DLC**
   - What we know: A2P 10DLC registration applies to 10-digit long code (10DLC) US numbers. The registration takes 2-4 weeks and is flagged in STATE.md as a known blocker.
   - What's unclear: Whether the dev/test number can use Twilio's trial mode or if a paid number is required immediately.
   - Recommendation: Treat as a deployment prerequisite. Code works against any Twilio number; carrier delivery is the registration concern.

3. **`bulkMoveJobs` notification fan-out performance**
   - What we know: Bulk move sends individual notifications per job. With many jobs, this could be slow.
   - What's unclear: How many jobs a bulk move realistically contains. Taxidermy shop likely moves 5-20 at once.
   - Recommendation: Use `Promise.allSettled()` to parallelize notification dispatch for bulk moves. Do not serialize. For v1 volume, parallel Twilio/Resend calls are acceptable.

---

## Sources

### Primary (HIGH confidence)
- [https://www.twilio.com/docs/messaging/quickstart](https://www.twilio.com/docs/messaging/quickstart) — Twilio Node.js SMS send API
- [https://www.twilio.com/docs/messaging/guides/webhook-request](https://www.twilio.com/docs/messaging/guides/webhook-request) — Inbound webhook field reference (From, Body, OptOutType)
- [https://resend.com/nodejs](https://resend.com/nodejs) — Resend Node.js send API with `{ data, error }` return shape
- [https://resend.com/docs/send-with-nextjs](https://resend.com/docs/send-with-nextjs) — React Email + Resend in Next.js App Router pattern
- [https://react.email/components](https://react.email/components) — React Email component list (Html, Body, Container, Section, Img, Text, Button, Hr)
- Existing codebase: `src/proxy.ts` matcher, `src/app/api/webhooks/stripe/route.ts` pattern, `src/actions/jobs.ts` updateJobStage TODO stubs

### Secondary (MEDIUM confidence)
- [https://resend.com/blog/react-email-5](https://resend.com/blog/react-email-5) — React Email 5.0 breaking change: `renderAsync` → `render`, Tailwind 4, React 19 + Next.js 16 support confirmed
- [https://help.twilio.com/articles/223134027](https://help.twilio.com/articles/223134027) — STOP keyword handling: automatic blocklist (error 21610) + OptOutType webhook field
- WebSearch results confirming `twilio` npm v5.13.0, `resend` npm v6.9.3, `@react-email/components` v1.0.8

### Tertiary (LOW confidence)
- None — all key claims verified via official sources or official npm registry

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — versions confirmed via npm registry search; APIs verified via official docs
- Architecture: HIGH — patterns match existing codebase conventions (webhook route structure, service client usage, server action patterns)
- Pitfalls: HIGH for code pitfalls (verified via Twilio/Resend docs); MEDIUM for A2P 10DLC operational timeline (known industry pattern, confirmed in STATE.md)

**Research date:** 2026-03-14
**Valid until:** 2026-04-14 (30 days — Twilio/Resend APIs are stable; React Email 5.0 is recent but stable)
