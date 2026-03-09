---
phase: 04-customer-portal
plan: "01"
subsystem: database
tags: [supabase, postgres, typescript, uuid, portal-token]

# Dependency graph
requires:
  - phase: 02-job-intake-board
    provides: jobs table with full schema, migration infrastructure
provides:
  - portal_token UUID column on jobs table (migration file — must be applied before Plan 04-02)
  - portal_token: string field on Job TypeScript interface
  - portal_token optional on jobs Insert shape (DB provides DEFAULT gen_random_uuid())
  - createServiceClient with persistSession: false to prevent session caching in unauthenticated renders
affects:
  - 04-02-portal-page
  - 04-03-portal-payment
  - any plan that reads or inserts jobs (portal_token is now on Job interface)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - UUID portal tokens as credential for unauthenticated customer portal access (no login required)
    - gen_random_uuid() DEFAULT on column — optional on Insert, guaranteed on Row
    - persistSession: false on service role client for safe server-only renders

key-files:
  created:
    - mounttrack/supabase/migrations/0003_portal_token.sql
  modified:
    - mounttrack/src/types/database.ts
    - mounttrack/src/lib/supabase/service.ts

key-decisions:
  - "portal_token uses UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE — DB guarantees uniqueness and auto-populates, no application code needed on job creation"
  - "Insert shape excludes portal_token from required fields (Omit) and adds it back as optional — prevents callers from being forced to provide a token that the DB handles automatically"
  - "Migration applied only via file creation — Supabase remote and local were both unavailable; migration must be applied (supabase db push) before Plan 04-02 executes"
  - "persistSession: false added to service client — prevents Supabase auth state from being inadvertently cached across unauthenticated portal server renders"

patterns-established:
  - "Portal credential pattern: UUID token in URL path, looked up with service client (bypasses RLS), no user login required"

requirements-completed: [PORTAL-01, PORTAL-02]

# Metrics
duration: 2min
completed: 2026-03-09
---

# Phase 4 Plan 01: Portal Token Foundation Summary

**UUID portal_token column added to jobs via SQL migration, Job TypeScript interface updated with type-safe portal_token field, and service client hardened with persistSession: false for safe unauthenticated renders**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-09T22:59:33Z
- **Completed:** 2026-03-09T23:01:47Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- Created migration `0003_portal_token.sql` with `ALTER TABLE jobs ADD COLUMN portal_token UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE` and `CREATE INDEX jobs_portal_token_idx`
- Added `portal_token: string` to `Job` interface and made it optional on the `Insert` shape so existing job creation code needs no changes
- Added `{ auth: { persistSession: false } }` to `createServiceClient` to prevent Supabase auth session from being inadvertently cached in unauthenticated portal server-side renders

## Task Commits

Each task was committed atomically:

1. **Task 1: DB migration — add portal_token column to jobs** - `e9fce5e` (chore)
2. **Task 2: Update TypeScript types + harden service client** - `a708f86` (feat)

**Plan metadata:** _(docs commit to follow)_

## Files Created/Modified

- `mounttrack/supabase/migrations/0003_portal_token.sql` — ALTER TABLE + UNIQUE constraint + index + backfill UPDATE
- `mounttrack/src/types/database.ts` — portal_token: string on Job interface; portal_token optional on jobs Insert shape
- `mounttrack/src/lib/supabase/service.ts` — { auth: { persistSession: false } } third argument to createClient

## Decisions Made

- `portal_token` uses `UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE` — DB guarantees uniqueness and auto-populates; no application code needed on job creation
- Insert shape excludes `portal_token` from required fields (`Omit`) and re-adds it as optional — prevents callers from being forced to provide a token the DB handles automatically
- `persistSession: false` added to service client — prevents Supabase auth state from being inadvertently cached across unauthenticated portal server renders

## Deviations from Plan

### Migration Not Applied

Migration file was created as specified. Both `supabase db push` (no remote link) and `supabase migration up --local` (no local Supabase running) returned connection errors. Per plan instructions, the file was created and the deviation is documented here.

**Action required before Plan 04-02:** Run `cd mounttrack && npx supabase db push` after linking the project (`npx supabase link --project-ref <ref>`), or run `npx supabase start` then `npx supabase migration up --local` for local development.

---

**Total deviations:** 0 auto-fix deviations. Migration application blocked by infrastructure (no local or linked remote Supabase).
**Impact on plan:** Migration file is correct and complete. TypeScript types and service client changes are fully applied and verified. Plan 04-02 cannot execute until migration is applied.

## Issues Encountered

- Supabase not linked to remote project and local Supabase not running — migration file created, application deferred. TypeScript-only changes (database.ts, service.ts) completed normally.
- Pre-existing TypeScript error in `.next/dev/types/validator.ts` (Next.js generated file, BillingState type mismatch on stripe portal route) — out of scope, predates this plan.

## User Setup Required

**Before Plan 04-02 can execute:** Apply the migration to the database.

Option A (remote):
```bash
cd mounttrack
npx supabase link --project-ref <your-project-ref>
npx supabase db push
```

Option B (local):
```bash
cd mounttrack
npx supabase start
npx supabase migration up --local
```

Verify: `SELECT portal_token FROM jobs LIMIT 1;` should return a UUID value.

## Next Phase Readiness

- TypeScript types fully updated — `Job` interface has `portal_token: string`, all downstream plans have type safety
- Service client hardened — portal server renders can safely use `createServiceClient()` without session bleed
- Migration file ready — blocked only on Supabase connection; no code changes needed

---
*Phase: 04-customer-portal*
*Completed: 2026-03-09*
