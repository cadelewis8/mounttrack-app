---
phase: 04-customer-portal
plan: 03
subsystem: ui
tags: [react, nextjs, clipboard, portal, job-detail]

# Dependency graph
requires:
  - phase: 04-01
    provides: portal_token UUID column on jobs table + Job type updated with portal_token field
provides:
  - Customer Portal Link SideCard on job detail page showing full portal URL with one-click copy
affects: [04-04, 05-customer-payments, 06-notifications]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Inline client sub-component (CopyButton) within a 'use client' file — no separate file needed for small stateful UI"
    - "navigator.clipboard.writeText with transient confirmation state via setTimeout + useState"
    - "process.env.NEXT_PUBLIC_URL for base URL construction — not NEXT_PUBLIC_APP_URL"

key-files:
  created: []
  modified:
    - mounttrack/src/app/(app)/jobs/[id]/job-detail-client.tsx

key-decisions:
  - "page.tsx uses select('*') so portal_token is included automatically — no query change needed"
  - "CopyButton defined as module-level function in job-detail-client.tsx (already 'use client') rather than a separate file"
  - "portalUrl constructed client-side from NEXT_PUBLIC_URL env var + job.portal_token"

patterns-established:
  - "Inline CopyButton pattern: useState(false) + setTimeout(fn, 2000) for transient 'Copied!' UI"

requirements-completed: [PORTAL-01]

# Metrics
duration: 3min
completed: 2026-03-09
---

# Phase 4 Plan 3: Customer Portal Link Card Summary

**Portal URL with one-click clipboard copy surfaced in the job detail sidebar using job.portal_token from the existing select('*') query**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-09T23:04:05Z
- **Completed:** 2026-03-09T23:05:27Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments
- Added `CopyButton` inline component with 2-second "Copied!" confirmation feedback
- Added `portalUrl` constant constructed from `NEXT_PUBLIC_URL` + `job.portal_token`
- Added "Customer Portal Link" SideCard at the bottom of the right sidebar on the job detail page
- Confirmed `page.tsx` already uses `.select('*')` — no query changes needed

## Task Commits

Each task was committed atomically:

1. **Task 1: Ensure portal_token is selected + add portal link card to job detail** - `6d63620` (feat)

**Plan metadata:** (docs commit — see below)

## Files Created/Modified
- `mounttrack/src/app/(app)/jobs/[id]/job-detail-client.tsx` - Added CopyButton component, portalUrl constant, and Customer Portal Link SideCard in right sidebar

## Decisions Made
- `page.tsx` uses `.select('*')` so `portal_token` is already included in the job query — no modification needed
- `CopyButton` implemented as a module-level function within the existing `'use client'` file rather than a separate component file — keeps the change minimal and co-located
- Used `NEXT_PUBLIC_URL` (not `NEXT_PUBLIC_APP_URL`) as specified in the plan interfaces — this is the env var the project actually uses

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

A pre-existing TypeScript error exists in `.next/dev/types/validator.ts` related to the Stripe portal route handler returning `BillingState` instead of `Response`. This error predates this plan and is not caused by any changes here. No errors in project source files.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Portal link card is live on every job detail page
- Owner can copy and share the portal URL manually
- Ready for 04-04 (portal page UI) — the URL generated here will serve as the entry point
- SMS/email delivery of portal link is deferred to Phase 6 as planned

---
*Phase: 04-customer-portal*
*Completed: 2026-03-09*
