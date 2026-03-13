# Phase 5: Payments - Research

**Researched:** 2026-03-12
**Domain:** Stripe Checkout (one-time payment), Supabase payments table, Next.js API routes, portal UI
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Portal payment section only visible when the customer has a remaining balance — hidden when fully paid
- Shows full breakdown: quoted price, deposit paid, any prior Stripe payments, and remaining balance
- Positioned below the stage timeline (timeline stays the hero element)
- After a successful payment: show an explicit success confirmation message before returning to normal portal view
- Free-form amount entry — customer types any dollar amount up to the remaining balance
- Minimum partial payment: $50 (floor to prevent micro-payments)
- Inline validation error if amount exceeds remaining balance: "Amount cannot exceed remaining balance of $X"
- Portal shows customer's payment history: deposit paid + any prior Stripe payments made (with dates)
- Redirect to Stripe-hosted Checkout — no embedded Payment Element
- Customer enters their desired amount on the portal first; Checkout is pre-filled with that specific amount
- After successful payment, Stripe redirects back to `/portal/[token]?payment=success` where the portal shows a confirmation message
- Dedicated payments section inline on the job detail page (not a separate tab)
- Shows: Quoted price, Deposit recorded at intake, all Stripe payments (amount + date), Outstanding balance
- Stripe payments only — no manual cash/check payment entry in this phase
- Prominent stat card at the top of the dashboard, consistent with existing job count stat cards
- Displays total outstanding balance across all active jobs
- Owner can trigger a payment request SMS/email from a button on the job detail page at any time
- Same payment link format as the automated "Ready for Pickup" trigger
- Automated payment link on "Ready for Pickup" stage change (PAY-03)

### Claude's Discretion
- Exact stat card styling and placement order on the dashboard
- Success confirmation message copy and design
- Stripe Checkout session configuration details (currency, metadata, etc.)
- Database schema for storing payment records
- Webhook handling for Stripe payment confirmation

### Deferred Ideas (OUT OF SCOPE)
- Manual cash/check payment recording — future reporting phase
- Automated reminder SMS if job has been "Ready for Pickup" for N days without payment — v2 (AUTO-01 in requirements)
- PDF receipt emailed after final payment — Phase 7 (DOC-01)
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| PAY-01 | Customer can pay their remaining balance via Stripe on the customer portal | Stripe Checkout `mode: 'payment'` + `price_data` + redirect to `/portal/[token]?payment=success` |
| PAY-02 | Customer can make a partial payment (not required to pay full balance at once) | Free-form amount input on portal → custom `unit_amount` in `price_data`; payments table accumulates; balance recalculates from sum |
| PAY-03 | Payment link automatically sent when job reaches "Ready for Pickup" stage | Extend `updateJobStage` action to detect "Ready for Pickup" stage name; send portal URL (which contains the payment section) via SMS/email — NOTE: SMS/email delivery is Phase 6; PAY-03 in this phase = only auto-trigger logic wired, delivery deferred |
| PAY-04 | Owner can manually trigger a payment request from job detail at any time | New server action `sendPaymentRequest(jobId)` + button in job detail sidebar — same link as PAY-03 |
| PAY-05 | Owner can view all payments, deposits, and outstanding balance per job | New inline `PaymentsSection` component in `job-detail-client.tsx` reading from `payments` table |
| PAY-06 | Owner dashboard shows total outstanding balance across all active jobs | Dashboard already calculates `balanceDue` from quoted_price − deposit_amount; update to subtract confirmed Stripe payments too; new stat card or update existing "Balance Due" card |
</phase_requirements>

---

## Summary

Phase 5 adds Stripe payment collection to the existing portal and owner interfaces. The project already has Stripe fully wired (stripe@20.4.0, apiVersion '2026-02-25.clover', webhook handler, `@/lib/stripe/client`). The new work is a second Stripe Checkout flow — `mode: 'payment'` with `price_data` for variable amounts — distinct from the existing `mode: 'subscription'` flow. The two flows must be discriminated in the webhook handler by the presence of `metadata.job_id` vs `metadata.shop_id` at the subscription level.

The core data model is a new `payments` table recording confirmed Stripe payments per job. Balance is always computed dynamically: `quoted_price − deposit_amount − SUM(payments.amount_cents) / 100`. The portal reads this live on every render (server component, no caching); the dashboard aggregates across all jobs in a single query. Payment history is displayed on both the portal (customer-facing) and the job detail page (owner-facing).

PAY-03 (automated payment link on "Ready for Pickup") sits at an interesting boundary: the actual SMS/email delivery belongs to Phase 6 (Twilio/Resend not yet integrated). The safe approach for this phase is to wire the trigger logic inside `updateJobStage` so it fires when the stage name is "Ready for Pickup", but stub the delivery — the portal URL itself is already a functional payment link. PAY-04 (manual trigger) follows the same code path as PAY-03 but called from the job detail page on demand.

**Primary recommendation:** Build the `payments` table + webhook first, then portal payment card, then owner job detail section, then dashboard stat update. PAY-03/PAY-04 delivery can be stubbed with `console.log` + TODO markers since real SMS/email lands in Phase 6.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| stripe (server) | ^20.4.0 (already installed) | Create Checkout sessions, verify webhooks | Already in project; apiVersion '2026-02-25.clover' |
| @stripe/stripe-js (client) | ^8.9.0 (already installed) | Not needed for redirect Checkout — no client-side Stripe calls required | Already installed but unused for this flow |
| @supabase/supabase-js | ^2.98.0 (already installed) | Read/write `payments` table | Already in project |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| next (App Router) | 16.1.6 (already installed) | API route for Stripe webhook + Checkout session creation | Already in project |
| react-hook-form + zod | already installed | Amount input validation on portal | Portal payment form needs controlled input with inline validation |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Stripe Checkout (redirect) | Stripe Payment Element (embedded) | User locked in redirect — avoids iframe complexity, no PCI scope burden, simpler implementation |
| Custom payments table | Stripe-side balance tracking only | Custom table required — Stripe has no concept of "job balance"; must track locally |
| price_data inline | Pre-created Stripe Price objects | price_data is simpler for variable amounts — no Stripe dashboard management needed |

**Installation:** No new packages required. All dependencies already installed.

---

## Architecture Patterns

### Recommended Project Structure

```
mounttrack/src/
├── app/
│   ├── api/
│   │   ├── create-payment-session/
│   │   │   └── route.ts          # POST — creates Stripe Checkout session for portal payment
│   │   └── webhooks/
│   │       └── stripe/
│   │           └── route.ts      # EXTENDED — add checkout.session.completed handler for job payments
│   └── portal/
│       └── [token]/
│           └── page.tsx          # EXTENDED — read ?payment=success, render PaymentCard below StageTimeline
├── actions/
│   └── payments.ts               # NEW — sendPaymentRequest(jobId) server action
├── components/
│   └── portal/
│       └── payment-card.tsx      # NEW — portal payment UI (breakdown + amount input + pay button)
│   └── payments-section.tsx      # NEW — owner job detail inline payments section
└── supabase/
    └── migrations/
        └── 0005_payments_table.sql  # NEW
```

### Pattern 1: Stripe Checkout Session for Variable Payment Amount

**What:** Create a `mode: 'payment'` Checkout session with `price_data` to embed the exact dollar amount the customer entered. Store `job_id` and `portal_token` in `metadata` for webhook reconciliation.

**When to use:** Every time a customer clicks "Pay" on the portal, the portal page calls the API route, which creates a fresh session and redirects.

**Example:**
```typescript
// Source: https://docs.stripe.com/api/checkout/sessions/create
// app/api/create-payment-session/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe/client'
import { createServiceClient } from '@/lib/supabase/service'

export async function POST(req: NextRequest) {
  const { portalToken, amountCents } = await req.json()

  // Validate token and load job
  const supabase = createServiceClient()
  const { data: job } = await (supabase.from('jobs') as any)
    .select('id, shop_id, quoted_price, deposit_amount, customer_email, customer_name')
    .eq('portal_token', portalToken)
    .single()

  if (!job) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Compute and validate amount on the server — never trust client amount
  const totalPaid = await getTotalPaidCents(supabase, job.id)  // sum from payments table
  const remainingCents = Math.round(job.quoted_price * 100) - Math.round((job.deposit_amount ?? 0) * 100) - totalPaid
  if (amountCents < 5000 || amountCents > remainingCents) {
    return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: [{
      price_data: {
        currency: 'usd',
        product_data: { name: `Payment for ${job.customer_name}'s mount` },
        unit_amount: amountCents,  // already in cents
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
```

### Pattern 2: Webhook Handler Extension — Discriminating Subscription vs. Payment Events

**What:** The existing webhook at `app/api/webhooks/stripe/route.ts` handles `checkout.session.completed` for subscriptions (keyed on `metadata.shop_id` + checking `session.subscription`). The new payment flow also fires `checkout.session.completed` but has `metadata.job_id` and no `session.subscription`. Discriminate by checking `session.subscription` presence.

**When to use:** Every `checkout.session.completed` event — route to subscription handler or payment handler based on `session.subscription`.

**Example:**
```typescript
// Source: existing webhook + Stripe docs idempotency pattern
case 'checkout.session.completed': {
  const session = event.data.object

  if (session.subscription) {
    // --- Existing subscription flow ---
    const shopId = session.metadata?.shop_id
    // ... existing code unchanged ...
    break
  }

  // --- New payment flow ---
  const jobId = session.metadata?.job_id
  if (!jobId) {
    console.warn('checkout.session.completed: no job_id — skipping')
    break
  }

  // Idempotency: check if this stripe_session_id was already processed
  const { data: existing } = await (supabase.from('payments') as any)
    .select('id')
    .eq('stripe_session_id', session.id)
    .single()

  if (existing) break  // already processed — webhook retry

  const amountCents = session.amount_total ?? 0
  await (supabase.from('payments') as any).insert({
    job_id: jobId,
    shop_id: session.metadata?.shop_id,
    stripe_session_id: session.id,
    stripe_payment_intent_id: session.payment_intent as string,
    amount_cents: amountCents,
    paid_at: new Date().toISOString(),
  })
  break
}
```

### Pattern 3: Portal Payment Card — Server Component Reading + Client Component for Form

**What:** The portal page (`/portal/[token]/page.tsx`) is a server component. It reads the `payments` table to compute remaining balance. It renders a `PaymentCard` below the `StageTimeline`. `PaymentCard` is a client component that handles the amount input, validation, and redirect-to-Stripe logic.

**When to use:** Every portal page render — balance check happens server-side, no client-side balance computation.

**Example:**
```typescript
// portal/[token]/page.tsx (server component addition)
const { data: payments } = await (supabase.from('payments') as any)
  .select('amount_cents, paid_at')
  .eq('job_id', job.id)
  .order('paid_at', { ascending: true }) as { data: { amount_cents: number; paid_at: string }[] | null }

const totalStripePaymentsCents = (payments ?? []).reduce((s, p) => s + p.amount_cents, 0)
const depositCents = Math.round((job.deposit_amount ?? 0) * 100)
const quotedCents = Math.round(job.quoted_price * 100)
const remainingCents = quotedCents - depositCents - totalStripePaymentsCents

// Only render payment card when balance remains
{remainingCents > 0 && (
  <PaymentCard
    portalToken={token}
    quotedCents={quotedCents}
    depositCents={depositCents}
    priorPayments={payments ?? []}
    remainingCents={remainingCents}
  />
)}
```

### Pattern 4: Payment Success State via URL Query Param

**What:** After Stripe redirects back to `/portal/[token]?payment=success`, the portal page reads `searchParams.payment` and passes it as a prop to trigger the success message. `PortalAutoRefresh` already triggers `router.refresh()` which will re-render the server component with the updated balance.

**When to use:** Always — this is Stripe's standard redirect-back pattern.

**Example:**
```typescript
// portal/[token]/page.tsx
export default async function PortalPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>
  searchParams: Promise<{ payment?: string }>
}) {
  const { token } = await params
  const { payment } = await searchParams
  const paymentSuccess = payment === 'success'
  // ...
  // Pass paymentSuccess to PaymentCard or render banner inline
}
```

### Pattern 5: Proxy Exemption for New API Route

**What:** The existing `proxy.ts` matcher already exempts `api/webhooks/` from the auth gate. The new `api/create-payment-session` route is called from the public portal (no auth session). It must also be exempted or be listed as a public route in `proxy.ts`.

**How to fix:** Extend the `isPublicRoute` check in `proxy.ts`:
```typescript
const isPublicRoute = pathname.startsWith('/portal/') ||
  pathname.startsWith('/api/create-payment-session')
```

Alternatively, update the matcher regex to exclude `api/create-payment-session` from the proxy entirely (like `api/webhooks/` is currently excluded).

### Anti-Patterns to Avoid

- **Trusting client-supplied amount without server re-validation:** The portal sends `amountCents` to the API route. The API route must re-compute remaining balance from the DB and reject any amount outside `[5000, remainingCents]`. Never skip this.
- **Storing `payment_status: 'pending'` as "paid":** Only insert to `payments` table inside `checkout.session.completed` webhook — not on the success URL redirect. The redirect fires before the webhook in some cases.
- **Using session.amount_total without checking payment_status:** Always verify `session.payment_status === 'paid'` before recording a payment, especially in test mode.
- **Forgetting to handle webhook retries:** The idempotency check (`stripe_session_id` unique) prevents double-crediting if Stripe retries the webhook.
- **Polling for balance on the success URL:** Use `PortalAutoRefresh` (already exists) which calls `router.refresh()` — this re-fetches from Supabase on the server side.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Payment form validation (amount limits) | Custom min/max logic spread across components | Single server-side validation in API route + client-side mirror | PCI scope, user trust, prevents race conditions |
| Webhook signature verification | Manual HMAC comparison | `stripe.webhooks.constructEvent()` | Already in project; cryptographically correct |
| Balance calculation on client | JavaScript subtraction in portal client component | Server-computed `remainingCents` passed as prop | Prevents timing attacks and stale state |
| Checkout redirect | Custom payment form | Stripe Checkout redirect | No PCI compliance burden; handles card vaulting, 3DS, regional payment methods |
| Currency formatting | Custom formatter | `(cents / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' })` | Already used in dashboard as `fmtMoney`; reuse pattern |

**Key insight:** Stripe Checkout handles all PCI scope. The only server-side Stripe code needed is session creation and webhook receipt — never touch raw card data.

---

## Common Pitfalls

### Pitfall 1: Webhook Fires Before or After Success Redirect

**What goes wrong:** Customer is redirected to `?payment=success` before the `checkout.session.completed` webhook arrives. Portal still shows old balance.
**Why it happens:** Stripe redirects client immediately after payment confirmation; webhook delivery can lag seconds to minutes.
**How to avoid:** `PortalAutoRefresh` calls `router.refresh()` on a timer — portal re-fetches from DB. Eventually the webhook arrives, writes to `payments` table, and the next refresh shows the updated balance. For immediate feedback, the success banner is shown based on the URL param alone (not the DB balance).
**Warning signs:** Customer sees "Payment received!" banner but balance still shows old value — this is expected for a few seconds, not a bug.

### Pitfall 2: Discriminating Two checkout.session.completed Event Streams

**What goes wrong:** The existing subscription webhook handler already processes `checkout.session.completed`. Adding job payment handling in the same `case` block without discrimination will corrupt both flows.
**Why it happens:** Both subscription checkout and payment checkout fire the same event type.
**How to avoid:** Check `session.subscription` — present for subscriptions, `null` for one-time payments. The job payment flow additionally checks `session.metadata?.job_id`.
**Warning signs:** `console.warn` fires about "no shop_id in metadata" — this means the subscription branch is seeing job payment events.

### Pitfall 3: Amount Validation Only on Client

**What goes wrong:** Malicious or buggy client sends `amountCents: 1` bypassing the portal validation UI. Stripe creates a valid $0.01 payment, webhook records it, balance appears paid off.
**Why it happens:** Trusting client-supplied financial amounts.
**How to avoid:** API route at `/api/create-payment-session` always re-queries remaining balance from DB and rejects `amountCents < 5000` or `amountCents > remainingCents`.
**Warning signs:** Payments inserted with `amount_cents < 5000`.

### Pitfall 4: Forgetting to Exempt /api/create-payment-session from Auth Gate

**What goes wrong:** Portal page (public, no auth session) calls `/api/create-payment-session` — proxy redirects the API call to `/login`, session creation fails silently.
**Why it happens:** `proxy.ts` currently only exempts `/portal/` and `api/webhooks/` from auth. New API route is not in scope.
**How to avoid:** Add `pathname.startsWith('/api/create-payment-session')` to `isPublicRoute` in `proxy.ts`. Verify with a quick test in dev before implementing the full flow.
**Warning signs:** POST to `/api/create-payment-session` returns HTML (the login page) instead of JSON.

### Pitfall 5: Balance Drift from Deposit Not in payments Table

**What goes wrong:** Deposit was recorded at intake as `job.deposit_amount` (a field on the `jobs` table, not in `payments`). If balance calculation uses `SUM(payments.amount_cents)` alone it will over-count the remaining balance.
**Why it happens:** Deposit predates Phase 5 and was never in a `payments` table.
**How to avoid:** Balance formula is always: `quoted_price − deposit_amount − SUM(payments.amount_cents) / 100`. The `payments` table only stores Stripe-confirmed payments (not the deposit). The deposit is shown separately in the UI as "Deposit Paid" in both portal and owner views.
**Warning signs:** Balance shows `quoted_price − SUM(payments.amount_cents)` without subtracting deposit — overstates what's owed.

### Pitfall 6: PAY-03 Stage Name Matching Brittle

**What goes wrong:** `updateJobStage` checks if the new stage name is "Ready for Pickup" to trigger the payment link. If the owner renames that stage, the trigger silently stops firing.
**Why it happens:** Stage names are owner-configurable (BOARD-03).
**How to avoid:** For this phase, match by stage name "Ready for Pickup" as a best-effort trigger (acceptable for v1). Document this limitation in a TODO comment. A robust solution (stage flags in DB) is a future enhancement.
**Warning signs:** Owner renames "Ready for Pickup" to "Pickup Ready" — no payment link sent.

---

## Code Examples

Verified patterns from existing codebase and official sources:

### Existing Stripe Client (already in project)
```typescript
// Source: mounttrack/src/lib/stripe/client.ts
import Stripe from 'stripe'
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-02-25.clover',
  typescript: true,
})
```

### Existing Webhook Verification Pattern (already in project)
```typescript
// Source: mounttrack/src/app/api/webhooks/stripe/route.ts
export const runtime = 'nodejs'  // REQUIRED: disables body parsing

export async function POST(req: Request) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')
  if (!sig) return NextResponse.json({ error: 'No signature' }, { status: 400 })
  let event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }
  // ...
}
```

### Existing Service Client for Unauthenticated DB Access (already in project)
```typescript
// Source: mounttrack/src/lib/supabase/service.ts pattern
// Used in portal page — same pattern needed in /api/create-payment-session
const supabase = createServiceClient()
```

### Stripe Checkout Session — Payment Mode with price_data
```typescript
// Source: https://docs.stripe.com/api/checkout/sessions/create (verified)
const session = await stripe.checkout.sessions.create({
  mode: 'payment',
  payment_method_types: ['card'],
  line_items: [{
    price_data: {
      currency: 'usd',
      product_data: { name: `Payment — ${jobDescription}` },
      unit_amount: amountCents,  // integer, in cents
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
// redirect(session.url!) — from the API route, return JSON with url, let client redirect
```

### Dashboard Outstanding Balance (existing pattern to extend)
```typescript
// Source: mounttrack/src/app/(app)/dashboard/page.tsx
// Currently computed as: quoted - deposit (no payments table yet)
const balanceDue = totalQuoted - totalDeposits
// Phase 5 update: subtract confirmed Stripe payments
// SELECT SUM(amount_cents) FROM payments WHERE shop_id = userId
const totalStripePaid = stripePaymentsRes / 100
const balanceDue = totalQuoted - totalDeposits - totalStripePaid
```

### Supabase Pattern for New Table (existing conventions)
```typescript
// Source: existing codebase — (supabase.from('table') as any) pattern required
// due to hand-written types without full GenericSchema
const { data, error } = await (supabase.from('payments') as any)
  .select('id, amount_cents, paid_at, stripe_session_id')
  .eq('job_id', jobId)
  .order('paid_at', { ascending: true }) as {
    data: Payment[] | null
    error: { message: string } | null
  }
```

---

## Database Schema

### payments Table (Migration 0005)

```sql
-- Migration: 0005_payments_table.sql
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  stripe_session_id TEXT NOT NULL UNIQUE,         -- idempotency key; prevents duplicate processing
  stripe_payment_intent_id TEXT,                   -- for reconciliation
  amount_cents INTEGER NOT NULL,                   -- confirmed amount in cents
  paid_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "shop_isolation" ON payments
  FOR ALL
  USING (shop_id = auth.uid());

CREATE INDEX payments_job_id_idx ON payments (job_id);
CREATE INDEX payments_shop_id_idx ON payments (shop_id);
```

**Key design decisions:**
- `stripe_session_id UNIQUE` — database-enforced idempotency; webhook retries cannot insert duplicate rows
- `amount_cents INTEGER` — always store money as cents (integer), never float
- `shop_id` on the table — allows dashboard to `SUM` all payments without joining through `jobs`; also satisfies RLS without needing to traverse the join
- No `status` field — only confirmed payments are inserted (webhook fires after payment confirmed)
- No `deposit` rows — deposits remain on `job.deposit_amount`; kept separate per user decision

### TypeScript Type Addition
```typescript
// Add to database.ts
export interface Payment {
  id: string
  shop_id: string
  job_id: string
  stripe_session_id: string
  stripe_payment_intent_id: string | null
  amount_cents: number
  paid_at: string
}

// Add to Database.public.Tables:
payments: {
  Row: Payment
  Insert: Omit<Payment, 'id' | 'paid_at'> & { id?: string; paid_at?: string }
  Update: Partial<Omit<Payment, 'id' | 'shop_id' | 'job_id'>>
  Relationships: []
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Stripe Payment Intents (manual) | Stripe Checkout (hosted page) | Ongoing — Checkout is Stripe's recommended approach | No PCI scope on our server; no card UI to build |
| Stripe Connect for platform payments | Direct charge on platform account | Project decision (pre-Phase 5) | Simpler; no Connect setup; all money flows through MountTrack's Stripe account; payouts to shop owners is manual/out-of-scope v1 |
| `checkout.session.completed` with `payment_status` check | `checkout.session.completed` with `session.subscription` discrimination | Phase 5 architecture decision | Prevents the two Checkout flows from polluting each other |

**Deprecated/outdated:**
- `stripe.charges.create()`: Obsolete for new integrations; replaced by PaymentIntents/Checkout
- `stripe.paymentIntents.create()` with manual confirmation: Unnecessary when using hosted Checkout

---

## Open Questions

1. **PAY-03: What constitutes "Ready for Pickup" — stage name match or a flag on the stage?**
   - What we know: Stages are owner-configurable (BOARD-03). Default stage name "Ready for Pickup" seeded by DB trigger.
   - What's unclear: No `is_pickup_stage` boolean exists on the `stages` table.
   - Recommendation: Match by stage name `=== 'Ready for Pickup'` in `updateJobStage` for v1 with a TODO comment. This is acceptable because the default stage name is the standard and most owners won't rename it. If they do, the trigger silently skips — no data corruption.

2. **PAY-03/PAY-04: Where exactly does "send payment link" go if SMS/email is Phase 6?**
   - What we know: Phase 6 brings Twilio/Resend integration. PAY-03 is a Phase 5 requirement.
   - What's unclear: Does PAY-03 need real delivery in Phase 5 or just the trigger wiring?
   - Recommendation: Wire the trigger (detect "Ready for Pickup" stage → build portal URL → log it) and add a TODO: `// TODO Phase 6: send SMS + email via Twilio/Resend`. The portal URL itself is already functional as a payment link. This satisfies the requirement's intent without blocking on Phase 6 infrastructure. **Confirm with user before planning.**

3. **Dashboard stat card: replace or add?**
   - What we know: The dashboard currently has a "Balance Due" stat card with `green` accent computed as `totalQuoted - totalDeposits`. This is PAY-06.
   - What's unclear: User wants a "prominent" stat card — should this replace the existing "Balance Due" card (which already shows a version of this) or be a fifth card alongside it?
   - Recommendation: Update the existing "Balance Due" stat card to use the fully accurate formula (including Stripe payments). The 4-card grid layout is already established. Adding a 5th card would change the layout. "Claude's Discretion" covers placement — recommend updating in place.

---

## Sources

### Primary (HIGH confidence)
- Existing codebase: `mounttrack/src/app/api/webhooks/stripe/route.ts` — webhook verification pattern, subscription event handling
- Existing codebase: `mounttrack/src/actions/billing.ts` — `stripe.checkout.sessions.create()` pattern with `metadata`, `success_url`, `cancel_url`
- Existing codebase: `mounttrack/src/lib/stripe/client.ts` — Stripe client, apiVersion '2026-02-25.clover'
- Existing codebase: `mounttrack/src/app/(app)/dashboard/page.tsx` — StatCard component, balance calculation, `fmtMoney` utility
- Existing codebase: `mounttrack/src/proxy.ts` + `src/lib/supabase/proxy.ts` — route exemption patterns
- https://docs.stripe.com/api/checkout/sessions/create — `price_data`, `unit_amount`, `metadata`, `mode: 'payment'` parameters
- https://docs.stripe.com/payments/checkout/fulfill-orders — idempotency pattern for `checkout.session.completed`

### Secondary (MEDIUM confidence)
- https://docs.stripe.com/webhooks — duplicate event handling, `stripe_session_id` idempotency key pattern (verified against official Stripe docs)

### Tertiary (LOW confidence)
- None — all critical findings verified against official docs or existing codebase

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — existing codebase already uses stripe@20.4.0; no new packages needed
- Architecture: HIGH — patterns derived directly from existing codebase conventions + verified Stripe docs
- Database schema: HIGH — follows exact migration pattern of 0001–0004 in codebase; `UNIQUE` on `stripe_session_id` is the established idempotency pattern
- Pitfalls: HIGH — webhook discrimination and amount validation are verified Stripe concerns; proxy exemption is verified against existing proxy.ts
- PAY-03 delivery: MEDIUM — SMS/email delivery genuinely deferred to Phase 6; stub approach is a recommendation, not a verified user decision

**Research date:** 2026-03-12
**Valid until:** 2026-04-12 (Stripe API is stable; Next.js 16 / stripe@20 are current)
