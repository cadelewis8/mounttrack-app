---
phase: 03-job-detail-views-search
plan: 02
subsystem: ui
tags: [react-big-calendar, date-fns, next.js, queue, calendar, nav]

# Dependency graph
requires:
  - phase: 02-job-intake-board
    provides: Job type, stage_id FK, estimated_completion_date field, Supabase query patterns
provides:
  - /queue page: server-rendered job list ordered by estimated_completion_date ASC with per-stage counts
  - /calendar page: month-view calendar plotting jobs by due date with click-to-navigate
  - CalendarClient component: react-big-calendar wrapper with dateFnsLocalizer
  - Updated nav-links with Queue, Calendar, Search entries
affects: [04-customer-portal, 05-payments, search-feature]

# Tech tracking
tech-stack:
  added: [react-big-calendar@1.19.4, date-fns@2, @types/react-big-calendar]
  patterns:
    - Server component fetches jobs then passes serializable array to 'use client' CalendarClient
    - Promise<{ data: T[] | null }> cast pattern for supabase GenericSchema workaround
    - T00:00:00 appended to YYYY-MM-DD date strings to prevent UTC timezone shift on Date constructor
    - eventPropGetter for conditional event styling (overdue=red, rush=amber)

key-files:
  created:
    - mounttrack/src/app/(app)/queue/page.tsx
    - mounttrack/src/app/(app)/calendar/page.tsx
    - mounttrack/src/app/(app)/calendar/calendar-client.tsx
  modified:
    - mounttrack/src/components/nav-links.tsx
    - mounttrack/src/app/globals.css

key-decisions:
  - "Promise<{ data: T[] | null }> cast on supabase chained query (not inline `as` after chain) — inline `as` after method chain causes TS1434 parse error"
  - "T00:00:00 suffix on YYYY-MM-DD date strings in CalendarClient — prevents UTC offset shifting date to previous day in local timezone"
  - "Explicit height calc(100vh - 120px) on calendar container — react-big-calendar collapses to 0 without explicit height"
  - ".rbc-calendar box-sizing override in globals.css — Tailwind preflight resets box-sizing to content-box, breaking calendar cell borders"

patterns-established:
  - "Server/Client split: server page fetches + serializes data, 'use client' component handles interactivity (CalendarClient pattern)"
  - "is_overdue computed at app layer using todayStr string comparison — consistent with existing board pattern"

requirements-completed: [QUEUE-01, QUEUE-02, QUEUE-03]

# Metrics
duration: 3min
completed: 2026-03-08
---

# Phase 03 Plan 02: Queue and Calendar Views Summary

**React-big-calendar month view at /calendar and ordered due-date queue at /queue, with Queue, Calendar, Search links added to sidebar nav**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-08T22:23:54Z
- **Completed:** 2026-03-08T22:27:00Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- /queue: server-rendered list of all shop jobs ordered by estimated_completion_date ASC, with per-stage job count badge pills, rush/overdue inline badges, and links to /jobs/[id]
- /calendar: server fetch passing jobs to CalendarClient; CalendarClient renders react-big-calendar month/week view with overdue=red and rush=amber event coloring; clicking any event navigates to /jobs/[id] via useRouter
- nav-links.tsx: Queue (List icon), Calendar (CalendarDays icon), Search (Search icon) added between New Job and Settings

## Task Commits

Each task was committed atomically:

1. **Task 1: Install react-big-calendar and build Queue and Calendar pages** - `4b09447` (feat)
2. **Task 2: Add Queue, Calendar, Search links to sidebar nav** - `f45ff61` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified
- `mounttrack/src/app/(app)/queue/page.tsx` - Server component: jobs ordered by due date ASC, per-stage counts, rush/overdue badges
- `mounttrack/src/app/(app)/calendar/page.tsx` - Server component: fetches jobs, passes to CalendarClient with is_overdue computed
- `mounttrack/src/app/(app)/calendar/calendar-client.tsx` - 'use client' react-big-calendar wrapper with dateFnsLocalizer, eventPropGetter, onSelectEvent router.push
- `mounttrack/src/components/nav-links.tsx` - Added Queue (List), Calendar (CalendarDays), Search icons and links
- `mounttrack/src/app/globals.css` - Added .rbc-calendar box-sizing fix for Tailwind preflight conflict

## Decisions Made
- Used `Promise<{ data: T[] | null }>` cast on chained supabase queries rather than inline `as` after chain — inline `as` after a method chain body causes TS1434 parse error (keyword unexpected in that position)
- Appended `T00:00:00` to `YYYY-MM-DD` date strings before passing to `new Date()` to prevent UTC offset from shifting dates to the previous calendar day in local timezones

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed TypeScript parse error from inline `as` type assertion after chained query**
- **Found during:** Task 1 (TypeScript verification)
- **Issue:** Plan template used `as { data: T[] | null }` at end of chained `.order()` call — TypeScript parses this as TS1434 (unexpected keyword) inside the chain
- **Fix:** Wrapped the full chain in parentheses and cast as `Promise<{ data: T[] | null }>` matching the pattern already used in dashboard/page.tsx
- **Files modified:** queue/page.tsx, calendar/page.tsx
- **Verification:** `npx tsc --noEmit` shows zero errors in new files
- **Committed in:** 4b09447 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - Bug)
**Impact on plan:** Required fix for correct TypeScript compilation. No scope changes.

## Issues Encountered
- Pre-existing TS error in `mounttrack/src/app/api/stripe/portal/route.ts` (BillingState return type incompatible with Response) — out of scope, not caused by this plan, deferred.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- /queue and /calendar routes ready for owner use
- Nav links visible; /search link present in nav but /search page was built in plan 03-03
- react-big-calendar CSS included via direct import in calendar-client.tsx; rbc-calendar box-sizing fix applied globally

---
*Phase: 03-job-detail-views-search*
*Completed: 2026-03-08*
