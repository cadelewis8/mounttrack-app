---
phase: 05-payments
plan: 03
subsystem: payments
tags: [stripe, supabase, dashboard, kanban, server-actions]

# Dependency graph
requires:
  - phase: 05-01
    provides: payments table with shop_id column and confirmed-only insert pattern
  - phase: 04-customer-portal
    provides: portal_token on jobs table and /portal/[token] route
provides:
  - updateJobStage "Ready for Pickup" detection stub with portal URL logging
  - Dashboard balanceDue formula subtracting confirmed Stripe payments
affects:
  - 06-notifications (Phase 6 will replace console.log with Twilio/Resend at the PAY-03 hook point)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "PAY-03 trigger stub: detect stage by name after update, fetch portal_token, log URL with TODO Phase 6 marker"
    - "Application-layer SUM: fetch amount_cents rows, reduce in JS (Supabase JS has no native SQL SUM)"
    - "Promise.all expanded to 3 queries: jobs + stages + payments for dashboard"

key-files:
  created: []
  modified:
    - mounttrack/src/actions/jobs.ts
    - mounttrack/src/app/(app)/dashboard/page.tsx

key-decisions:
  - "PAY-03 stub: match stage by name === 'Ready for Pickup' (v1 acceptable — owner rarely renames; silently skips if renamed, documented in TODO comment)"
  - "Two extra DB queries in updateJobStage (stage name + portal_token) fire on every stage change — acceptable for v1 non-hot-path"
  - "Application-layer reduce for payments SUM (not SQL SUM) — Supabase JS GenericSchema constraint makes SQL aggregates awkward with hand-written types"
  - "No JSX changes in dashboard — correcting the balanceDue formula automatically updates both Balance Due stat card and Outstanding Balance in Revenue Summary"

patterns-established:
  - "Trigger stub pattern: wire detection + URL construction now, replace console.log with delivery call in next phase"

requirements-completed: [PAY-03, PAY-06]

# Metrics
duration: 2min
completed: 2026-03-13
---

# Phase 5 Plan 03: Ready for Pickup Trigger + Dashboard Balance Formula Summary

**"Ready for Pickup" stage detection wired in updateJobStage (PAY-03 stub) and dashboard balanceDue corrected to subtract confirmed Stripe payments (PAY-06)**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-03-14T02:19:43Z
- **Completed:** 2026-03-14T02:21:11Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Extended `updateJobStage` to fetch stage name and portal_token after update, log the portal payment URL when stage is "Ready for Pickup" — Phase 6 only needs to replace the console.log with Twilio/Resend calls
- Updated dashboard `Promise.all` to include a third payments query for the shop's confirmed Stripe payments
- Corrected `balanceDue = totalQuoted - totalDeposits - totalStripePaid` — the Balance Due stat card and Outstanding Balance in Revenue Summary both reflect the accurate amount owed

## Task Commits

Each task was committed atomically:

1. **Task 1: Extend updateJobStage with Ready for Pickup trigger stub** - `94eb143` (feat)
2. **Task 2: Update dashboard balance formula to include Stripe payments** - `0a4bc92` (feat)

**Plan metadata:** (docs commit to follow)

## Files Created/Modified
- `mounttrack/src/actions/jobs.ts` - updateJobStage extended with PAY-03 stub: parallel fetch of stage name + portal_token, conditional log with TODO Phase 6 marker
- `mounttrack/src/app/(app)/dashboard/page.tsx` - payments query added to Promise.all, totalStripePaid computed via reduce, balanceDue formula corrected

## Decisions Made
- Stage name match uses string equality (`=== 'Ready for Pickup'`) — if owner renames this stage the trigger silently skips; acceptable for v1, documented in code comment
- Two extra Supabase queries per stage change: acceptable performance trade-off on this non-hot-path for v1
- Application-layer SUM for payments (reduce on amount_cents array) rather than SQL aggregate — avoids GenericSchema type complexity with Supabase JS hand-written types
- No JSX changes needed: `balanceDue` variable already consumed in both display locations, correcting the formula is sufficient

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- Pre-existing TypeScript error in `.next/dev/types/validator.ts` (stripe/portal route GET return type mismatch) confirmed present before changes — out of scope, deferred.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- PAY-03 hook point established: Phase 6 notifications plan can target the `console.log` in `updateJobStage` and replace with Twilio SMS + Resend email calls
- PAY-06 complete: dashboard financial figures are accurate once payments flow through Stripe webhook
- Phase 5 still needs: 05-04 (Stripe Checkout session creation) and 05-05 (webhook handler) to complete the end-to-end payment flow

---
*Phase: 05-payments*
*Completed: 2026-03-13*
