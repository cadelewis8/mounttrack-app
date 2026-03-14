---
phase: 05-payments
plan: 02
subsystem: api
tags: [stripe, nextjs, typescript, webhooks, payments]

# Dependency graph
requires:
  - phase: 05-payments plan 01
    provides: payments table DDL, Payment TypeScript type, proxy exemption for /api/create-payment-session
  - phase: 04-customer-portal
    provides: portal_token on jobs table — used as auth credential for unauthenticated payment session creation
provides:
  - POST /api/create-payment-session — validates portal token + amount, creates Stripe Checkout session, returns { url }
  - Extended webhook handler that discriminates subscription vs job payment events and inserts confirmed payments to DB
affects: [05-payments plan 03 (portal payment UI), 05-payments plan 04 (owner payment view), 05-payments plan 05 (dashboard stat)]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - stripe.checkout.sessions.create with mode:'payment' and price_data for variable-amount one-time payments
    - session.subscription presence check to discriminate subscription vs job payment webhook events
    - maybeSingle() idempotency pre-check before insert (DB UNIQUE constraint is the final guard)
    - Server-side financial amount re-validation — client-supplied amounts never trusted without DB recomputation

key-files:
  created:
    - mounttrack/src/app/api/create-payment-session/route.ts
  modified:
    - mounttrack/src/app/api/webhooks/stripe/route.ts

key-decisions:
  - "session.subscription discriminates checkout types — non-null for subscription checkouts, null for one-time job payments"
  - "Server re-validates amountCents against DB-computed remaining balance — client input treated as untrusted"
  - "$50 floor (5000 cents) enforced server-side, consistent with plan spec"
  - "payment_status !== 'paid' guard added before payments insert — handles async edge cases where webhook fires before payment fully settles"
  - "Idempotency: maybeSingle() lookup first, then DB UNIQUE constraint as final safety net"

patterns-established:
  - "createServiceClient() used in public API route (no session auth) — service role bypasses RLS for portal-originated requests"
  - "Stripe metadata carries both job_id and shop_id — webhook can insert to payments table without a join"

requirements-completed: [PAY-01, PAY-02]

# Metrics
duration: 2min
completed: 2026-03-14
---

# Phase 5 Plan 02: Stripe Checkout Session API + Webhook Extension Summary

**POST /api/create-payment-session with server-side balance validation, and extended Stripe webhook that routes job payments to the payments table with idempotency guard**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-03-14T02:19:42Z
- **Completed:** 2026-03-14T02:21:25Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Created `POST /api/create-payment-session` that validates portal token via DB lookup (service role), re-validates amount server-side against DB-computed remaining balance with $50 minimum, and creates a Stripe Checkout session returning `{ url }`
- Extended `checkout.session.completed` webhook case to discriminate subscription vs job payment via `session.subscription` presence, adding payment_status guard, idempotency pre-check, and payments table insert to the job payment branch
- Existing subscription webhook flow preserved completely unchanged

## Task Commits

Each task was committed atomically:

1. **Task 1: Create /api/create-payment-session route** - `7120882` (feat)
2. **Task 2: Extend webhook handler for job payment events** - `f08d0e9` (feat)

**Plan metadata:** (docs commit — see below)

## Files Created/Modified
- `mounttrack/src/app/api/create-payment-session/route.ts` - POST endpoint: portal token validation, server-side balance recomputation, Stripe Checkout session creation with mode:'payment'
- `mounttrack/src/app/api/webhooks/stripe/route.ts` - Extended checkout.session.completed case with subscription/payment discrimination, payment_status guard, idempotency check, and payments insert

## Decisions Made
- `session.subscription` is the discrimination key: truthy for subscription checkouts, null for one-time payments — no metadata field needed
- Server re-validates `amountCents` against `quoted_price * 100 - deposit_amount * 100 - SUM(payments.amount_cents)` — client-supplied amounts are never trusted
- `payment_status !== 'paid'` guard added before insert handles edge cases where webhook fires for incomplete payments
- Idempotency implemented as two-layer defense: `maybeSingle()` lookup to skip on webhook retry, plus DB-level `stripe_session_id UNIQUE` constraint as final guard

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required for these API changes. The payments table migration (from Plan 01) must be applied to Supabase before these routes will function in production.

## Next Phase Readiness
- Portal can now call POST /api/create-payment-session with portalToken + amountCents to receive a Stripe Checkout URL
- Webhook correctly inserts confirmed payments to the payments table after Stripe confirms
- Plan 03 (portal payment UI card) can proceed — it only needs the POST endpoint contract
- Plan 04 (owner payment history view) can proceed — it reads from the payments table
- Plan 05 (dashboard payment stat) can proceed — it SUM()s payments.amount_cents

---
*Phase: 05-payments*
*Completed: 2026-03-14*

## Self-Check: PASSED
- `mounttrack/src/app/api/create-payment-session/route.ts` — FOUND
- `mounttrack/src/app/api/webhooks/stripe/route.ts` — FOUND
- Commit `7120882` (Task 1) — FOUND
- Commit `f08d0e9` (Task 2) — FOUND
