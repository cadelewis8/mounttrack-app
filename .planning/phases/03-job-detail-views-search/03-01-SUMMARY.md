---
phase: 03-job-detail-views-search
plan: 01
subsystem: ui
tags: [react, supabase, next.js, photo-upload, server-actions]

# Dependency graph
requires:
  - phase: 02-job-intake-board
    provides: PhotoUploadZone component with forwardRef/uploadAll pattern; getPhotoUploadUrls server action; job detail page structure with SideCard components
provides:
  - addJobPhotos server action — appends new photo_paths to existing job array
  - Add Photos SideCard in job detail sidebar using PhotoUploadZone
affects: [04-customer-portal, 07-social-sharing]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "forwardRef + useImperativeHandle uploadAll pattern reused from Phase 2 PhotoUploadZone"
    - "addJobPhotos append pattern: fetch existing array, merge, update — preserves existing data"
    - "Photo upload UI delegates to PhotoUploadZone for drag/drop/preview; parent only calls uploadAll() then persists paths"

key-files:
  created: []
  modified:
    - mounttrack/src/actions/jobs.ts
    - mounttrack/src/app/(app)/jobs/[id]/job-detail-client.tsx

key-decisions:
  - "PhotoUploadZone onUploadComplete callback used (not onFilesSelected) — matched actual component interface discovered at execution time"
  - "Upload handler calls photoZoneRef.current.uploadAll() directly — paths returned from uploadAll() passed to addJobPhotos, onUploadComplete used to clear feedback state only"
  - "addJobPhotos fetches existing photo_paths before update to perform safe append — Supabase does not support array_append in hand-written types without any cast"

patterns-established:
  - "Append-safe photo update: always fetch then merge, never overwrite photo_paths"

requirements-completed: [JOB-01, JOB-02, JOB-03, JOB-04, SOCIAL-02]

# Metrics
duration: 12min
completed: 2026-03-08
---

# Phase 3 Plan 1: Job Detail Photo Upload Summary

**addJobPhotos server action appending photos to existing jobs, with PhotoUploadZone drag-drop widget in the detail page right sidebar**

## Performance

- **Duration:** 12 min
- **Started:** 2026-03-08T22:14:00Z
- **Completed:** 2026-03-08T22:26:10Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- New `addJobPhotos` server action fetches existing photo_paths, merges new paths, updates job row, and revalidates the detail page
- "Add Photos" SideCard added to job detail right sidebar using existing PhotoUploadZone component — consistent with Phase 2 upload UX
- Upload state (pending, error, success) managed locally; page revalidation via Next.js cache handles photo count refresh
- JOB-01 (edit fields), JOB-02 (est. completion date), JOB-04 (notes textarea) confirmed already implemented — no changes needed
- SOCIAL-02 confirmed satisfied by existing social_media_consent select field in Job Details section

## Task Commits

Each task was committed atomically:

1. **Task 1: Add addJobPhotos server action** - `5826844` (feat)
2. **Task 2: Add photo upload widget to job detail sidebar** - `d2b4e43` (feat)

**Plan metadata:** _(docs commit follows)_

## Files Created/Modified
- `mounttrack/src/actions/jobs.ts` - Added `addJobPhotos` export at bottom of file
- `mounttrack/src/app/(app)/jobs/[id]/job-detail-client.tsx` - Added imports, upload state, handlePhotoUpload function, and Add Photos SideCard

## Decisions Made
- `PhotoUploadZone` expects `onUploadComplete` (not `onFilesSelected` as noted in plan) — adapted to actual component interface discovered by reading the file; `onUploadComplete` used only to clear feedback state since `uploadAll()` return value provides the paths directly
- `addJobPhotos` fetches existing photo_paths before merging rather than using a Supabase array append RPC — consistent with existing pattern of `(supabase.from('jobs') as any)` with explicit return type assertion

## Deviations from Plan

None — plan executed as written. The only adaptation was matching `onUploadComplete` vs `onFilesSelected` prop name — the plan's task description noted "inspect the existing component's interface before writing the import" and instructed to adapt accordingly. This was expected behavior, not a deviation.

## Issues Encountered
- Pre-existing TypeScript errors in untracked files (`calendar/page.tsx`, `queue/page.tsx`, `search/page.tsx`, Stripe portal route) — not caused by or related to this plan's changes. Out of scope, left as-is.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Photo upload on detail page fully operational
- addJobPhotos is ready to be extended if Phase 7 social sharing needs per-photo metadata
- Phase 3 Plan 2 (search/queue/calendar pages) can proceed — those pages have pre-existing syntax errors that will need resolution

---
*Phase: 03-job-detail-views-search*
*Completed: 2026-03-08*
