---
phase: 04-customer-portal
plan: 02
subsystem: ui
tags: [next.js, react, tailwind, supabase, server-components, customer-portal]

# Dependency graph
requires:
  - phase: 04-customer-portal/04-01
    provides: portal_token UUID column on jobs, createServiceClient with persistSession:false, Job type updated
provides:
  - Public unauthenticated portal route at /portal/[token]
  - StageTimeline component — branded stage progression display
  - PortalHeader component — branded shop header with logo
  - PhotoGrid component — 2-col photo grid with native dialog lightbox
  - Server-side 7-day signed photo URL generation
affects: [04-customer-portal, 04-03, 04-04]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Portal page as Server Component sibling of (app)/ — auth gate never fires
    - CSS custom property --brand set on root div, consumed by child components via var(--brand) / [var(--brand)]
    - Service client used in RSC for unauthenticated token lookup bypassing RLS
    - Native HTML <dialog> for lightbox — no library needed, Escape key and backdrop click supported
    - Uniform notFound() on any token lookup failure — no oracle for attackers

key-files:
  created:
    - mounttrack/src/app/portal/[token]/page.tsx
    - mounttrack/src/components/portal/stage-timeline.tsx
    - mounttrack/src/components/portal/portal-header.tsx
    - mounttrack/src/components/portal/photo-grid.tsx
  modified:
    - mounttrack/next.config.ts

key-decisions:
  - "Portal page placed at src/app/portal/[token]/ — sibling of (app)/ group so (app)/layout.tsx auth check never fires for portal requests"
  - "notFound() called on any token lookup failure — uniform 404 response prevents token oracle attacks"
  - "--brand CSS custom property set on portal root div — all child Server and Client Components consume it via Tailwind [var(--brand)] classes"
  - "Native <dialog> element for photo lightbox — zero dependencies, Escape key supported natively, backdrop click via onClick on dialog element"
  - "[Rule 2 - Missing] Added /sign/** to next.config.ts remotePatterns — signed photo URLs use different path than public logo URLs"

patterns-established:
  - "CSS custom property theming: set --brand on root div, consume in children with var(--brand)"
  - "Uniform 404 for invalid tokens: notFound() regardless of error type"
  - "Server-side signed URLs: generate in Server Component, pass as props to Client Components"

requirements-completed: [PORTAL-02, PORTAL-03, PORTAL-04, PORTAL-05, PORTAL-06, PORTAL-07, PORTAL-08]

# Metrics
duration: 2min
completed: 2026-03-09
---

# Phase 4 Plan 02: Customer Portal UI Summary

**Public branded customer portal at /portal/[token] — unauthenticated RSC token lookup with service client, 7-day signed photo URLs, and branded StageTimeline + PhotoGrid + PortalHeader components**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-09T23:04:03Z
- **Completed:** 2026-03-09T23:06:43Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments

- Portal route at `/portal/[token]` is a Server Component sibling of `(app)/` — the auth gate in `(app)/layout.tsx` never fires for portal visits
- Service client (service role key) used for unauthenticated token lookup; invalid/missing tokens return uniform 404 via `notFound()`
- Brand color injected as `--brand` CSS custom property on root div, consumed via `[var(--brand)]` Tailwind classes in all child components
- Photo lightbox implemented with native HTML `<dialog>` — no npm package needed, Escape key and backdrop click both close it natively

## Task Commits

1. **Task 1: Portal UI components** - `1ae7b55` (feat)
2. **Task 2: Portal Server Component page** - `5ac655d` (feat)

**Plan metadata:** (docs commit — see below)

## Files Created/Modified

- `mounttrack/src/app/portal/[token]/page.tsx` — RSC portal page: token lookup, signed URLs, branded render
- `mounttrack/src/components/portal/stage-timeline.tsx` — Server Component, ordered stage list with brand-colored current stage indicator and connector lines
- `mounttrack/src/components/portal/portal-header.tsx` — Server Component, branded header with shop logo (next/image) and shop name
- `mounttrack/src/components/portal/photo-grid.tsx` — Client Component ('use client'), 2-col thumbnail grid + native `<dialog>` lightbox
- `mounttrack/next.config.ts` — Added `/sign/**` remotePattern for Supabase signed photo URLs

## Decisions Made

- Portal page is a sibling of `(app)/` not inside it — this is the critical architectural requirement ensuring no auth redirect fires
- `notFound()` called uniformly for any job lookup failure — prevents oracle attacks where attackers could distinguish "invalid token" from "no job found"
- `--brand` CSS custom property approach allows Server Components (PortalHeader, StageTimeline) to use brand color without any client-side JS
- Native `<dialog>` for lightbox — `showModal()` handles focus trapping, Escape key, and backdrop accessibility automatically

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Added signed URL path to next.config.ts remotePatterns**
- **Found during:** Task 1 (Portal UI components)
- **Issue:** next.config.ts only allowed `/storage/v1/object/public/**` for next/image. Signed URLs use `/storage/v1/object/sign/**` — photos in PhotoGrid would fail to load with next/image hostname error
- **Fix:** Added second remotePattern entry for `*.supabase.co` with `/storage/v1/object/sign/**` pathname
- **Files modified:** mounttrack/next.config.ts
- **Verification:** TypeScript check passed; pattern matches Supabase signed URL format
- **Committed in:** `1ae7b55` (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 missing critical)
**Impact on plan:** Fix essential for portal photos to display. No scope creep.

## Issues Encountered

Pre-existing TypeScript error in `.next/dev/types/validator.ts` (Stripe billing portal route handler return type mismatch) — unrelated to portal UI work, left as-is per deviation rules scope boundary.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- All portal UI components built and TypeScript-clean
- Portal page is unauthenticated and renders correctly with service client
- Ready for 04-03 (portal share link / email delivery from job detail) and 04-04 (customer portal payment flow)

---
*Phase: 04-customer-portal*
*Completed: 2026-03-09*
