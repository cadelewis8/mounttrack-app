# Domain Pitfalls

**Domain:** Multi-tenant SaaS — Taxidermy Shop Management (MountTrack)
**Stack:** Next.js (App Router) + Supabase + Stripe + Twilio + Resend + Vercel
**Researched:** 2026-03-01
**Confidence Note:** WebSearch/WebFetch tools unavailable during this session. All findings are drawn from training knowledge (cutoff August 2025). Confidence levels reflect that. Flag any RLS, Stripe webhook, and Twilio A2P details for verification against current official docs before implementation.

---

## Critical Pitfalls

Mistakes that cause data breaches, financial bugs, or rewrites.

---

### Pitfall 1: RLS Disabled or Missing on a Table — Silent Full Exposure

**What goes wrong:**
A new table is created (e.g., `supply_alerts`, `job_notes`, `stage_configs`) and RLS is never enabled. Supabase tables have RLS *disabled* by default. Any authenticated user — including a shop owner from Tenant B — can query all rows from Tenant A's table using the Supabase client. There is no error, no warning; the data just returns.

**Why it happens:**
Developers enable RLS on core tables (`jobs`, `customers`) early and forget it on secondary tables added later. Migrations that add new tables don't auto-inherit RLS from other tables.

**Consequences:**
- Full cross-tenant data exposure: shop B owner reads shop A's internal notes, customer phone numbers, or payment records.
- GDPR/privacy liability. Customer PII (phone, email) is in scope.
- Impossible to detect from the client side — looks like a normal query.

**Prevention:**
- Run a migration check or CI lint that asserts `row_security = true` for every table in the public schema.
- Use a Supabase dashboard query as a deployment gate: `SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND rowsecurity = false;` — this must return zero rows.
- Template every new migration with `ALTER TABLE [name] ENABLE ROW LEVEL SECURITY;` as the first line after `CREATE TABLE`.

**Detection (warning signs):**
- A shop owner can see jobs they didn't create when filtering by their own shop_id.
- API responses contain more rows than expected for a filtered query.
- Running the query above in the Supabase SQL editor returns any table names.

**Phase mapping:** Must be addressed in Phase 1 (database schema / tenant foundation). Add the zero-RLS check to CI before any other feature work.

---

### Pitfall 2: RLS Policy Uses `auth.uid()` But Rows Don't Have a Direct `user_id` Column

**What goes wrong:**
The `jobs` table links to `shop_id`, not directly to `auth.uid()`. An RLS policy written as `auth.uid() = owner_id` fails silently or returns zero rows when the actual isolation key is `shop_id`, which must be looked up via a join to `shops`. Developers write the wrong policy, it "works" locally because they only test with one user, and the tenant boundary is never actually enforced.

**Why it happens:**
In multi-tenant SaaS, the ownership chain is: `auth.uid()` → `shops.owner_id` → `shop_id` on all other tables. RLS policies must traverse this join. Many tutorial examples show single-tenant policies (`auth.uid() = user_id`) which don't translate to multi-tenant schemas.

**Consequences:**
- Policy appears to work (no errors) but either returns zero rows or returns all rows depending on the comparison.
- A shop owner may be able to read or write another shop's jobs by manipulating the shop_id parameter on the client.

**Prevention:**
Write RLS policies using a subquery join:
```sql
-- On the jobs table
CREATE POLICY "shop_isolation" ON jobs
  FOR ALL
  USING (
    shop_id IN (
      SELECT id FROM shops WHERE owner_id = auth.uid()
    )
  );
```
Never use `shop_id = (SELECT id FROM shops WHERE owner_id = auth.uid() LIMIT 1)` — a user with two shops would be incorrectly restricted to one. Use `IN`, not `=`.

**Detection:**
- Write integration tests that authenticate as User A, insert a row for Shop A, authenticate as User B, and attempt to SELECT that row. Must return zero rows.
- Test UPDATE and DELETE cross-tenant, not just SELECT.

**Phase mapping:** Phase 1 (schema) — write tenant isolation tests before building any feature that reads data.

---

### Pitfall 3: Service Role Key Used in Client-Side or Edge Code — RLS Bypassed Entirely

**What goes wrong:**
The Supabase `service_role` key bypasses all RLS policies. If this key is used in a Next.js route handler that also accepts user-supplied `shop_id` parameters, any user can forge a request to access any shop's data by changing the shop_id in the request body. This is the most dangerous single mistake in a Supabase multi-tenant app.

**Why it happens:**
Developers use the service role key in server-side code because it "just works" without fighting RLS policies. Route handlers like `POST /api/jobs` accept `{ shop_id: "..." }` from the client and pass it straight through.

**Consequences:**
- Complete tenant isolation failure. Any user can CRUD any shop's data by guessing or enumerating shop UUIDs.
- No audit trail because the service key doesn't record the requesting user.

**Prevention:**
- Service role key: use ONLY in trusted server-side contexts (webhooks, background jobs, admin functions) where the calling identity is never user-supplied.
- For all user-facing API routes: use the `anon` or `authenticated` key + the user's JWT. Let RLS do the work.
- Never accept `shop_id` from the client request body as authoritative. Always derive shop_id server-side from `auth.uid()`.

```typescript
// WRONG — never do this in a route handler
const supabase = createClient(url, SERVICE_ROLE_KEY)
const { shop_id } = await req.json() // user-controlled input
await supabase.from('jobs').select().eq('shop_id', shop_id)

// RIGHT — derive shop_id from the authenticated user
const supabase = createServerClient(url, ANON_KEY, { cookies })
const { data: { user } } = await supabase.auth.getUser()
// RLS on shops table enforces that only the user's own shop is returned
const { data: shop } = await supabase.from('shops').select('id').single()
await supabase.from('jobs').select().eq('shop_id', shop.id)
```

**Detection:**
- Grep the codebase for `SERVICE_ROLE_KEY` usage and audit every callsite. Zero callsites should accept user-supplied tenant identifiers.

**Phase mapping:** Phase 1 (auth + API foundation). Establish the pattern before any feature uses it.

---

### Pitfall 4: Customer Portal Token Is Guessable or Reusable Without Expiry

**What goes wrong:**
The customer portal uses a token in the URL (`/portal/[token]`) with no auth. If the token is short, sequential, or uses a predictable format (e.g., job number + customer ID), an attacker can enumerate tokens and access other customers' portals — viewing personal info, photos, and paying/manipulating balances.

**Why it happens:**
Developers use `job.id` (a UUID) as the token, which seems random, but UUIDs are not cryptographically opaque — they're often version-4 (truly random) in Postgres, which is fine, but the bigger mistake is: the same token works forever, links get forwarded between family members, and there's no mechanism to detect abuse.

**Consequences:**
- Customer A sends their portal link to a friend who pays the balance — creating attribution and accounting confusion.
- A malicious actor with one valid token can attempt to enumerate nearby tokens.
- Payment on behalf of wrong customer with wrong card — chargeback risk.

**Prevention:**
- Generate tokens as 32-byte cryptographically random values (`crypto.randomBytes(32).toString('hex')`), stored separately from the job ID. Never expose the job's database ID in the URL.
- Store `portal_token` as a separate column (not the job's primary key).
- Add a `portal_token_expires_at` column. Tokens should expire after a configurable period (e.g., 90 days after job completion) or be re-issued on demand.
- Rate-limit portal token lookups at the edge (Vercel middleware) — max 20 requests/minute per IP.
- Log portal access (timestamp, IP, user agent) to `portal_access_log` for abuse detection. Never log the token itself.

**Detection:**
- Unusual access patterns from a single IP across many different portal URLs.
- Portal accessed from a geography inconsistent with the shop's customer base.

**Phase mapping:** Phase 2 (customer portal) — token generation strategy must be decided before the portal is built. Retrofitting this is painful.

---

### Pitfall 5: Stripe Webhook Processes Events Without Verifying the Signature — Replay/Spoof Attack

**What goes wrong:**
A Stripe webhook endpoint processes `payment_intent.succeeded` or `customer.subscription.updated` events without verifying the `Stripe-Signature` header. An attacker can POST fake events to the endpoint, triggering payment confirmations for jobs that were never actually paid, or falsely activating shop subscriptions.

**Why it happens:**
Developers test webhooks locally using Stripe CLI, which sends real-signed events. They forget to add signature verification in the actual handler. The endpoint "works" without verification — it just isn't secure.

**Consequences:**
- Fake `payment_intent.succeeded` marks jobs as paid without actual money.
- Fake `customer.subscription.created` grants shop access without a subscription.
- Replay attacks: valid old events re-sent to trigger duplicate state changes.

**Prevention:**
```typescript
// ALWAYS verify before any processing
import Stripe from 'stripe'
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(req: Request) {
  const body = await req.text() // must be raw text, not parsed JSON
  const sig = req.headers.get('stripe-signature')!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    return new Response('Invalid signature', { status: 400 })
  }
  // safe to process event now
}
```
- Store processed event IDs in a `stripe_events` table to prevent replay. Check before processing.
- Use separate webhook secrets for test vs. live mode.

**Phase mapping:** Phase 1 (Stripe integration foundation) — before any payment logic.

---

### Pitfall 6: Stripe Dual-Flow Confusion — Subscription Webhooks Trigger Customer Payment Logic (or Vice Versa)

**What goes wrong:**
MountTrack has two Stripe flows: (1) shop owner pays a monthly subscription (Stripe Billing), and (2) customers pay job balances via Payment Intents. Both flows fire events through the same webhook endpoint. Without explicit event-type routing, a `payment_intent.succeeded` from a customer payment can be mistaken for a subscription payment, or subscription invoice events can corrupt job payment records.

**Why it happens:**
Stripe sends all events to all registered webhooks. A single `payment_intent.succeeded` event doesn't self-identify which flow it belongs to. Developers handle the event type but forget to check the metadata to determine context.

**Consequences:**
- A customer payment is recorded as a subscription confirmation, leaving the shop's subscription status wrong.
- A subscription renewal accidentally marks a random job as paid.
- Double-processing if both flows use the same event handler.

**Prevention:**
- Tag all customer Payment Intents with metadata at creation time:
```typescript
const paymentIntent = await stripe.paymentIntents.create({
  amount: amountInCents,
  currency: 'usd',
  metadata: {
    flow: 'customer_payment',  // discriminator
    job_id: job.id,
    shop_id: job.shop_id,
    mount_track_version: '1',
  }
})
```
- In the webhook handler, route by `event.data.object.metadata.flow` before any business logic:
```typescript
switch (event.type) {
  case 'payment_intent.succeeded':
    const intent = event.data.object as Stripe.PaymentIntent
    if (intent.metadata.flow === 'customer_payment') {
      await handleCustomerPayment(intent)
    }
    // subscription-created PaymentIntents have no flow metadata — ignore them here
    break
  case 'invoice.paid':
    await handleSubscriptionRenewal(event.data.object as Stripe.Invoice)
    break
}
```
- Use separate Stripe webhook endpoints if complexity grows: `/api/webhooks/stripe-billing` and `/api/webhooks/stripe-payments`.

**Detection:**
- Jobs showing `paid` status with no associated payment record.
- Shop subscription status toggling unexpectedly after customer payments.

**Phase mapping:** Phase 2 (payments). Design metadata schema before writing any Payment Intent creation code.

---

### Pitfall 7: Partial Payment Accounting Drift — Balance Calculated from Payments Table Instead of Authoritative Source

**What goes wrong:**
When customers make partial payments, the "amount still owed" is calculated by summing the `payments` table: `quoted_price - SUM(payments.amount)`. Over time, this drifts due to: duplicate webhook deliveries (Stripe retries on 5xx), manual corrections, refunds processed outside the app, or failed transactions that get partially recorded. The displayed balance no longer matches the actual owed amount.

**Why it happens:**
Developers build the balance as a derived calculation from event-sourced payments rather than maintaining an authoritative ledger with explicit balance snapshots. Webhook idempotency is added as an afterthought.

**Consequences:**
- Shop owner sees "balance: $0" but customer actually owes $150.
- Customer pays twice because the portal shows the wrong remaining balance after a partial payment webhook fires twice.
- Month-end reports are wrong.

**Prevention:**
- Use an explicit ledger model, not a running sum. Each payment creates an immutable `payment_ledger` record. The current balance is always: `job.quoted_price - SUM(ledger WHERE type = 'payment') + SUM(ledger WHERE type = 'refund')`.
- Enforce idempotency: store `stripe_payment_intent_id` on every ledger record with a UNIQUE constraint. A duplicate webhook for the same payment_intent_id hits the constraint and is safely ignored.
- Never update a `balance` or `amount_paid` column directly — always append to the ledger and derive.
- Add a reconciliation view that cross-references Supabase ledger totals against Stripe's balance transaction API for the same date range. Run it in reports.

```sql
-- Unique constraint prevents duplicate webhook processing
ALTER TABLE payment_ledger
  ADD CONSTRAINT payment_ledger_intent_unique
  UNIQUE (stripe_payment_intent_id);
```

**Detection:**
- `job.quoted_price` minus ledger sum doesn't equal the balance shown in the UI.
- Two payment records with the same `stripe_payment_intent_id`.

**Phase mapping:** Phase 2 (payments). Design the ledger schema before building the partial payment UI.

---

### Pitfall 8: Twilio A2P 10DLC Registration Not Done — All SMS Blocked

**What goes wrong:**
In the US, sending application-to-person (A2P) SMS from a long code number without 10DLC registration results in carriers filtering or blocking 100% of messages silently. The Twilio send API returns HTTP 200 (accepted), but messages are never delivered. There is no bounce or error — they simply disappear at the carrier level.

**Why it happens:**
Developers test with their own phone number (which often receives messages before the filtering kicks in at scale), see "delivered" in Twilio logs, and ship. Registration is a business-process step, not a code step, and is easy to overlook during development.

**Consequences:**
- Zero customer notifications delivered in production. The entire value proposition (automatic customer updates) fails silently.
- Registration takes 2-4 weeks for approval. If discovered late, the launch is blocked.
- Some carriers block unregistered senders immediately; others throttle to ~1 message/day.

**Prevention:**
- Begin 10DLC registration as soon as MountTrack has a business EIN. Do not wait until the app is "ready to ship."
- Register: Brand (business info) → Campaign (use case: "mixed" or "customer care") → Phone number assignment.
- Include opt-out language in the first SMS sent to any customer: "Reply STOP to opt out."
- Add a database flag `sms_opt_out: boolean` per customer. Always check before sending.
- For development/testing: use Twilio test credentials or a separate registered number to avoid burning A2P campaign reputation.

**Detection:**
- Twilio message logs show "delivered to carrier" but customers report not receiving messages.
- Delivery rate drops below 60% in production (normal is >95% for registered senders).

**Phase mapping:** Phase 1 (infrastructure/accounts setup) — register before writing any SMS code.

---

### Pitfall 9: Twilio SMS Opt-Out Not Handled — TCPA Liability

**What goes wrong:**
Customers who reply STOP to a Twilio number are automatically opted out by Twilio at the carrier level, but if MountTrack's database doesn't reflect this, the owner sees the customer as "active" for notifications and may attempt to manually re-send. Additionally, if opt-out status isn't surfaced in the job detail, owners don't know why a customer stopped receiving notifications.

**Why it happens:**
Developers focus on the outbound send path and don't implement the inbound webhook that Twilio calls when an opt-out/opt-in reply is received.

**Consequences:**
- TCPA violations: re-sending to opted-out numbers after a STOP message is a federal compliance violation with statutory damages.
- Owner confusion: "Why didn't this customer get the stage change notification?"

**Prevention:**
- Implement Twilio's inbound SMS webhook (`/api/webhooks/twilio-inbound`). Handle STOP (set `sms_opt_out = true`) and START/UNSTOP (set `sms_opt_out = false`).
- Surface opt-out status in the job detail view so owners can see it and contact customers via other means.
- Validate Twilio webhook signatures on inbound webhooks (same pattern as Stripe signature verification).

**Phase mapping:** Phase 2 (notifications). Build opt-out handling at the same time as the first outbound SMS.

---

## Moderate Pitfalls

---

### Pitfall 10: Next.js App Router — Server Component Accidentally Exposes Service Key to Client Bundle

**What goes wrong:**
A Server Component uses `process.env.SUPABASE_SERVICE_ROLE_KEY` and then passes data (or the client itself) to a Client Component. Next.js can inadvertently serialize environment variables into the client bundle if they're part of a prop chain. The service key appears in the browser's JavaScript bundle.

**Prevention:**
- Prefix all secret keys with nothing — they must NOT start with `NEXT_PUBLIC_`. This prevents Next.js from exposing them.
- Never pass a Supabase client instance as a prop from Server to Client component.
- Audit the build output: `grep -r "SUPABASE_SERVICE" .next/static/` should return nothing.
- Use `server-only` package import in files that use the service key:
```typescript
import 'server-only'
```

**Phase mapping:** Phase 1 (Next.js project setup). Add the `server-only` package convention before writing any route handlers.

---

### Pitfall 11: Kanban Drag-and-Drop — Optimistic UI State Diverges from Database on Concurrent Edits

**What goes wrong:**
Owner A and Owner B (same shop, two browsers) both drag jobs simultaneously. Optimistic UI updates the local state immediately, but the database write for Owner A's drag conflicts with Owner B's drag. One update wins silently, the other is discarded, but the losing client's UI still shows the "optimistic" state until the next full refetch. The board shows different stage assignments in different browser tabs.

**Why it happens:**
Drag libraries (dnd-kit, react-beautiful-dnd) update local state immediately for UX responsiveness. Without real-time subscriptions syncing state back, the UI diverges.

**Consequences:**
- Two browsers show the same job in different stages.
- Owner makes decisions based on stale board state (e.g., triggers a payment for a job that's actually still in Mounting, not Ready for Pickup).

**Prevention:**
- Use Supabase Realtime subscriptions on the `jobs` table filtered by `shop_id`. Any database change — from any client — pushes an update to all connected clients.
- On drag completion: (1) update optimistic local state, (2) write to database, (3) if write fails, roll back the optimistic update and show an error toast.
- Add a `stage_updated_at` column. If the server returns a `stage_updated_at` newer than the local optimistic value, the server state wins.

**Detection:**
- Job appears in different stages when viewing the board in two browser windows simultaneously.

**Phase mapping:** Phase 2 (job board). Implement Realtime subscription before shipping the Kanban board.

---

### Pitfall 12: Bulk Stage Move — Race Condition on Multiple Jobs Updated Simultaneously

**What goes wrong:**
Owner selects 15 jobs and clicks "Move to Next Stage." The client fires 15 individual UPDATE requests in parallel. Under load, some succeed, some fail, and the board partially updates. There's no transactional guarantee — 7 jobs move, 8 stay, and the UI shows all 15 as moved (optimistic).

**Prevention:**
- Implement bulk stage updates as a single Supabase RPC (PostgreSQL function) that updates all rows in one transaction:
```sql
CREATE OR REPLACE FUNCTION bulk_move_jobs(job_ids uuid[], new_stage_id uuid, shop_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE jobs
  SET stage_id = new_stage_id, stage_updated_at = NOW()
  WHERE id = ANY(job_ids)
    AND jobs.shop_id = bulk_move_jobs.shop_id; -- RLS double-check inside function
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```
- The function uses `SECURITY DEFINER` but validates `shop_id` against `auth.uid()` internally.
- Return the count of updated rows; if it doesn't match `job_ids.length`, rollback and surface an error.

**Phase mapping:** Phase 2 (job board). Design the bulk-move RPC before building the multi-select UI.

---

### Pitfall 13: Photo Upload — Mobile Browser Memory Crash on Large Images

**What goes wrong:**
A shop owner on an iPhone takes a 12MP photo (15-25MB) and uploads it directly. The browser loads the full image into memory for preview, the tab crashes or the upload stalls, and the owner loses the in-progress job form state. This is especially bad at intake when the owner is filling out a full new job.

**Prevention:**
- Client-side resize before upload using `canvas.toBlob()` or a library like `browser-image-compression`. Target max 2MB / 1920px longest edge before sending to Supabase Storage.
- Never hold file references in React state across form steps — use a ref or process-and-discard pattern.
- Upload photos independently from the job form submission (fire immediately on file select, store returned storage path). If the form submission fails, the photo is already uploaded and can be associated on retry.
- Show per-photo upload progress indicators. Mobile connections are slow; owners need visual feedback to know the upload is happening.

**Phase mapping:** Phase 2 (job intake / photo upload). Mobile photo handling must be prototyped early — this is a discovered-at-demo bug category.

---

### Pitfall 14: Supabase Storage RLS — Photos Publicly Accessible Without Authentication

**What goes wrong:**
A Supabase Storage bucket is set to "public" for easy URL generation. This means any photo URL (which contains a UUID-based path) is accessible to anyone with the URL — no authentication required. For a taxidermy business, the photos are of customers' personal property (mounted animals, home addresses visible in some shots). This is a privacy issue.

**Prevention:**
- Use private buckets with signed URLs. Generate signed URLs server-side with a short expiry (e.g., 1 hour for the portal, 24 hours for the owner view):
```typescript
const { data } = await supabase.storage
  .from('job-photos')
  .createSignedUrl(`${shop_id}/${job_id}/${filename}`, 3600)
```
- Never expose the raw storage path to the client. Always route through a signed URL endpoint.
- For the customer portal (no auth): generate signed URLs server-side in the portal page's server component and embed them in the rendered HTML. Expiry of 1 hour is sufficient.

**Phase mapping:** Phase 2 (storage setup). Bucket privacy policy must be decided before the first photo upload feature.

---

### Pitfall 15: Stripe Customer Portal and Shop Subscription — Wrong Customer Object Associated

**What goes wrong:**
When a shop owner signs up, a Stripe Customer is created. If the owner's email changes in Supabase Auth but the Stripe Customer record isn't updated, the owner's subscription invoices go to the old email. More critically: if the Stripe Customer lookup is done by email at checkout (instead of a stored `stripe_customer_id`), and two owners share an email (e.g., a shared work email), they end up on the same Stripe Customer — sharing billing and subscription state.

**Prevention:**
- Always store `stripe_customer_id` on the `shops` table at the moment the Customer is created. Never look up a Customer by email in payment flows.
- Keep Stripe Customer email in sync via a webhook listener on `customer.updated` or a Supabase trigger on `shops.owner_email` changes.
- One Stripe Customer per shop (not per user) — this is the correct model for a shop-billed subscription.

**Phase mapping:** Phase 1 (subscription setup).

---

## Minor Pitfalls

---

### Pitfall 16: Estimated Completion Date Timezone Mismatch

**What goes wrong:**
The owner sets an estimated completion date in their local timezone (e.g., CST). The database stores it in UTC. The customer portal (which doesn't know the shop's timezone) displays the UTC date, which is one day off. A job due "November 15" shows as "November 14" on the customer's portal if they're east of the shop.

**Prevention:**
- Store dates as `date` (not `timestamp`) in PostgreSQL when timezone doesn't matter — this avoids UTC conversion entirely for date-only values.
- Or: store the shop's timezone in `shops.timezone` and always render dates in the shop's timezone on the portal.
- Never use JavaScript `new Date().toLocaleDateString()` without a timezone parameter.

**Phase mapping:** Phase 2 (customer portal).

---

### Pitfall 17: Resend Email — From Address Fails SPF/DKIM, Lands in Spam

**What goes wrong:**
Notifications are sent from `notifications@mounttrack.app` but the DNS records (SPF, DKIM, DMARC) are not configured on the sending domain. Emails land in spam or are rejected entirely, especially by Microsoft/Outlook.

**Prevention:**
- Configure SPF (`v=spf1 include:resend.com ~all`) and DKIM via Resend's domain verification flow before sending any production email.
- Use a subdomain for sending (e.g., `mail.mounttrack.app`) to protect the root domain reputation.
- Test deliverability with mail-tester.com before launch.

**Phase mapping:** Phase 1 (infrastructure) — DNS records take 24-48 hours to propagate, so configure early.

---

### Pitfall 18: Vercel Serverless Function Timeout on Stripe Webhook Processing

**What goes wrong:**
A Stripe webhook triggers a chain of operations: verify signature → update job → send SMS (Twilio) → send email (Resend) → update analytics. On the free Vercel tier, serverless functions time out after 10 seconds. The SMS/email calls can easily push the total to 12-15 seconds, causing a timeout. Stripe retries timed-out webhooks, leading to duplicate processing.

**Prevention:**
- Keep webhook handlers thin: verify, write to a `webhook_queue` table, return 200 immediately.
- Process the queue asynchronously with a background job (Supabase Edge Functions or a separate Vercel cron).
- Or upgrade to Vercel Pro (60s timeout) and still enforce idempotency for safety.

**Phase mapping:** Phase 2 (notifications + webhooks).

---

### Pitfall 19: Kanban — Stage Order Stored as Integer Position, Gaps Cause Re-numbering Bugs

**What goes wrong:**
Stages are stored with an `order` integer (1, 2, 3...). When the owner inserts a new stage between positions 2 and 3, all subsequent stages must be renumbered. This causes N UPDATE queries and race conditions if two owners reorder simultaneously.

**Prevention:**
- Use fractional indexing (e.g., Lexorank or a float-based order) for stage ordering. A new item between 2.0 and 3.0 gets 2.5, never requiring surrounding rows to update.
- Libraries: `fractional-indexing` (npm) handles the string-based variant used by Figma, Linear, and others.

**Phase mapping:** Phase 1 (schema design) — changing ordering strategy after data exists is a migration headache.

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Database schema design | RLS not enabled on all tables | Run zero-RLS check in CI before any feature work |
| Auth + API foundation | Service role key accepted with user-supplied shop_id | Derive shop_id from auth.uid() server-side only |
| Stripe subscription setup | Stripe Customer looked up by email | Store stripe_customer_id on shops table at creation |
| Customer portal | Token is guessable or has no expiry | Use 32-byte crypto random tokens with expiry |
| Photo upload (intake) | Large mobile photo crashes browser tab | Client-side compress before upload; upload independently from form |
| Storage bucket setup | Bucket set to public | Use private bucket + signed URLs; route through server |
| Payment intents | Dual-flow webhook confusion | Tag all customer PaymentIntents with flow metadata |
| Partial payments | Balance drift from duplicate webhook delivery | Ledger model + UNIQUE constraint on stripe_payment_intent_id |
| SMS notifications | A2P 10DLC not registered | Start registration at project kickoff, not at launch |
| SMS opt-out | STOP replies not processed | Implement inbound Twilio webhook on first SMS feature |
| Kanban drag-and-drop | Optimistic state diverges on concurrent edits | Supabase Realtime subscription syncs all clients |
| Bulk stage move | Race condition on 15 parallel UPDATEs | Single RPC PostgreSQL function for bulk move |
| Stage ordering | Integer positions require full re-numbering | Use fractional indexing (Lexorank) from schema design |
| Webhook processing | Vercel 10s timeout causes Stripe retries | Thin webhook handler → queue → async processor |
| Estimated dates | Timezone mismatch shifts date by one day | Store as DATE type or use shop timezone context |
| Email deliverability | SPF/DKIM not configured, land in spam | Configure DNS records in Phase 1 infrastructure |

---

## Sources

**Confidence note:** WebSearch, WebFetch, and Context7 tools were unavailable during this research session due to permission restrictions. All findings are based on training knowledge (cutoff August 2025) and direct expertise with this tech stack.

**Confidence by area:**

| Area | Confidence | Notes |
|------|------------|-------|
| Supabase RLS patterns | HIGH | Well-documented, stable API surface; patterns are foundational Postgres |
| Stripe dual-flow + webhooks | HIGH | Stripe webhook patterns are mature and well-documented |
| Twilio A2P 10DLC | MEDIUM | Regulatory environment evolves; verify current registration requirements at launch |
| Token-based portal security | HIGH | Standard web security practices; cryptographic token generation is stable |
| Photo upload mobile | HIGH | Browser API constraints are stable; canvas resize pattern is well-established |
| Kanban state sync | HIGH | React state management and Supabase Realtime patterns are stable |
| Partial payment ledger | HIGH | Accounting correctness pattern; Stripe idempotency keys are stable API |

**Recommended verification before implementation:**
- Twilio 10DLC: https://www.twilio.com/en-us/guidelines/a2p-10dlc (check current registration timeline and requirements)
- Supabase RLS: https://supabase.com/docs/guides/database/postgres/row-level-security
- Stripe webhook verification: https://docs.stripe.com/webhooks/signatures
- Stripe PaymentIntent metadata: https://docs.stripe.com/api/payment_intents/object#payment_intent_object-metadata
- Next.js server/client boundary: https://nextjs.org/docs/app/building-your-application/rendering/composition-patterns
