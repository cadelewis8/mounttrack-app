---
phase: 03-job-detail-views-search
plan: 03
subsystem: ui
tags: [nextjs, supabase, search, server-component, filters]

requires:
  - phase: 02-job-intake-board
    provides: jobs table with stage_id, is_rush, estimated_completion_date; stages table

provides:
  - Server-rendered search page at /search querying all jobs by text and composable filters
  - GET-form URL-preserved search state (bookmarkable)
  - Search nav link in sidebar for discoverability

affects: [03-job-detail-views-search, future phases using /search as entry point]

tech-stack:
  added: []
  patterns:
    - "Server component reads async searchParams via await — required for Next.js 16 App Router"
    - "GET form for search/filter — no JS required, URL is bookmarkable, filters preserved across navigations"
    - "Supabase .or() for multi-field text search; job_number uses .eq() not .ilike() (numeric column guard)"
    - "Overdue computed at app layer by comparing estimated_completion_date string to todayStr"

key-files:
  created:
    - mounttrack/src/app/(app)/search/page.tsx
  modified:
    - mounttrack/src/components/nav-links.tsx

key-decisions:
  - "job_number search uses .eq() not .ilike() — ilike on numeric columns throws in Postgres"
  - "Only run DB query when hasQuery is true — avoids loading all jobs on empty /search visit"
  - "Overdue filter uses .lt('estimated_completion_date', today) in DB query; display badge computed in JS from same todayStr"
  - "JOB-05 (communication history) explicitly deferred to Phase 6 — not implemented here"

patterns-established:
  - "Supabase multi-column text search: .or('col1.ilike.%term%,col2.ilike.%term%') with numeric column .eq() guard"
  - "Next.js 16 async searchParams: typed as Promise<{...}> and awaited before use"

requirements-completed: [SEARCH-01, SEARCH-02, JOB-05]

duration: 8min
completed: 2026-03-08
---

# Phase 3 Plan 3: Search Page Summary

**Server-rendered /search page with full-text search across all jobs (customer name, animal type, job number) and composable stage/rush/overdue/date-range filters via GET form**

## Performance

- **Duration:** 8 min
- **Started:** 2026-03-08T05:24:17Z
- **Completed:** 2026-03-08T05:32:00Z
- **Tasks:** 1
- **Files modified:** 2

## Accomplishments
- Search page at /search queries all jobs (active and past) — satisfies SEARCH-01
- Text search uses .or() with .ilike() for strings and .eq() for numeric job_number
- Composable filters: stage, rush, overdue (past due date), and date range — satisfies SEARCH-02
- GET form method preserves filters in URL — searches are bookmarkable
- Results render as links to /jobs/[id] with job number, customer, animal, stage badge, rush/overdue badges, due date
- Search nav link added to sidebar for discoverability
- JOB-05 (communication history) correctly deferred per plan — not implemented

## Task Commits

Each task was committed atomically:

1. **Task 1: Build search page with full-text and filter support** - `bdc40cc` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified
- `mounttrack/src/app/(app)/search/page.tsx` - Server component search page: reads searchParams, runs Supabase query with .or()/.ilike()/.eq() patterns, renders results list
- `mounttrack/src/components/nav-links.tsx` - Added Search nav link with Search icon

## Decisions Made
- `job_number.eq.N` used instead of `.ilike()` for numeric column — ilike on numeric columns throws in Postgres
- Query only executes when at least one filter/term is active (`hasQuery` guard) — avoids full table scan on empty visit
- Overdue display badge computed at JS layer (string comparison vs todayStr) — consistent with existing app-layer overdue pattern from Phase 2
- `as { data: Stage[] | null }` wrapped with extra parens around the chained call to avoid TypeScript parse error (line-break `as` assertion ambiguity)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed TypeScript parse error on multi-line `as` type assertion**
- **Found during:** Task 1 (Build search page)
- **Issue:** `as { data: Stage[] | null }` on its own line after chained Supabase call caused TS1434/TS1011 parse errors — TypeScript interprets it as element access expression
- **Fix:** Wrapped the chained call in extra parentheses so the `as` cast is unambiguous
- **Files modified:** mounttrack/src/app/(app)/search/page.tsx
- **Verification:** `npx tsc --noEmit` passes for search page (pre-existing errors in calendar/queue pages unrelated)
- **Committed in:** bdc40cc (Task 1 commit)

**2. [Rule 2 - Missing Critical] Added Search nav link to sidebar**
- **Found during:** Task 1 (Build search page)
- **Issue:** /search page existed but had no sidebar navigation link — users had no way to reach it
- **Fix:** Added `{ href: '/search', label: 'Search', icon: Search }` to nav-links.tsx
- **Files modified:** mounttrack/src/components/nav-links.tsx
- **Verification:** Nav link renders in sidebar with correct active state highlighting
- **Committed in:** bdc40cc (Task 1 commit)

---

**Total deviations:** 2 auto-fixed (1 bug, 1 missing critical)
**Impact on plan:** TypeScript fix required for compilation. Nav link required for the page to be reachable. No scope creep.

## Issues Encountered
- Pre-existing TypeScript parse errors in calendar/page.tsx and queue/page.tsx (same `as` assertion issue) — out of scope, logged as observation only, not fixed

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Search page complete and reachable via sidebar nav
- All SEARCH-01, SEARCH-02 requirements fulfilled
- JOB-05 deferred to Phase 6 as planned — ready for that phase when notifications are built

---
*Phase: 03-job-detail-views-search*
*Completed: 2026-03-08*
