---
phase: 02-job-intake-board
plan: "01"
subsystem: database
tags: [supabase, postgres, rls, sql, typescript, migrations]

requires:
  - phase: 01-foundation
    provides: shops table, auth.uid() RLS pattern, update_updated_at trigger function

provides:
  - stages table with shop-scoped RLS and 6-stage default seeding trigger
  - jobs table with all intake fields, shop_id/stage_id FKs, and full RLS
  - job_number_seq table + get_next_job_number SECURITY DEFINER function
  - Stage, Job, JobNumberSeq TypeScript interfaces
  - Database interface extended with stages, jobs, job_number_seq, and Functions entry

affects:
  - 02-job-intake-board/02-02 (intake form — uses Job Insert type)
  - 02-job-intake-board/02-03 (Kanban board — uses Stage and Job types)
  - 02-job-intake-board/02-04 (stage manager — uses Stage CRUD types)
  - 02-job-intake-board/02-05 (job detail — uses Job type)

tech-stack:
  added: []
  patterns:
    - "SECURITY DEFINER function for counter operations that must bypass RLS (get_next_job_number)"
    - "AFTER INSERT trigger on parent table to seed child rows atomically (seed_default_stages)"
    - "ON DELETE RESTRICT on stage_id FK prevents orphaned jobs when stages are deleted"
    - "INSERT...ON CONFLICT DO UPDATE RETURNING for atomic gapless integer sequences"

key-files:
  created:
    - mounttrack/supabase/migrations/0002_jobs_stages.sql
  modified:
    - mounttrack/src/types/database.ts

key-decisions:
  - "job_number_seq uses INSERT...ON CONFLICT DO UPDATE (upsert) — atomic gapless sequence, no race conditions with high concurrency"
  - "get_next_job_number is SECURITY DEFINER — counter write must bypass RLS insert policy which would reject postgres-role writes"
  - "stage_id FK on jobs uses ON DELETE RESTRICT — stages with jobs cannot be deleted, prevents orphaned jobs on Kanban board"
  - "seed_default_stages trigger is SECURITY DEFINER — fires as postgres role so it can INSERT stages even before the shop owner's RLS session is established"
  - "is_overdue is not a DB column — marked as optional computed field in TypeScript only, to be derived in application layer"

patterns-established:
  - "SECURITY DEFINER: use for functions/triggers that must bypass RLS on behalf of a user action"
  - "Gapless sequence: INSERT...ON CONFLICT DO UPDATE RETURNING in SECURITY DEFINER function"
  - "Default seeding: AFTER INSERT trigger on parent table seeds child rows atomically"

requirements-completed: [INTAKE-04, BOARD-03]

duration: 5min
completed: 2026-03-06
---

# Phase 02 Plan 01: Job Intake Board Data Layer Summary

**Supabase migration establishing stages/jobs/job_number_seq schema with gapless job numbering, SECURITY DEFINER seeding trigger, and extended TypeScript database types**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-06T03:58:16Z
- **Completed:** 2026-03-06T04:03:56Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Migration file `0002_jobs_stages.sql` with 3 tables, 2 SECURITY DEFINER functions, 12 RLS policies, and storage bucket policies for job-photos
- Gapless per-shop job numbering via `get_next_job_number` using INSERT...ON CONFLICT atomic upsert
- Default Kanban stage seeding (6 stages) fires atomically on shop creation via AFTER INSERT trigger
- TypeScript Database interface extended with Stage, Job, JobNumberSeq types and get_next_job_number RPC signature

## Task Commits

Each task was committed atomically:

1. **Task 1: Write 0002_jobs_stages.sql migration** - `efc9430` (feat)
2. **Task 2: Extend src/types/database.ts with Stage, Job, JobNumberSeq** - `fd16a1e` (feat)

**Plan metadata:** (see final docs commit)

## Files Created/Modified
- `mounttrack/supabase/migrations/0002_jobs_stages.sql` - Complete Phase 2 schema: stages, job_number_seq, jobs, seed_default_stages trigger, get_next_job_number function, storage RLS
- `mounttrack/src/types/database.ts` - Added Stage, Job, JobNumberSeq interfaces; extended Database.Tables and Database.Functions

## Decisions Made
- `get_next_job_number` uses SECURITY DEFINER so the counter can be incremented regardless of RLS insert restrictions on job_number_seq
- `seed_default_stages` uses SECURITY DEFINER so default stages can be inserted during shop creation before the owner's RLS context is fully established
- `stage_id` FK on jobs uses ON DELETE RESTRICT (not CASCADE) — this is intentional and critical to prevent silent data loss when stages are deleted
- `is_overdue` is not stored in the DB — it is an optional TypeScript-only field, to be computed at the application layer based on `estimated_completion_date < CURRENT_DATE`

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

A pre-existing TypeScript error in `.next/dev/types/validator.ts` was discovered during Task 2 verification — the Stripe portal route `GET` handler (Phase 1) returns `Promise<BillingState>` instead of `Promise<Response>`. This is out of scope for this plan and logged to `deferred-items.md`.

## User Setup Required

The storage RLS policies for the `job-photos` bucket are included in the migration SQL, but the bucket itself must be created manually before running those policies:

1. Go to Supabase Dashboard > Storage > New bucket
2. Name: `job-photos`, set to **private** (not public)
3. Run the migration SQL (the `CREATE POLICY "photos_*"` statements at the bottom require the bucket to exist)

## Next Phase Readiness
- Schema contracts established — plans 02-02 through 02-05 can now run in parallel
- TypeScript types available for intake form (02-02), Kanban board (02-03), stage manager (02-04), and job detail (02-05)
- `get_next_job_number(p_shop_id)` RPC ready to call from intake form server action
- Supabase migration must be applied to the project before any downstream code will work at runtime

---
*Phase: 02-job-intake-board*
*Completed: 2026-03-06*
