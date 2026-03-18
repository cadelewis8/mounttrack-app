---
phase: 06-notifications-waitlist
plan: "03"
subsystem: feature
tags: [waitlist, sms, notifications, nav, job-detail]

# Dependency graph
requires:
  - phase: 06-notifications-waitlist/06-01
    provides: WaitlistEntry type, waitlist DB table, sms_opted_out column
  - phase: 06-notifications-waitlist/06-02
    provides: sendWaitlistSms function in notifications.ts

provides:
  - createWaitlistEntry server action (validates, inserts, sends SMS confirmation)
  - deleteWaitlistEntry server action (scoped delete by shop_id)
  - /waitlist page: Server Component page + WaitlistClient child with form + list
  - Waitlist nav link in sidebar (between Calendar and Search, Clock icon)
  - SMS opt-out badge on job detail page when sms_opted_out === true

affects:
  - sidebar navigation (all pages — nav-links.tsx)
  - job detail page (customer contact section)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Server Component page + WaitlistClient 'use client' child — same pattern as settings pages"
    - "useActionState for waitlist form feedback (error/success states)"
    - "useTransition for optimistic delete — server revalidation handles list update"

key-files:
  created:
    - mounttrack/src/actions/waitlist.ts
    - mounttrack/src/app/(app)/waitlist/page.tsx
    - mounttrack/src/app/(app)/waitlist/waitlist-client.tsx
  modified:
    - mounttrack/src/components/nav-links.tsx
    - mounttrack/src/app/(app)/jobs/[id]/job-detail-client.tsx

key-decisions:
  - "Animal type is a plain text input (not dropdown) — pre-intake context where animal may not match standard list"
  - "WaitlistClient receives initialEntries from Server Component — no separate fetch in client"
  - "SMS badge wraps Phone Field in flex column div — minimal DOM change, badge appears directly below input"
  - "deleteWaitlistEntry scoped with .eq('shop_id', userId) — RLS safety even if RLS is also active"

requirements-completed:
  - WAIT-01
  - WAIT-02
  - NOTIF-04

# Metrics
duration: 3min
completed: 2026-03-17
---

# Phase 6 Plan 03: Waitlist Management + SMS Opt-Out Badge Summary

**Waitlist page with 3-field add form, branded SMS confirmation, entry list with delete, and SMS opt-out badge on job detail**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-03-16T15:23:38Z
- **Completed:** 2026-03-16T15:25:44Z
- **Tasks:** 2 auto tasks + checkpoint:human-verify (approved 2026-03-17)
- **Files modified:** 5 (3 created, 2 modified)

## Accomplishments

- `createWaitlistEntry` and `deleteWaitlistEntry` server actions built following established patterns
- `/waitlist` page: Server Component fetches entries + passes to `WaitlistClient`
- `WaitlistClient` uses `useActionState` for form feedback (error + success states) and `useTransition` for delete
- Waitlist nav link added between Calendar and Search using `Clock` icon
- Amber "SMS opted out" badge rendered below phone field on job detail page when `job.sms_opted_out === true`

## Task Commits

Each task was committed atomically:

1. **Task 1: Waitlist server actions + /waitlist page + nav link** - `d0a2510` (feat)
2. **Task 2: SMS opt-out badge on job detail page** - `140e7b0` (feat)

## Files Created/Modified

- `mounttrack/src/actions/waitlist.ts` - Two server actions: createWaitlistEntry (validates 3 fields, inserts, sends SMS) + deleteWaitlistEntry (scoped by shop_id)
- `mounttrack/src/app/(app)/waitlist/page.tsx` - Server Component page: authenticates, fetches waitlist entries, renders WaitlistClient
- `mounttrack/src/app/(app)/waitlist/waitlist-client.tsx` - Client component: add form with useActionState + entry list with delete buttons
- `mounttrack/src/components/nav-links.tsx` - Added Waitlist link (Clock icon) between Calendar and Search
- `mounttrack/src/app/(app)/jobs/[id]/job-detail-client.tsx` - Added amber "SMS opted out" badge below phone field when sms_opted_out === true

## Decisions Made

- Animal type field is a plain `<input type="text">` — pre-intake context where owners haven't assessed the animal yet; dropdown would be too restrictive
- `WaitlistClient` receives `initialEntries` as a prop from the Server Component page rather than fetching client-side — cleaner SSR pattern
- Delete uses `useTransition` + server `revalidatePath('/waitlist')` — page re-renders with updated list after deletion
- Badge wraps existing `<Field>` component in a `flex flex-col` div — minimal structural change, badge appears cleanly below phone input

## Deviations from Plan

None - plan executed exactly as written.

## Checkpoint

Task 3 was a `checkpoint:human-verify` — approved 2026-03-17. All verification steps passed.

## User Setup Required

Inherited from Plan 02 — Twilio and Resend credentials must be set in `.env.local` for SMS to deliver. No new setup required for this plan.

## Next Phase Readiness

- Phase 6 (Notifications & Waitlist) is fully complete: NOTIF-01 through NOTIF-04 and WAIT-01, WAIT-02 all fulfilled
- Phase 7 (Reports, Supply, Post-Completion & Social) is the next planned phase
- Twilio A2P 10DLC registration still required for production SMS delivery

---
*Phase: 06-notifications-waitlist*
*Completed: 2026-03-17*
