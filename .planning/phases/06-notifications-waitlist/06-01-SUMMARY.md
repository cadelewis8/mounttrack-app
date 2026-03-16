---
phase: 06-notifications-waitlist
plan: "01"
subsystem: database
tags: [postgres, supabase, typescript, twilio, resend, react-email, migrations, rls]

# Dependency graph
requires:
  - phase: 05-payments
    provides: payments table and schema patterns for Phase 6 to build on

provides:
  - sms_opted_out boolean column on jobs table (NOT NULL DEFAULT false)
  - notifications table with shop_id, job_id (nullable), channel, type, stage_name, sent_at + RLS
  - waitlist table with shop_id, name, phone, animal_type, created_at + RLS
  - Job TypeScript interface extended with sms_opted_out field
  - Notification and WaitlistEntry TypeScript interfaces exported from database.ts
  - Database interface extended with notifications and waitlist table definitions
  - twilio, resend, @react-email/components, react-email installed in package.json

affects:
  - 06-02 (SMS notification sending uses notifications table + sms_opted_out)
  - 06-03 (waitlist management UI uses waitlist table)

# Tech tracking
tech-stack:
  added:
    - twilio@^5.13.0 (SMS sending)
    - resend@^6.9.3 (transactional email)
    - "@react-email/components@^1.0.9" (email templates)
    - react-email@^5.2.9 (email preview dev tool)
  patterns:
    - job_id nullable FK pattern for notifications without an associated job (waitlist_confirm type)
    - RLS policy using shop_id = auth.uid() on new tables (consistent with existing pattern)

key-files:
  created:
    - mounttrack/supabase/migrations/20260314000001_phase6_notifications_waitlist.sql
  modified:
    - mounttrack/src/types/database.ts
    - mounttrack/package.json

key-decisions:
  - "job_id on notifications table is nullable (no NOT NULL) — waitlist_confirm notifications exist before any job is created"
  - "Pre-existing TypeScript error in .next/dev/types/validator.ts is a generated cache artifact unrelated to source changes — confirmed pre-existed before these changes"

patterns-established:
  - "Notification.job_id: string | null — nullable FK pattern for cross-cutting notification types"
  - "notifications/waitlist tables follow same RLS shop isolation pattern as all other tables"

requirements-completed:
  - NOTIF-01
  - NOTIF-02
  - NOTIF-03
  - NOTIF-04
  - WAIT-01
  - WAIT-02

# Metrics
duration: 3min
completed: 2026-03-16
---

# Phase 6 Plan 01: Notifications & Waitlist Schema Summary

**Supabase migration adding sms_opted_out to jobs + notifications table (job_id nullable) + waitlist table with RLS, TypeScript interfaces for both, and twilio/resend/react-email packages installed**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-16T11:10:59Z
- **Completed:** 2026-03-16T11:13:59Z
- **Tasks:** 2
- **Files modified:** 3 (plus package-lock.json)

## Accomplishments

- Migration SQL created with sms_opted_out column, notifications table (job_id nullable FK), and waitlist table — both with RLS policies using `shop_id = auth.uid()`
- TypeScript types extended: Job.sms_opted_out, Notification interface (job_id: string | null), WaitlistEntry interface, Database Tables extended with notifications and waitlist
- twilio, resend, @react-email/components, react-email installed — ready for Plans 02 and 03

## Task Commits

Each task was committed atomically:

1. **Task 1: Supabase migration** - `fd59b1f` (chore)
2. **Task 2: TypeScript types + npm install** - `8f3f4a8` (feat)

## Files Created/Modified

- `mounttrack/supabase/migrations/20260314000001_phase6_notifications_waitlist.sql` - Phase 6 schema: sms_opted_out + notifications + waitlist tables
- `mounttrack/src/types/database.ts` - Job.sms_opted_out added, Notification and WaitlistEntry interfaces, Database tables extended
- `mounttrack/package.json` - twilio, resend, @react-email/components, react-email added

## Decisions Made

- `job_id` on notifications is nullable (no NOT NULL constraint) — `waitlist_confirm` type notifications are sent before a job exists for a customer; this is the only nullable FK in the notifications table
- Kept `Database['public']['Tables']['jobs'].Update` as `Partial<Omit<Job, 'id' | 'shop_id' | 'created_at' | 'is_overdue'>>` unchanged — sms_opted_out is already included via Partial so no exclusion update needed

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- `npx supabase db push` requires either Docker (local dev) or `SUPABASE_ACCESS_TOKEN` (remote) — neither was available. The migration SQL file is the primary artifact; the developer must apply it via the Supabase dashboard SQL editor or CLI with their access token. This matches the pattern used in all prior phase migrations (they were committed then applied manually).

## User Setup Required

The migration must be applied manually:

1. Open Supabase dashboard at https://supabase.com/dashboard/project/twboxxlisrqquprdyioo
2. Go to SQL Editor
3. Copy and run the contents of `mounttrack/supabase/migrations/20260314000001_phase6_notifications_waitlist.sql`

OR run with the Supabase CLI once logged in:
```bash
cd mounttrack && supabase login && supabase link --project-ref twboxxlisrqquprdyioo && npx supabase db push
```

## Next Phase Readiness

- Schema foundation complete for Phase 6 Plans 02 (SMS notifications) and 03 (waitlist management)
- TypeScript types ready — no additional type changes needed for Plans 02/03
- npm packages installed and available for import
- Blocker: Twilio A2P 10DLC registration (2-4 weeks) — must be initiated now if SMS delivery is needed in production

---
*Phase: 06-notifications-waitlist*
*Completed: 2026-03-16*
