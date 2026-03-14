---
phase: 05-payments
plan: 01
subsystem: database
tags: [supabase, stripe, postgres, typescript, rls]

# Dependency graph
requires:
  - phase: 04-customer-portal
    provides: portal_token on jobs table and public portal routing — required for payment session route exemption
provides:
  - payments table DDL with RLS, stripe_session_id UNIQUE idempotency constraint, and shop_id + job_id indexes
  - Payment TypeScript interface exported from database.ts, payments entry in Database.public.Tables
  - proxy.ts isPublicRoute extended to exempt /api/create-payment-session from auth gate
affects: [05-payments plan 02 (Stripe Checkout session API), 05-payments plan 03 (webhook handler), 05-payments plan 04 (portal UI), 05-payments plan 05 (dashboard stat)]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - payments table follows shop_isolation RLS pattern (shop_id = auth.uid()) consistent with shops/jobs/stages
    - stripe_session_id UNIQUE constraint as database-enforced idempotency key for webhook retries
    - amount_cents INTEGER — money always stored as integer cents, never float

key-files:
  created:
    - mounttrack/supabase/migrations/0005_payments_table.sql
  modified:
    - mounttrack/src/types/database.ts
    - mounttrack/src/lib/supabase/proxy.ts

key-decisions:
  - "payments table uses shop_id directly (not only via job FK) — enables dashboard SUM without join and satisfies RLS without traversal"
  - "No status field on payments — only confirmed payments inserted (webhook fires after Stripe confirms), so pending state is unnecessary"
  - "Deposit remains on job.deposit_amount; payments table stores only Stripe-confirmed transactions — balance formula is quoted_price - deposit_amount - SUM(payments.amount_cents)/100"
  - "/api/create-payment-session exempted via isPublicRoute (same pattern as /portal/) not via matcher exclusion — keeps exemption visible alongside other public route logic"

patterns-established:
  - "Payment type follows existing interface + Database.public.Tables pattern (same shape as Job, JobPhoto, etc.)"
  - "isPublicRoute multi-line OR pattern for grouping public routes"

requirements-completed: [PAY-01, PAY-02, PAY-05]

# Metrics
duration: 5min
completed: 2026-03-13
---

# Phase 5 Plan 01: Payments Foundation Summary

**payments table with RLS + idempotency constraint, Payment TypeScript type, and proxy exemption for the Stripe Checkout API route**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-03-14T02:11:03Z
- **Completed:** 2026-03-14T02:15:45Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Created `0005_payments_table.sql` migration with shop_isolation RLS policy, stripe_session_id UNIQUE constraint, and both job_id + shop_id indexes
- Added `Payment` interface to `database.ts` and `payments` entry in `Database.public.Tables` with correct Insert/Update shapes
- Extended `isPublicRoute` in `proxy.ts` to exempt `/api/create-payment-session` from the auth gate, enabling unauthenticated portal requests to reach the API

## Task Commits

Each task was committed atomically:

1. **Task 1: Create payments table migration** - `dc7b4ff` (chore)
2. **Task 2: Add Payment type and exempt proxy route** - `e9c1832` (feat)

**Plan metadata:** (docs commit — see below)

## Files Created/Modified
- `mounttrack/supabase/migrations/0005_payments_table.sql` - DDL for payments table with RLS and indexes
- `mounttrack/src/types/database.ts` - Added Payment interface + payments entry in Database.public.Tables
- `mounttrack/src/lib/supabase/proxy.ts` - Extended isPublicRoute to include /api/create-payment-session

## Decisions Made
- payments table has shop_id directly (not only via job FK join) for efficient dashboard SUM and direct RLS compliance
- No `status` column — only confirmed payments are ever inserted (via webhook), so a status field adds no value
- Deposit amount stays on `jobs.deposit_amount` and is never mirrored in the payments table

## Deviations from Plan

None - plan executed exactly as written for file creation and TypeScript changes.

## Issues Encountered

**Migration application requires manual step.** The plan specified using "MCP execute_sql tool" to apply the migration to Supabase. No MCP Supabase tool, Supabase CLI auth token, or database password were available in this execution environment. The migration SQL file is correctly created at `mounttrack/supabase/migrations/0005_payments_table.sql`.

To apply the migration, one of these approaches works:
1. `npx supabase db push --linked` after `npx supabase login` (requires personal access token at supabase.com/dashboard/account/tokens)
2. Paste the SQL directly into the Supabase dashboard SQL editor for project `twboxxlisrqquprdyioo`
3. `npx supabase db push --db-url "postgresql://postgres:[DB_PASSWORD]@aws-0-us-east-1.pooler.supabase.com:5432/postgres"`

All TypeScript changes (database.ts + proxy.ts) are complete and compile without new errors.

## User Setup Required

**Apply the payments table migration to Supabase before running Plan 02.** The Stripe webhook handler and payment session API route both read from/write to `payments` — they will fail with "table not found" errors until the migration is applied.

**Option A (Dashboard):** Go to https://supabase.com/dashboard/project/twboxxlisrqquprdyioo/sql/new and paste the contents of `mounttrack/supabase/migrations/0005_payments_table.sql`

**Option B (CLI):** Run `npx supabase login` then `npx supabase link --project-ref twboxxlisrqquprdyioo` then `npx supabase db push`

**Verification:** After applying, confirm the payments table appears at https://supabase.com/dashboard/project/twboxxlisrqquprdyioo/editor

## Next Phase Readiness
- Payment type contract available for Plans 02-05 imports
- Proxy exemption in place — portal can POST to /api/create-payment-session without auth redirect
- Migration SQL is ready to apply (see User Setup Required above)
- Plan 02 (Stripe Checkout session API + webhook extension) can proceed immediately after migration is applied

---
*Phase: 05-payments*
*Completed: 2026-03-13*
