---
phase: 05-payments
verified: 2026-03-13T00:00:00Z
status: gaps_found
score: 9/11 must-haves verified
gaps:
  - truth: "A payment link is automatically sent to the customer via SMS and email when their job reaches 'Ready for Pickup' stage; the owner can also manually trigger a payment request"
    status: partial
    reason: "PAY-03 and PAY-04 delivery is stubbed as console.log. The trigger detection IS wired (stage name check, portal URL built) but no SMS or email is sent. This was a confirmed user decision to defer delivery to Phase 6 (Twilio/Resend). The ROADMAP Success Criterion 2 and REQUIREMENTS.md PAY-03 say 'automatically sent to the customer via SMS and email' — that literal outcome does not happen in Phase 5."
    artifacts:
      - path: "mounttrack/src/actions/jobs.ts"
        issue: "console.log stub only — no SMS or email sent (intentional Phase 6 deferral)"
      - path: "mounttrack/src/actions/payments.ts"
        issue: "console.log stub only — no SMS or email sent (intentional Phase 6 deferral)"
    missing:
      - "PAY-03/PAY-04 delivery will be completed in Phase 6 via Twilio SMS + Resend email — no action needed in Phase 5"
  - truth: "payments table exists in Supabase with RLS enforcing shop isolation"
    status: partial
    reason: "Migration SQL file exists and is correct DDL. Plan 01 SUMMARY explicitly documents the migration was NOT applied to Supabase (no MCP tool or Supabase CLI auth available during execution). The table may or may not exist in the live database — requires human verification."
    artifacts:
      - path: "mounttrack/supabase/migrations/0005_payments_table.sql"
        issue: "File exists and is correct, but SUMMARY documents migration was not applied automatically to Supabase"
    missing:
      - "Confirm payments table exists in Supabase project twboxxlisrqquprdyioo by checking the dashboard or running: SELECT table_name FROM information_schema.tables WHERE table_name = 'payments'"
human_verification:
  - test: "Confirm Supabase migration was applied"
    expected: "payments table visible at https://supabase.com/dashboard/project/twboxxlisrqquprdyioo/editor with stripe_session_id UNIQUE constraint and shop_isolation RLS policy active"
    why_human: "Plan 01 SUMMARY documents migration was not auto-applied. Cannot query live Supabase DB from this environment."
  - test: "Customer payment flow end-to-end"
    expected: "Visit portal with outstanding balance, enter amount >= $50, click Pay Now, redirect to Stripe Checkout, complete test payment, return to portal with ?payment=success, see success banner, see updated balance (PaymentCard hidden if fully paid)"
    why_human: "Requires live Stripe test mode and Supabase DB to be connected and seeded with a job"
  - test: "Dashboard Balance Due reflects Stripe payments"
    expected: "After a payment is recorded in the payments table, the dashboard Balance Due stat card and Outstanding Balance in Revenue Summary both show quoted - deposit - stripe_payments (not just quoted - deposit)"
    why_human: "Requires live DB with payment rows to verify formula is applied correctly in the rendered UI"
  - test: "'Ready for Pickup' trigger fires on stage move"
    expected: "Move a job to a stage named 'Ready for Pickup' on the Kanban board; server console logs '[PAY-03] Job {id} reached Ready for Pickup — payment link: {url}'"
    why_human: "Server-side console.log requires running app + Kanban interaction"
  - test: "Owner job detail Payments section displays correctly"
    expected: "Open a job with payments. See Payments SideCard showing quoted price, deposit, each Stripe payment with date, outstanding balance. Click 'Send Payment Request' and see server console log '[PAY-04]' entry."
    why_human: "Requires live DB with payment rows and running app"
---

# Phase 5: Payments Verification Report

**Phase Goal:** Customers can pay their balance (in full or partially) directly from their portal, and the owner has full visibility into every payment, deposit, and outstanding balance.
**Verified:** 2026-03-13
**Status:** gaps_found (2 gaps — 1 intentional Phase 6 deferral, 1 deployment concern)
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths (from ROADMAP Success Criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|---------|
| 1 | Customer can pay remaining balance via Stripe on the portal — full or partial | VERIFIED | PaymentCard component renders breakdown, amount input with $50 min / remaining max, calls /api/create-payment-session, redirects to Stripe Checkout URL |
| 2 | Payment link automatically sent when job reaches "Ready for Pickup"; owner can manually trigger from job detail | PARTIAL | Trigger detection wired in updateJobStage + sendPaymentRequest — but delivery is console.log stub, no SMS/email sent (Phase 6 deferral, confirmed by user) |
| 3 | Owner can view all payments, deposits, and outstanding balance per job | VERIFIED | PaymentsSection SideCard in job detail renders quoted/deposit/stripe-payments/outstanding formula |
| 4 | Owner dashboard shows total outstanding balance across all active jobs | VERIFIED | balanceDue = totalQuoted - totalDeposits - totalStripePaid computed from 3-query Promise.all; used in both "Balance Due" stat card and "Outstanding Balance" in Revenue Summary |

**Score:** 9/11 must-haves verified (see artifact-level detail below)

---

### Required Artifacts

| Artifact | Provides | Status | Details |
|----------|----------|--------|---------|
| `mounttrack/supabase/migrations/0005_payments_table.sql` | Payments table DDL with RLS, stripe_session_id UNIQUE, indexes | PARTIAL | File EXISTS, content correct; migration NOT confirmed applied to Supabase DB (see human verification) |
| `mounttrack/src/types/database.ts` | Payment interface + payments entry in Database.public.Tables | VERIFIED | Payment interface at line 77; payments Table at lines 128-132 with correct Insert/Update shapes |
| `mounttrack/src/lib/supabase/proxy.ts` | isPublicRoute exempts /api/create-payment-session | VERIFIED | Lines 42-43: `pathname.startsWith('/portal/') \|\| pathname.startsWith('/api/create-payment-session')` |
| `mounttrack/src/app/api/create-payment-session/route.ts` | POST endpoint: portal token validation, server-side balance recomputation, Stripe Checkout creation | VERIFIED | Exports POST; validates portal token; computes remaining server-side; enforces 5000 cent min; `mode: 'payment'`; metadata includes job_id/shop_id; returns `{ url }` |
| `mounttrack/src/app/api/webhooks/stripe/route.ts` | Extended webhook with subscription/payment discrimination and payments table insert | VERIFIED | `session.subscription` check discriminates; payment_status guard present; idempotency pre-check via maybeSingle(); inserts job_id, shop_id, stripe_session_id, stripe_payment_intent_id, amount_total to payments |
| `mounttrack/src/actions/jobs.ts` | updateJobStage extended with Ready for Pickup detection stub | PARTIAL | Detection wired (stage name fetch + portal_token fetch + conditional log); delivery is console.log only — intentional Phase 6 deferral per user confirmation in 05-03-PLAN.md line 94 |
| `mounttrack/src/app/(app)/dashboard/page.tsx` | Updated balanceDue subtracting confirmed Stripe payments | VERIFIED | paymentsRes added to Promise.all; totalStripePaid = reduce on amount_cents / 100; balanceDue = totalQuoted - totalDeposits - totalStripePaid; used at lines 104 (stat card) and 143 (Revenue Summary) |
| `mounttrack/src/components/portal/payment-card.tsx` | Client component: payment breakdown, amount input, Stripe redirect | VERIFIED | Exports PaymentCard; no paymentSuccess prop; breakdown shows quoted/deposit/prior-payments/remaining; validates min $50 + max remaining; POSTs to /api/create-payment-session; window.location.href = data.url |
| `mounttrack/src/app/portal/[token]/page.tsx` | Extended server page: payments query, success banner, PaymentCard rendering | VERIFIED | Accepts searchParams; queries payments table; computes remainingCents; success banner is standalone block (not inside remainingCents > 0 conditional); PaymentCard only rendered when remainingCents > 0 |
| `mounttrack/src/actions/payments.ts` | sendPaymentRequest server action | PARTIAL | Exports sendPaymentRequest; verifies job ownership; builds portal URL; console.log stub with TODO Phase 6 — delivery not implemented (intentional) |
| `mounttrack/src/app/(app)/jobs/[id]/page.tsx` + `job-detail-client.tsx` | Job detail payments query + PaymentsSection SideCard | VERIFIED | page.tsx queries payments table (line 51), passes jobPayments prop; client accepts jobPayments; PaymentsSection renders at line 427 inside SideCard "Payments" after "Customer Portal Link" |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|-----|-----|--------|---------|
| `payment-card.tsx` | `/api/create-payment-session` | `fetch POST { portalToken, amountCents }` | WIRED | handlePay calls fetch('/api/create-payment-session', { method: 'POST', body: JSON.stringify({portalToken, amountCents}) }); redirects via window.location.href = data.url |
| `portal/[token]/page.tsx` | payments table | `supabase.from('payments').select('amount_cents, paid_at').eq('job_id', job.id)` | WIRED | Lines 60-64; ordered by paid_at ascending; result used to compute remainingCents and passed as priorPayments to PaymentCard |
| `create-payment-session/route.ts` | `stripe.checkout.sessions.create` | `mode: 'payment'` with price_data and metadata.job_id | WIRED | stripe.checkout.sessions.create called with mode:'payment', price_data, metadata containing job_id/shop_id/portal_token/amount_cents |
| `webhooks/stripe/route.ts` | payments table | INSERT inside checkout.session.completed when session.subscription is null | WIRED | supabase.from('payments').insert({ job_id, shop_id, stripe_session_id, stripe_payment_intent_id, amount_cents: session.amount_total }) — idempotency pre-check via maybeSingle() before insert |
| `jobs.ts updateJobStage` | stages table | fetch stage name after update to check if 'Ready for Pickup' | WIRED | Parallel Promise.all fetches stage name and portal_token; conditional on stageRes.data?.name === 'Ready for Pickup' |
| `dashboard/page.tsx` | payments table | SUM query for shop_id | WIRED | supabase.from('payments').select('amount_cents').eq('shop_id', userId) in Promise.all; reduced client-side |
| `job-detail-client.tsx PaymentsSection` | sendPaymentRequest action | button onClick calls action with job.id | WIRED | import { sendPaymentRequest } at line 7; handleSendRequest calls sendPaymentRequest(job.id); result sets UI state |
| `jobs/[id]/page.tsx` | payments table | supabase.from('payments').select('amount_cents, paid_at').eq('job_id', job.id) | WIRED | Lines 51-57; passes jobPayments to JobDetailClient |

---

### Requirements Coverage

| Requirement | Description | Source Plans | Status | Evidence |
|-------------|-------------|-------------|--------|---------|
| PAY-01 | Customer can pay remaining balance via Stripe on customer portal | 05-01, 05-02, 05-04 | SATISFIED | PaymentCard + /api/create-payment-session + webhook — complete Stripe Checkout flow |
| PAY-02 | Customer can make partial payment (not required to pay full balance) | 05-01, 05-02, 05-04 | SATISFIED | Amount input accepts any value from $50 to remainingCents; server validates same bounds; partial payment recorded and deducted from balance on subsequent visits |
| PAY-03 | Payment link automatically sent via SMS and email when job reaches "Ready for Pickup" | 05-03 | PARTIAL | Trigger detection wired (updateJobStage detects stage name, builds portal URL) but delivery is console.log only. User confirmed deferral to Phase 6 in 05-03-PLAN.md ("PAY-03 user decision (confirmed): Wire trigger logic only...Real SMS/email delivery deferred to Phase 6"). Trigger point is established and functional. |
| PAY-04 | Owner can manually trigger payment request from job detail page at any time | 05-05 | PARTIAL | sendPaymentRequest action verifies ownership and builds portal URL; button wired in PaymentsSection; delivery is console.log only (same Phase 6 deferral as PAY-03). Trigger mechanism is functional for Phase 6 to replace. |
| PAY-05 | Owner can view all payments, deposits, and outstanding balance per job | 05-01, 05-05 | SATISFIED | PaymentsSection SideCard shows quoted price, deposit, each Stripe payment with formatted date, outstanding balance; data fetched from payments table in page.tsx |
| PAY-06 | Owner dashboard shows total outstanding balance across all active jobs | 05-03 | SATISFIED | balanceDue = totalQuoted - totalDeposits - totalStripePaid; shown in "Balance Due" stat card and "Outstanding Balance" in Revenue Summary; payments queried with shop_id filter |

---

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `mounttrack/src/actions/jobs.ts` | 207 | `console.log` — PAY-03 stub | INFO | Intentional Phase 6 placeholder; TODO Phase 6 marker present; portal URL is correct, just not delivered |
| `mounttrack/src/actions/payments.ts` | 28 | `console.log` — PAY-04 stub | INFO | Intentional Phase 6 placeholder; TODO Phase 6 marker present; ownership verification is real |
| `.next/dev/types/validator.ts` | 252 | Pre-existing TypeScript error in `/api/stripe/portal` route (BillingState not assignable to Response) | INFO | Pre-existing from Phase 1 (commit df384c3); not introduced by Phase 5; does not block Phase 5 functionality |

No blockers. The console.log stubs in jobs.ts and payments.ts are documented Phase 6 deferral points, not implementation failures.

---

### Human Verification Required

#### 1. Supabase Migration Applied

**Test:** Check Supabase project twboxxlisrqquprdyioo for the payments table. Options:
- Dashboard: https://supabase.com/dashboard/project/twboxxlisrqquprdyioo/editor
- SQL: `SELECT table_name, pg_tables.tablename FROM information_schema.tables WHERE table_name = 'payments'`
- Check RLS: `SELECT policyname FROM pg_policies WHERE tablename = 'payments'`

**Expected:** payments table exists with columns: id, shop_id, job_id, stripe_session_id (UNIQUE), stripe_payment_intent_id, amount_cents, paid_at. shop_isolation RLS policy active.

**Why human:** Plan 01 SUMMARY explicitly states "Migration application requires manual step" — no MCP tool, Supabase CLI auth, or DB password was available during execution. If table is missing, apply via Supabase dashboard SQL editor using `mounttrack/supabase/migrations/0005_payments_table.sql`.

#### 2. Customer Portal Payment Flow

**Test:** Using a test Stripe API key, visit a portal URL for a job with an outstanding balance. Enter $50 or more, click Pay Now.

**Expected:** Redirect to Stripe Checkout. Complete with test card 4242 4242 4242 4242. Return to portal with `?payment=success`. See green "Payment received — thank you!" banner. See updated balance in PaymentCard (or PaymentCard hidden if fully paid).

**Why human:** Requires live Stripe test mode, Supabase DB with payments table, and a seeded job with portal_token.

#### 3. Webhook Records Payment

**Test:** After completing a Stripe test checkout (from test 2 above), check the payments table.

**Expected:** New row inserted with correct job_id, shop_id, stripe_session_id (matching Stripe session ID), amount_cents, paid_at.

**Why human:** Requires Stripe webhook configured to point to the running app (or Stripe CLI webhook forwarding).

#### 4. Dashboard Balance Due Update

**Test:** With a payment row in the DB, open the owner dashboard.

**Expected:** Balance Due stat card shows quoted_price_sum - deposit_sum - stripe_payments_sum (not just quoted - deposit).

**Why human:** Requires live DB with payment rows.

#### 5. Ready for Pickup Trigger (PAY-03 Stub)

**Test:** Move a job to a stage named exactly "Ready for Pickup" on the Kanban board.

**Expected:** Server console shows: `[PAY-03] Job {id} reached "Ready for Pickup" — payment link: {url}`

**Why human:** Server-side console output requires running app with console access.

---

### Gaps Summary

**Gap 1 — PAY-03/PAY-04 delivery not yet implemented (intentional):**

The ROADMAP Success Criterion 2 and REQUIREMENTS.md say payment links are "automatically sent to the customer via SMS and email." Phase 5 wires the trigger detection and portal URL construction — but no SMS or email is sent. Both `updateJobStage` (PAY-03) and `sendPaymentRequest` (PAY-04) log to console with `TODO Phase 6` markers.

This was a deliberate user-confirmed decision documented in 05-03-PLAN.md line 94 and 05-RESEARCH.md lines 51, 65, 67. Phase 6 (Notifications) will complete these by replacing the console.log calls with Twilio SMS and Resend email delivery. The trigger architecture is correct and ready for Phase 6.

**Assessment:** This is a known partial implementation. The gap is scoped to Phase 6. No corrective action needed in Phase 5.

**Gap 2 — Migration applied status unknown:**

The payments table migration SQL is correctly authored and committed. The Plan 01 SUMMARY documents it was not applied to Supabase automatically. If the table does not exist in the live database, all payment functionality (Stripe webhook insert, portal balance query, dashboard balance formula, job detail payments section) will fail silently or with DB errors.

**Assessment:** Deployment prerequisite. Human must confirm table exists and apply if missing.

---

## Overall Assessment

Phase 5 achieves the core goal: the complete Stripe payment flow is implemented and wired. Customers can initiate payments from the portal (PAY-01, PAY-02 fully satisfied). Owners have payment visibility on job detail and dashboard (PAY-05, PAY-06 fully satisfied). The trigger mechanism for PAY-03 and PAY-04 is correctly wired into the codebase — Phase 6 only needs to replace `console.log` with Twilio/Resend calls.

All 10 committed artifacts are substantive (no stubs in payment-critical paths). All key links are wired. TypeScript compiles with one pre-existing Phase 1 error unrelated to Phase 5.

The two gaps are: (1) an intentional Phase 6 deferral that is fully documented and architecturally complete, and (2) a deployment prerequisite (migration must be confirmed applied to Supabase).

---

_Verified: 2026-03-13_
_Verifier: Claude (gsd-verifier)_
