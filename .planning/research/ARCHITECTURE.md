# Architecture Patterns

**Domain:** Multi-tenant taxidermy shop management SaaS (MountTrack)
**Researched:** 2026-03-01
**Confidence:** MEDIUM — based on well-established patterns in training data; web verification unavailable during this session. Core patterns (RLS, Stripe dual-flow, token portals) are stable and widely documented.

---

## Recommended Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Vercel Edge/CDN                          │
│                                                                 │
│  ┌──────────────────┐          ┌──────────────────────────┐    │
│  │  Owner Dashboard  │          │   Customer Portal        │    │
│  │  /app/* (auth)    │          │   /portal/[token] (none) │    │
│  └────────┬─────────┘          └──────────┬───────────────┘    │
│           │ Next.js App Router              │                    │
│           │ Server Components               │                    │
│           │ Route Handlers (API)            │                    │
└───────────┼─────────────────────────────────┼────────────────────┘
            │                                 │
            ▼                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Next.js API Layer                            │
│                                                                 │
│  /app/api/webhooks/stripe   (Stripe events — no auth)          │
│  /app/api/portal/[token]    (token resolution)                  │
│  /app/api/jobs/*            (owner: requires session)          │
│  /app/api/payments/*        (customer: requires valid token)   │
└───────┬───────────────────┬────────────────┬───────────────────┘
        │                   │                │
        ▼                   ▼                ▼
┌──────────────┐  ┌──────────────────┐  ┌──────────────────────┐
│   Supabase   │  │     Stripe       │  │  Notification Layer  │
│              │  │                  │  │                      │
│  Auth        │  │  Billing API     │  │  Twilio (SMS)        │
│  Postgres    │  │  (shop owners)   │  │  Resend (email)      │
│  Storage     │  │                  │  │                      │
│  Realtime    │  │  Payment Intents │  │  Triggered by:       │
│              │  │  (customers)     │  │  job stage changes   │
└──────────────┘  └──────────────────┘  └──────────────────────┘
```

---

## Component Boundaries

| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| **Owner Dashboard** (`/app/(dashboard)/*`) | Job board, job detail, intake form, settings, reports | Supabase (direct via server components), own API routes |
| **Customer Portal** (`/app/portal/[token]/*`) | Job status view, photo gallery, payment form | Portal API routes only (never direct Supabase access) |
| **Portal API** (`/app/api/portal/[token]`) | Resolve token → job context, validate token expiry | Supabase (service role, scoped queries) |
| **Job API** (`/app/api/jobs/*`) | CRUD for jobs, stage transitions, file uploads | Supabase (user auth context), notification layer |
| **Stripe Billing Handler** | Shop owner subscription lifecycle | Stripe Billing API, Supabase (shops table) |
| **Stripe Payment Handler** | Customer payment intents, partial payments | Stripe Payment Intents API, Supabase (payments table) |
| **Stripe Webhook** (`/app/api/webhooks/stripe`) | Handle both billing events + payment events | Supabase (service role) |
| **Notification Dispatcher** | Send branded SMS + email on stage changes | Twilio, Resend, Supabase (shop branding, job/customer data) |
| **Supabase Realtime** | Broadcast job changes to subscribed clients | Postgres CDC → client WebSocket |

---

## Data Flow

### Owner: Stage Change Flow

```
Owner drags job card
  → Optimistic UI update (client state)
  → PATCH /api/jobs/[id]/stage
    → Verify session (Supabase Auth)
    → Verify job belongs to owner's shop (RLS enforces, but double-check)
    → UPDATE jobs SET stage_id = ? WHERE id = ?
    → Supabase Realtime broadcasts change to all subscribed clients
    → Trigger notification dispatch (async)
      → Fetch shop branding (logo, color, name)
      → Render SMS template + email template
      → POST to Twilio (SMS)
      → POST to Resend (email)
  → Client receives Realtime event, confirms optimistic update
```

### Customer: Portal Access Flow

```
Customer clicks unique URL: /portal/[token]
  → Next.js Server Component renders page
  → Lookup portal_tokens WHERE token = ? AND NOT expired
    → If invalid/expired: render "Link Expired" page
    → If valid: fetch job + shop branding (service role, scoped to token's job_id)
  → Render branded portal with job status, photos, balance
  → Realtime subscription established (scoped to job_id via token validation)
    → Any job update broadcasts to this portal session
```

### Customer: Payment Flow

```
Customer clicks "Pay Balance" on portal
  → POST /api/portal/[token]/pay { amount }
    → Validate token → resolve job_id, shop_id
    → Lookup shop's Stripe Connect account (or platform Stripe key)
    → Create Stripe PaymentIntent { amount, metadata: { job_id, shop_id } }
    → Return client_secret to frontend
  → Stripe.js collects card on frontend (Stripe Elements)
  → Payment confirmed → Stripe sends webhook to /api/webhooks/stripe
    → Event: payment_intent.succeeded
    → INSERT into payments { job_id, amount, stripe_payment_intent_id }
    → UPDATE jobs SET amount_paid = amount_paid + ?
    → (Optionally) trigger "Payment Received" notification
```

### Shop Owner: Subscription Flow

```
Owner signs up → creates shop record
  → Redirect to Stripe Billing checkout session (Stripe Billing)
  → Stripe Billing checkout completed → webhook received
    → Event: checkout.session.completed (mode: subscription)
    → UPDATE shops SET stripe_customer_id, stripe_subscription_id, subscription_status = 'active'
  → Owner gains access to dashboard
  → Subscription renewal/failure handled via further webhook events
    → customer.subscription.deleted → mark shop inactive
    → invoice.payment_failed → send warning, grace period logic
```

---

## Database Schema Sketch

### Core Entities

```sql
-- Tenant root: one row per shop account
CREATE TABLE shops (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  slug            TEXT UNIQUE NOT NULL,  -- for subdomain or display
  logo_url        TEXT,
  brand_color     TEXT DEFAULT '#2563EB',
  phone           TEXT,
  email           TEXT,
  -- Stripe Billing (shop owner subscription)
  stripe_customer_id      TEXT UNIQUE,
  stripe_subscription_id  TEXT UNIQUE,
  subscription_status     TEXT DEFAULT 'trialing'
    CHECK (subscription_status IN ('trialing','active','past_due','canceled','paused')),
  subscription_period_end TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Stages are customizable per shop
CREATE TABLE stages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id     UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  position    INTEGER NOT NULL,  -- order on the board
  is_terminal BOOLEAN DEFAULT FALSE,  -- "Ready for Pickup" triggers payment link
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (shop_id, position)
);

-- Customers: scoped to shop
CREATE TABLE customers (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id     UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  phone       TEXT,
  email       TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Core job record
CREATE TABLE jobs (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id             UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  customer_id         UUID NOT NULL REFERENCES customers(id),
  job_number          TEXT NOT NULL,  -- human-readable, e.g. "2024-0042"
  stage_id            UUID REFERENCES stages(id),
  animal_type         TEXT NOT NULL,
  mount_style         TEXT,
  quoted_price        NUMERIC(10,2) NOT NULL DEFAULT 0,
  deposit_amount      NUMERIC(10,2) NOT NULL DEFAULT 0,
  amount_paid         NUMERIC(10,2) NOT NULL DEFAULT 0,  -- running total
  estimated_completion DATE,
  is_rush             BOOLEAN DEFAULT FALSE,
  referral_source     TEXT,
  internal_notes      TEXT,  -- owner-only, never exposed to customer
  intake_date         TIMESTAMPTZ DEFAULT NOW(),
  completed_at        TIMESTAMPTZ,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (shop_id, job_number)
);

-- Payments: tracks all customer payments against a job
-- NOTE: Separate from shop owner subscription billing
CREATE TABLE payments (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id                   UUID NOT NULL REFERENCES shops(id),  -- denormalized for RLS
  job_id                    UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  amount                    NUMERIC(10,2) NOT NULL,
  payment_type              TEXT NOT NULL CHECK (payment_type IN ('deposit','balance','partial')),
  stripe_payment_intent_id  TEXT UNIQUE,
  status                    TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','succeeded','failed','refunded')),
  created_at                TIMESTAMPTZ DEFAULT NOW()
);

-- Portal access tokens: link customers to their job without auth
CREATE TABLE portal_tokens (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id      UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  shop_id     UUID NOT NULL REFERENCES shops(id),  -- denormalized for RLS
  token       TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  expires_at  TIMESTAMPTZ,  -- NULL = never expires (recommended for taxidermy timelines)
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Job photos: progress photos uploaded by owner
CREATE TABLE job_photos (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id     UUID NOT NULL REFERENCES shops(id),  -- denormalized for RLS
  job_id      UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,  -- path in Supabase Storage bucket
  caption     TEXT,
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notification log: full history per job
CREATE TABLE notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id     UUID NOT NULL REFERENCES shops(id),
  job_id      UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  channel     TEXT NOT NULL CHECK (channel IN ('sms','email')),
  template    TEXT NOT NULL,  -- e.g. 'stage_change', 'payment_request', 'waitlist'
  recipient   TEXT NOT NULL,  -- phone or email
  status      TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent','failed','delivered')),
  sent_at     TIMESTAMPTZ DEFAULT NOW()
);

-- Waitlist: pre-intake customers
CREATE TABLE waitlist (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id     UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  phone       TEXT,
  email       TEXT,
  notes       TEXT,
  added_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Supply alerts: per shop
CREATE TABLE supply_alerts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id     UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  item_name   TEXT NOT NULL,
  is_resolved BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
```

---

## RLS Policy Patterns

### Tenant Isolation Pattern

All tables use `shop_id` as the tenant discriminator. Every policy ties back to one of two contexts:

1. **Authenticated owner context** — `auth.uid()` maps to `shops.owner_id`
2. **Service role** — bypasses RLS entirely; used only in server-side API routes for customer portal and webhook handlers

The key lookup function to avoid N+1 policy evaluation:

```sql
-- Helper: resolves the shop_id for the current authenticated user
-- SECURITY DEFINER + STABLE allows the query planner to cache per-transaction
CREATE OR REPLACE FUNCTION get_my_shop_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT id FROM shops WHERE owner_id = auth.uid() LIMIT 1;
$$;
```

### Policy Examples

```sql
-- SHOPS: owner can only see and modify their own shop
ALTER TABLE shops ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner_select_own_shop"
  ON shops FOR SELECT
  USING (owner_id = auth.uid());

CREATE POLICY "owner_update_own_shop"
  ON shops FOR UPDATE
  USING (owner_id = auth.uid());

-- JOBS: owner sees only their shop's jobs
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner_select_jobs"
  ON jobs FOR SELECT
  USING (shop_id = get_my_shop_id());

CREATE POLICY "owner_insert_jobs"
  ON jobs FOR INSERT
  WITH CHECK (shop_id = get_my_shop_id());

CREATE POLICY "owner_update_jobs"
  ON jobs FOR UPDATE
  USING (shop_id = get_my_shop_id());

CREATE POLICY "owner_delete_jobs"
  ON jobs FOR DELETE
  USING (shop_id = get_my_shop_id());

-- PORTAL TOKENS: no direct client access; service role only
-- Do NOT grant SELECT to authenticated or anon roles
-- All portal resolution happens server-side via service role

-- PAYMENTS: owner can see payments for their shop's jobs
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner_select_payments"
  ON payments FOR SELECT
  USING (shop_id = get_my_shop_id());

-- (All payment inserts happen server-side via service role after webhook confirmation)

-- STAGES: owner manages their own stages
ALTER TABLE stages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner_all_stages"
  ON stages FOR ALL
  USING (shop_id = get_my_shop_id())
  WITH CHECK (shop_id = get_my_shop_id());
```

### Why Service Role for Portal (Not Anon RLS)

The customer portal does NOT use Supabase's anon key client-side. Instead:

- The Next.js server resolves the token using the service role Supabase client
- Only the resolved, scoped job data is returned to the client as a serialized object
- No Supabase client is instantiated in the browser for portal pages
- This prevents any possibility of a customer probing the token → job mapping

```typescript
// Server Component pattern for portal
// app/portal/[token]/page.tsx

import { createClient } from '@/lib/supabase/server-service-role'

export default async function PortalPage({ params }: { params: { token: string } }) {
  const supabase = createClient() // uses SERVICE_ROLE_KEY — server only

  const { data: tokenRecord } = await supabase
    .from('portal_tokens')
    .select('job_id, shop_id, expires_at')
    .eq('token', params.token)
    .single()

  if (!tokenRecord || isExpired(tokenRecord.expires_at)) {
    return <LinkExpiredPage />
  }

  const { data: job } = await supabase
    .from('jobs')
    .select(`
      id, job_number, animal_type, mount_style,
      quoted_price, amount_paid, estimated_completion, is_rush,
      stage:stages(name, position),
      photos:job_photos(storage_path, caption, uploaded_at),
      shop:shops(name, logo_url, brand_color)
    `)
    .eq('id', tokenRecord.job_id)
    .single()

  // Pass serialized data — no supabase client in browser
  return <PortalView job={job} shopId={tokenRecord.shop_id} token={params.token} />
}
```

---

## Dual Stripe Architecture

### Two Completely Separate Stripe Flows

| Flow | Who | API | Webhook Events |
|------|-----|-----|----------------|
| **Shop Subscription** | Shop owner pays MountTrack | Stripe Billing (Checkout Sessions, Subscriptions) | `checkout.session.completed`, `invoice.payment_succeeded`, `invoice.payment_failed`, `customer.subscription.deleted` |
| **Customer Payment** | Customer pays shop (collected by MountTrack) | Stripe Payment Intents | `payment_intent.succeeded`, `payment_intent.payment_failed` |

### Key Architectural Decision: Stripe Connect vs Platform Key

Two viable approaches:

**Option A — Stripe Connect (Recommended for v1+):** Each shop has a Stripe Connect account. Customer payments go directly to the shop's Stripe account; MountTrack takes a platform fee. This is the correct approach if shops want payouts, but requires onboarding shops to Stripe.

**Option B — Platform Collects, Pays Out (Simpler for v1):** All customer payments go to MountTrack's Stripe account. MountTrack tracks who owes what and pays shops (via ACH or Stripe payouts). Simpler to implement but creates money-transmission legal complexity at scale.

**Recommendation for v1:** Start with the platform collecting payments (Option B) as taxidermy shops are small and the owner will handle cash/physical pickups anyway. Design the payment column in `jobs` to track collected amounts. If Stripe Connect is added later, it's an additive change.

### Webhook Handler Structure

```typescript
// app/api/webhooks/stripe/route.ts
// Single webhook endpoint for ALL Stripe events
// Stripe sends all events here; we route by event type

export async function POST(req: Request) {
  const sig = req.headers.get('stripe-signature')!
  const body = await req.text()

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return new Response('Invalid signature', { status: 400 })
  }

  // Route by event type
  switch (event.type) {
    // --- SHOP SUBSCRIPTION EVENTS ---
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      if (session.mode === 'subscription') {
        await handleShopSubscriptionCreated(session)
      }
      break
    }
    case 'customer.subscription.deleted': {
      await handleShopSubscriptionCanceled(event.data.object as Stripe.Subscription)
      break
    }
    case 'invoice.payment_failed': {
      await handleShopInvoiceFailed(event.data.object as Stripe.Invoice)
      break
    }

    // --- CUSTOMER PAYMENT EVENTS ---
    case 'payment_intent.succeeded': {
      const pi = event.data.object as Stripe.PaymentIntent
      // Only handle if it has job metadata (not a subscription-related PI)
      if (pi.metadata?.job_id) {
        await handleCustomerPaymentSucceeded(pi)
      }
      break
    }
  }

  return new Response('OK', { status: 200 })
}
```

### Differentiating the Two Contexts via Metadata

All customer Payment Intents must include metadata to distinguish them from subscription-related events:

```typescript
// Creating a customer payment intent
const paymentIntent = await stripe.paymentIntents.create({
  amount: Math.round(amountInDollars * 100),  // cents
  currency: 'usd',
  metadata: {
    job_id: job.id,
    shop_id: job.shop_id,
    payment_type: 'customer_portal',  // discriminator
  },
})
```

---

## Token-Based Customer Portal Pattern

### Token Design

```
URL structure: /portal/[token]
Token:         64 hex chars (32 random bytes via gen_random_bytes(32))
Expiry:        NULL (never expires) — taxidermy jobs can take 6-18 months
Regeneration:  Owner can invalidate and re-generate token if needed
```

### Token Generation on Job Intake

```typescript
// Server action or API route on job creation
async function createJobWithPortalToken(jobData: JobInput) {
  const supabase = createServiceRoleClient()

  // Insert job
  const { data: job } = await supabase
    .from('jobs')
    .insert(jobData)
    .select()
    .single()

  // Create portal token (token generated by Postgres default)
  const { data: token } = await supabase
    .from('portal_tokens')
    .insert({ job_id: job.id, shop_id: job.shop_id })
    .select('token')
    .single()

  const portalUrl = `${process.env.NEXT_PUBLIC_APP_URL}/portal/${token.token}`

  // Dispatch welcome SMS + email with portal URL
  await dispatchNotification({
    job,
    template: 'job_created',
    portalUrl,
  })

  return { job, portalUrl }
}
```

### Realtime on the Portal

The customer portal needs live updates when the owner changes the job stage or uploads a photo. Since portal pages don't use Supabase auth, real-time must be handled carefully:

```typescript
// Client component on the portal page
// Uses ANON key but subscribes only to the specific job_id
// Security: the portal page only renders if the token is valid (server-side check)
// The job_id is passed from server → client as a prop

'use client'
import { createBrowserClient } from '@supabase/ssr'

export function PortalRealtimeSync({ jobId, onUpdate }: Props) {
  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const channel = supabase
      .channel(`portal-job-${jobId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'jobs',
          filter: `id=eq.${jobId}`,  // row-level filter
        },
        (payload) => onUpdate(payload.new)
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [jobId, onUpdate])

  return null
}
```

**Security note for Realtime on portal:** The `jobs` table RLS must allow anon SELECT on a specific job when a valid portal lookup has been performed. One approach is to use a Supabase function or a separate `public_job_view` that only exposes non-sensitive fields (no internal_notes). An alternative is to use Supabase Realtime's "broadcast" feature via server-sent events rather than postgres_changes, eliminating the RLS concern entirely.

**Recommended approach:** Create a `public_job_status` view with only customer-safe fields, enable RLS on it with a policy that allows `anon` to select where `id IN (SELECT job_id FROM portal_tokens WHERE token = current_setting('app.current_token', true))`. Set `app.current_token` via a server function. This is complex — for v1, polling via a timed `router.refresh()` in the portal page (Next.js Server Component re-render) is simpler and safer.

---

## Photo Storage Pattern

### Supabase Storage Bucket Structure

```
Bucket: job-photos  (private bucket — no public access)
  Path: {shop_id}/{job_id}/{filename}
  Example: abc123/def456/progress-2024-03-01.jpg

Bucket: shop-assets  (public bucket — logos)
  Path: {shop_id}/logo.{ext}
```

### Why Private Bucket + Signed URLs

- Photos are tied to a specific job; a customer should only see their own job's photos
- Public bucket would mean anyone with the filename URL can view any photo
- Signed URLs expire and are generated server-side when serving the portal or owner dashboard

```typescript
// Generate signed URLs for job photos (server-side only)
async function getSignedPhotoUrls(storagePaths: string[], expiresIn = 3600) {
  const supabase = createServiceRoleClient()

  const signedUrls = await Promise.all(
    storagePaths.map(path =>
      supabase.storage
        .from('job-photos')
        .createSignedUrl(path, expiresIn)
    )
  )

  return signedUrls.map(({ data }) => data?.signedUrl)
}
```

### Upload Pattern (Owner Dashboard)

```typescript
// Client-side upload with presigned upload URL
async function uploadJobPhoto(file: File, jobId: string, shopId: string) {
  const supabase = createBrowserClient(...)
  const path = `${shopId}/${jobId}/${Date.now()}-${file.name}`

  const { data, error } = await supabase.storage
    .from('job-photos')
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false,
    })

  if (error) throw error

  // Record in database
  await fetch('/api/jobs/photos', {
    method: 'POST',
    body: JSON.stringify({ job_id: jobId, storage_path: data.path }),
  })
}
```

**Storage RLS:** Configure the `job-photos` bucket with policies so authenticated users can only upload/read paths that start with their `shop_id` (`(storage.foldername(name))[1] = get_my_shop_id()::text`). All portal photo access uses server-side signed URLs, bypassing storage RLS entirely.

---

## Kanban Board Architecture

### State Management Approach

**Recommendation:** `@dnd-kit` (not react-beautiful-dnd, which is unmaintained) + React Server Components for initial load + optimistic client updates.

```
Initial render:   Server Component fetches all jobs for shop → hydrates board
Drag interaction: Client Component (dnd-kit) handles drag state locally
Drop:             Optimistic update → PATCH API → success (confirm) / failure (revert)
Realtime sync:    Other browser sessions (or mobile) receive the update via Supabase Realtime
```

### Board Data Model

The Kanban board is a map of `stage_id → Job[]`:

```typescript
type BoardState = {
  stages: Stage[]  // ordered by position
  jobsByStage: Record<string, Job[]>  // stage_id → jobs
}

// On stage drop:
function handleDragEnd(event: DragEndEvent) {
  const { active, over } = event
  if (!over || active.id === over.id) return

  const jobId = active.id as string
  const newStageId = over.id as string  // drop target is a stage column

  // Optimistic update
  setBoardState(prev => moveJobToStage(prev, jobId, newStageId))

  // Persist
  fetch(`/api/jobs/${jobId}/stage`, {
    method: 'PATCH',
    body: JSON.stringify({ stage_id: newStageId }),
  }).catch(() => {
    // Revert on failure
    setBoardState(prev => moveJobToStage(prev, jobId, originalStageId))
    toast.error('Failed to update job stage')
  })
}
```

### Realtime Sync for Multi-Device

The owner may have the board open on their phone while their computer is also open. Realtime ensures both stay in sync:

```typescript
// Subscribe to all job changes for this shop
const channel = supabase
  .channel('board-sync')
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'jobs',
      filter: `shop_id=eq.${shopId}`,
    },
    (payload) => {
      // Reconcile optimistic state with confirmed server state
      handleBoardSync(payload)
    }
  )
  .subscribe()
```

---

## Real-Time Updates Architecture

### Two Distinct Real-Time Needs

| Context | Who | Events | Mechanism |
|---------|-----|--------|-----------|
| **Owner Board** | Shop owner (authenticated) | Job stage changes, new jobs, photo uploads | Supabase Realtime postgres_changes (authenticated channel) |
| **Customer Portal** | Customer (unauthenticated) | Job stage change, estimated date change | Supabase Realtime (anon, scoped to job_id) OR polling |

### Recommendation: Polling for Portal (v1), Realtime Later

For the customer portal in v1, use Next.js `router.refresh()` on an interval (every 30 seconds) rather than a persistent WebSocket. Reasons:
- Eliminates RLS complexity for unauthenticated realtime
- Taxidermy stage changes are infrequent (days apart, not seconds)
- Reduces Supabase connection count for free/starter tier
- Simpler to reason about and debug

Upgrade path: Replace interval refresh with Supabase Realtime Broadcast (server pushes to channel, no postgres_changes RLS needed) when real-time becomes a differentiation point.

### Owner Dashboard: Full Realtime

The owner board gets full Realtime from day one because:
- Multi-device use case is realistic (phone + desktop)
- Immediate feedback on drag-and-drop across sessions is expected
- Authenticated context makes RLS straightforward

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: Exposing Supabase Anon Key in Customer Portal Queries

**What goes wrong:** Using the Supabase client with the anon key in browser-side code on the portal to query jobs directly.
**Why bad:** A customer can craft queries against other jobs; even with RLS, the token-to-job mapping logic is hard to enforce at the database level without custom JWT claims.
**Instead:** All portal data fetching happens in Next.js Server Components using the service role key. Only the safe, serialized result reaches the browser.

### Anti-Pattern 2: Mixing Stripe Billing and Payment Intent Events Without Discrimination

**What goes wrong:** A `payment_intent.succeeded` event fires for both a Stripe Billing invoice and a customer portal payment; the handler treats them the same.
**Why bad:** Double-crediting, incorrect payment records, subscription logic firing on customer payments.
**Instead:** Always tag customer Payment Intents with `metadata.payment_type = 'customer_portal'`. In the webhook handler, check for this metadata before processing.

### Anti-Pattern 3: Storing Internal Notes in Job View Exposed to Portal

**What goes wrong:** Including `internal_notes` in any query that can be reached via portal token resolution.
**Why bad:** Owner-only field exposed to customer.
**Instead:** Never select `internal_notes` in portal-facing queries. If using a view, exclude the column at the view definition level.

### Anti-Pattern 4: Single-Column Stage Position Without Gap Strategy

**What goes wrong:** Stages use integer positions 1, 2, 3... When owner reorders, an UPDATE on every stage is required.
**Why bad:** Race conditions, unnecessary writes.
**Instead:** Use floating-point positions (1.0, 2.0, 3.0); inserting between two stages uses (pos1 + pos2) / 2. Periodically renormalize. Or use a simple integer with full-array reorder on the client and a batch update endpoint.

### Anti-Pattern 5: Not Denormalizing shop_id on Child Tables

**What goes wrong:** `payments` table only has `job_id`, no `shop_id`. To write an RLS policy, a subquery to `jobs` is required on every row access.
**Why bad:** Performance degradation; complex policies that are harder to audit.
**Instead:** Denormalize `shop_id` on all child tables (`payments`, `job_photos`, `notifications`, etc.) for direct RLS comparison. Use a trigger or application logic to keep it consistent.

---

## Suggested Build Order

Based on component dependencies:

```
1. Foundation
   └── Supabase project setup
   └── Database schema (all tables, RLS policies)
   └── Supabase Storage buckets + policies
   └── Next.js project scaffold (App Router, layouts, auth middleware)
   └── Supabase Auth + shop creation flow

2. Shop Owner Core
   └── Stage management (CRUD, reorder)
   └── Job intake form
   └── Job board (Kanban — static, no realtime yet)
   └── Job detail page

3. Stripe Billing (Shop Subscription)
   └── Checkout session creation
   └── Webhook handler (subscription events)
   └── Subscription gate middleware (block dashboard if inactive)

4. Customer Portal
   └── Token generation on job creation
   └── Portal page (server component, token resolution)
   └── Portal payment (Payment Intent + Stripe Elements)
   └── Stripe webhook handler (payment events)

5. Notifications
   └── Notification dispatcher (Twilio + Resend)
   └── Stage change triggers
   └── Payment request trigger
   └── Branded templates

6. Real-Time & Polish
   └── Supabase Realtime on owner board
   └── Portal polling / realtime upgrade
   └── Photo uploads (owner → Supabase Storage)
   └── Portal photo gallery (signed URLs)

7. Reports & Advanced Features
   └── Revenue, turnaround, referral reports
   └── Calendar + queue views
   └── Bulk stage move
   └── Supply alerts
   └── Search + filter
```

**Critical path:** 1 → 2 → 3 (can't sell without billing gate) → 4 (core value prop) → 5 (automation) → 6 → 7

---

## Scalability Considerations

| Concern | At 100 Shops | At 10K Shops | At 1M Shops |
|---------|--------------|--------------|-------------|
| RLS performance | Fine — shop_id indexed | Add index on all shop_id FKs | Consider read replicas per region |
| Realtime connections | Free tier sufficient | Upgrade Supabase plan | Shard by region or use broadcast channels |
| Storage costs | Negligible | Monitor; signed URL cache TTL tuning | CDN in front of Supabase Storage |
| Stripe webhook volume | Single handler fine | Consider queue (e.g., BullMQ) between webhook and DB writes | Dedicated webhook processor service |
| Notification volume | Twilio/Resend direct fine | Rate limits may apply; add queue | Dedicated notification microservice |

---

## Sources

All findings are based on training data (knowledge cutoff August 2025). Web search and WebFetch tools were unavailable during this session.

**Confidence levels:**
- RLS patterns (MEDIUM-HIGH) — Supabase RLS is well-documented and stable; policies shown reflect official Supabase patterns
- Dual Stripe architecture (MEDIUM) — Stripe metadata discrimination is a standard pattern; Connect vs platform decision is an architectural choice, not a technical constraint
- Token-based portal (HIGH) — Server Component + service role key is the canonical Next.js App Router pattern for unauthenticated secure access
- Supabase Storage (MEDIUM) — Signed URL pattern is stable; RLS on storage uses `storage.foldername()` helper which was available as of training cutoff
- dnd-kit for Kanban (MEDIUM-HIGH) — react-beautiful-dnd is confirmed unmaintained; dnd-kit is the community consensus replacement
- Realtime / polling recommendation (MEDIUM) — Polling-first for unauthenticated portals is a conservative, well-reasoned choice; validate against current Supabase Realtime broadcast docs before Phase 6

**Verify before implementing:**
- Supabase Realtime broadcast vs postgres_changes for unauthenticated portals: https://supabase.com/docs/guides/realtime
- Supabase Storage RLS `storage.foldername()` syntax: https://supabase.com/docs/guides/storage/security/access-control
- dnd-kit current API (the library releases frequently): https://dndkit.com
- Stripe Connect onboarding requirements if moving away from platform model: https://stripe.com/docs/connect
