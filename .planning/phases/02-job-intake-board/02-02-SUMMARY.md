---
phase: 02-job-intake-board
plan: "02"
subsystem: ui
tags: [react, next.js, react-hook-form, zod, supabase-storage, react-dropzone, dnd-kit, server-actions]

requires:
  - phase: 02-job-intake-board
    provides: jobs table, stages table, get_next_job_number RPC, Job/Stage TypeScript types

provides:
  - /jobs/new route (Server Component page shell)
  - JobIntakeForm client component with react-hook-form + zod validation, all intake fields, Other dropdown handling
  - PhotoUploadZone component with react-dropzone, thumbnail previews, forwardRef uploadAll imperative handle
  - createJob server action: calls get_next_job_number RPC, inserts into jobs table, redirects to /board
  - getPhotoUploadUrls server action: generates signed upload URLs for Supabase Storage
  - toggleJobRush, updateJobStage, bulkMoveJobs server actions (pre-built for plans 02-03/02-04)

affects:
  - 02-job-intake-board/02-03 (Kanban board uses updateJobStage, bulkMoveJobs)
  - 02-job-intake-board/02-04 (Stage manager — no direct dependency)
  - 02-job-intake-board/02-05 (Job detail — reads jobs created by this form)

tech-stack:
  added:
    - "@dnd-kit/core@6.3.1 (installed for plans 02-03/02-04)"
    - "@dnd-kit/sortable@10.0.0"
    - "@dnd-kit/utilities@3.2.2"
    - "react-dropzone@15.0.0"
  patterns:
    - "forwardRef + useImperativeHandle for imperative photo upload trigger from parent form"
    - "Two-step photo upload: getPhotoUploadUrls (server) -> uploadToSignedUrl (client) -> createJob (server)"
    - "Zod v4 + react-hook-form: avoid z.coerce.number().or() unions; use z.string() with refine() for numeric fields to preserve type inference"
    - "zodResolver with Zod v4: remove .default() from schema booleans; use defaultValues in useForm instead"

key-files:
  created:
    - mounttrack/src/actions/jobs.ts
    - mounttrack/src/components/photo-upload-zone.tsx
    - mounttrack/src/components/job-intake-form.tsx
    - mounttrack/src/app/(app)/jobs/new/page.tsx
  modified:
    - mounttrack/package.json

key-decisions:
  - "PhotoUploadZone uses forwardRef + useImperativeHandle to expose uploadAll — parent form calls ref.current.uploadAll() in onSubmit before createJob"
  - "Photo paths captured from uploadAll return value (not onUploadComplete callback) so paths are always fresh at submit time"
  - "supabase.rpc() cast as any with explicit return type — same pattern as supabase.from() needed due to GenericSchema constraint"
  - "Zod v4 boolean fields: .default(false) removed from schema, defaults handled by useForm defaultValues — avoids zodResolver generic type mismatch"
  - "Numeric form fields (quoted_price) use z.string().refine() instead of z.coerce.number() — preserves TS inference through zodResolver with Zod v4"
  - "dnd-kit packages installed in this plan (02-02) to avoid repeated installs across parallel plans 02-03/02-04"

patterns-established:
  - "Two-step photo upload: server generates signed URLs, client uploads directly to Supabase Storage, paths passed to createJob"
  - "forwardRef + useImperativeHandle: canonical pattern for exposing async imperative APIs from child components"

requirements-completed: [INTAKE-01, INTAKE-02, INTAKE-03, INTAKE-05, INTAKE-06, INTAKE-07, INTAKE-08, SOCIAL-01]

duration: 6min
completed: 2026-03-06
---

# Phase 02 Plan 02: Job Intake Form Summary

**Single-page job intake form at /jobs/new with react-hook-form + zod validation, react-dropzone photo upload via Supabase Storage signed URLs, and server actions for job creation with atomic sequential numbering**

## Performance

- **Duration:** 6 min
- **Started:** 2026-03-06T13:54:04Z
- **Completed:** 2026-03-06T14:00:00Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Single-page intake form captures all 14 fields (customer name, phone, email, animal type, mount style, quoted price, deposit, completion date, referral source, rush flag, social consent, photos) on one page
- `PhotoUploadZone` with react-dropzone: thumbnail previews, PNG/JPG/HEIC accept, 5MB/10-file limits, `forwardRef + useImperativeHandle` for imperative `uploadAll` trigger
- `createJob` server action: calls `get_next_job_number` RPC atomically, resolves first stage for shop, inserts into jobs table, redirects to `/board`
- `getPhotoUploadUrls` server action: generates signed upload URLs; client uploads directly to Supabase Storage (no binary data through server actions)
- Pre-built `toggleJobRush`, `updateJobStage`, `bulkMoveJobs` for plans 02-03/02-04 to avoid future plan complexity
- dnd-kit packages installed alongside react-dropzone for plans 02-03/02-04 parallelism

## Task Commits

Each task was committed atomically:

1. **Task 1: Install dnd-kit and react-dropzone packages** - `d205d50` (chore)
2. **Task 2: Create server actions and intake form components** - `37be3e5` (feat)

**Plan metadata:** (see final docs commit)

## Files Created/Modified
- `mounttrack/package.json` - Added @dnd-kit/core, @dnd-kit/sortable, @dnd-kit/utilities, react-dropzone
- `mounttrack/src/actions/jobs.ts` - createJob, getPhotoUploadUrls, toggleJobRush, updateJobStage, bulkMoveJobs server actions
- `mounttrack/src/components/photo-upload-zone.tsx` - Drag-and-drop photo zone with forwardRef/useImperativeHandle
- `mounttrack/src/components/job-intake-form.tsx` - Full intake form with all fields, Other dropdown handling, photo integration
- `mounttrack/src/app/(app)/jobs/new/page.tsx` - Server Component page shell at /jobs/new

## Decisions Made
- `PhotoUploadZone` uses `forwardRef + useImperativeHandle` to expose `uploadAll` — this is the cleanest pattern for imperative async APIs from child components without prop drilling or global state
- `supabase.rpc()` cast as `(supabase as any).rpc()` with explicit return type — same pattern as `supabase.from() as any` established in Phase 1 due to Supabase JS v2 GenericSchema constraint
- Zod v4 + react-hook-form: `.default(false)` removed from boolean schema fields; defaults handled via `useForm({ defaultValues })` instead — avoids `zodResolver` generic type mismatch introduced by Zod v4's changed inference for `.default()`
- Numeric form fields use `z.string().refine()` instead of `z.coerce.number()` — Zod v4's `coerce` combined with `.or(z.literal(''))` unions causes `unknown` inference through `zodResolver`'s generics

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed supabase.rpc() TypeScript type mismatch**
- **Found during:** Task 2 (TypeScript compilation)
- **Issue:** `supabase.rpc('get_next_job_number', { p_shop_id: userId })` produced TS error "Argument of type '{ p_shop_id: string }' is not assignable to parameter of type 'undefined'" due to GenericSchema constraint in Supabase JS v2
- **Fix:** Cast as `(supabase as any).rpc(...)` with explicit `{ data: number | null; error: ... }` return type annotation
- **Files modified:** `mounttrack/src/actions/jobs.ts`
- **Verification:** `npx tsc --noEmit` passes
- **Committed in:** `37be3e5` (Task 2 commit)

**2. [Rule 1 - Bug] Fixed Zod v4 + zodResolver type incompatibility**
- **Found during:** Task 2 (TypeScript compilation)
- **Issue:** `z.coerce.number().or(z.literal(''))` caused `quoted_price: unknown` inference through `zodResolver` generics; `z.boolean().default(false)` caused `is_rush: boolean | undefined` mismatch
- **Fix:** Changed `quoted_price` to `z.string().refine(v => parseFloat(v) > 0)` for clean string inference; changed `deposit_amount` to `z.string().optional()`; removed `.default()` from boolean fields and moved defaults to `useForm({ defaultValues })`
- **Files modified:** `mounttrack/src/components/job-intake-form.tsx`
- **Verification:** `npx tsc --noEmit` passes with 0 new errors
- **Committed in:** `37be3e5` (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (2 Rule 1 bugs)
**Impact on plan:** Both fixes necessary for TypeScript correctness. No scope creep — same runtime behavior.

## Issues Encountered

The pre-existing TypeScript error in `.next/dev/types/validator.ts` (Stripe portal route returning `BillingState` instead of `Response`) was present before this plan. It is out of scope and previously logged to `deferred-items.md` in the 02-01-SUMMARY.md. Not introduced by this plan.

## User Setup Required

None — no new external service configuration required. Photo upload uses the `job-photos` Supabase Storage bucket created in Plan 02-01 setup instructions.

## Next Phase Readiness
- `/jobs/new` page and all server actions ready for runtime use once Supabase migration (02-01) is applied
- `toggleJobRush`, `updateJobStage`, `bulkMoveJobs` server actions pre-built for Kanban board (02-03)
- dnd-kit packages installed and ready for Kanban board drag-and-drop (02-03) and stage manager (02-04)
- Plans 02-03, 02-04, 02-05 can proceed in parallel

---
*Phase: 02-job-intake-board*
*Completed: 2026-03-06*
