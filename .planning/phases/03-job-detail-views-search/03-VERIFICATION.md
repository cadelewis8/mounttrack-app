---
phase: 03-job-detail-views-search
verified: 2026-03-08T00:00:00Z
status: gaps_found
score: 11/12 must-haves verified
gaps:
  - truth: "Photo upload widget on the detail page supports direct camera capture on mobile (capture=environment)"
    status: failed
    reason: "PhotoUploadZone uses react-dropzone which does not pass capture='environment' to the underlying file input. No capture attribute is present anywhere in photo-upload-zone.tsx or job-detail-client.tsx."
    artifacts:
      - path: "mounttrack/src/components/photo-upload-zone.tsx"
        issue: "react-dropzone getInputProps() does not include capture='environment'; no capture prop is threaded through"
      - path: "mounttrack/src/app/(app)/jobs/[id]/job-detail-client.tsx"
        issue: "PhotoUploadZone is rendered without any capture prop — the prop does not exist on the component interface"
    missing:
      - "Add a capture prop to PhotoUploadZoneProps and thread it through to the dropzone input via getInputProps() or a separate hidden input override"
      - "Pass capture='environment' when rendering PhotoUploadZone in the 'Add Photos' SideCard on the job detail page"
human_verification:
  - test: "Open /calendar on a mobile device or desktop, verify job events are visible on their due dates"
    expected: "Each job appears as a labeled event on its estimated_completion_date; overdue events are red, rush events are amber"
    why_human: "Cannot programmatically render react-big-calendar or inspect layout at runtime"
  - test: "Click a calendar event"
    expected: "Browser navigates to /jobs/[id] for the clicked job"
    why_human: "onClick behavior requires a live browser session"
  - test: "Visit /queue with multiple jobs having different stages — confirm stage count badges appear"
    expected: "Pill badges above the list show 'StageName: N' for each stage represented"
    why_human: "Requires populated database to confirm rendering path"
  - test: "On a mobile device, tap the 'Add Photos' section on a job detail page and verify the camera option is presented"
    expected: "Device camera sheet opens directly (capture=environment); this is the failing truth — should fail until fixed"
    why_human: "Requires a physical mobile device to test camera capture behavior"
---

# Phase 03: Job Detail Views & Search — Verification Report

**Phase Goal:** The owner has full access to every piece of job information, can manage job records over their lifecycle, and can find any job instantly via search and filtering.
**Verified:** 2026-03-08
**Status:** gaps_found — 1 automated gap, remainder human-verifiable
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Owner can upload additional photos to an existing job from the detail page | VERIFIED | `handlePhotoUpload` in job-detail-client.tsx calls `photoZoneRef.current.uploadAll()` then `addJobPhotos`; "Add Photos" SideCard renders at lines 361-384 |
| 2 | Uploaded photos are appended to the job's existing photo_paths array (not replaced) | VERIFIED | `addJobPhotos` in jobs.ts (lines 224-253): fetches existing `photo_paths`, spreads old + new into `merged`, updates row with merged array |
| 3 | Photo upload widget supports direct camera capture on mobile (capture=environment) | FAILED | `capture` attribute is absent from `photo-upload-zone.tsx` (react-dropzone `getInputProps()` does not emit it) and no capture prop exists on the component interface |
| 4 | Social media consent status is visible and editable on the job detail page | VERIFIED | `social_media_consent` select rendered at lines 238-246 of job-detail-client.tsx with Yes/No options, bound to `updateJob` form action |
| 5 | JOB-01, JOB-02, JOB-04 already implemented — confirmed present | VERIFIED | All editable fields present in `updateJob` form: customer fields, animal type, mount style, quoted price, deposit, estimated_completion_date (JOB-02), notes textarea (JOB-04); `updateJob` action persists all via Supabase |
| 6 | Owner can visit /queue and see all jobs ordered by estimated completion date ascending | VERIFIED | queue/page.tsx: `.order('estimated_completion_date', { ascending: true })` at line 18; results rendered as linked rows |
| 7 | Queue shows stage name per job row and per-stage job counts | VERIFIED | `stages(name)` joined in select; `stageCounts` reduce at lines 31-35; stage name rendered at line 91; count badges rendered at lines 57-65 |
| 8 | Owner can visit /calendar and see all jobs plotted on a monthly calendar by estimated completion date | VERIFIED | calendar/page.tsx fetches jobs, passes to CalendarClient; CalendarClient maps each job to a react-big-calendar event using `estimated_completion_date + 'T00:00:00'` |
| 9 | Clicking a calendar event navigates to /jobs/[id] | VERIFIED | `handleSelectEvent` at line 37 of calendar-client.tsx calls `router.push('/jobs/${event.resource.id}')` via `onSelectEvent` prop |
| 10 | Calendar month view visually reveals days with many jobs due at once (QUEUE-03) | VERIFIED | Month view is `defaultView`; multiple events on the same date stack visually per react-big-calendar's standard month rendering; overdue=red, rush=amber via `eventPropGetter` |
| 11 | Sidebar nav shows Queue, Calendar, and Search links | VERIFIED | nav-links.tsx lines 10-12: `/queue` (List icon), `/calendar` (CalendarDays icon), `/search` (Search icon) all present |
| 12 | Owner can visit /search and search jobs by customer name, animal type, or job number; filter by stage, rush, overdue, date range | VERIFIED | search/page.tsx: `.or()` with `.ilike()` for text fields, `.eq()` for numeric job_number (lines 52-56); stage/rush/overdue/date-range filters chained (lines 60-73); form uses `method="GET"`; results link to `/jobs/[id]` |

**Score: 11/12 truths verified**

---

## Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `mounttrack/src/actions/jobs.ts` | `addJobPhotos` server action — appends new photo_paths | VERIFIED | Exported at line 224; fetches existing array, merges, updates, calls `revalidatePath` |
| `mounttrack/src/app/(app)/jobs/[id]/job-detail-client.tsx` | Photo upload UI using PhotoUploadZone, calls addJobPhotos | VERIFIED | Imports and renders `PhotoUploadZone` at line 363; calls `addJobPhotos` at line 94 |
| `mounttrack/src/app/(app)/queue/page.tsx` | Server component — ordered job list with stage groups and per-stage counts | VERIFIED | Substantive server component; queries ordered by `estimated_completion_date ASC`; renders stage counts |
| `mounttrack/src/app/(app)/calendar/page.tsx` | Server component — fetches jobs, passes to CalendarClient | VERIFIED | Fetches jobs, maps overdue, renders `<CalendarClient jobs={jobsWithOverdue} />` |
| `mounttrack/src/app/(app)/calendar/calendar-client.tsx` | 'use client' react-big-calendar wrapper with click-to-navigate | VERIFIED | `'use client'`; uses `dateFnsLocalizer`; `onSelectEvent` calls `router.push` |
| `mounttrack/src/components/nav-links.tsx` | Updated nav with Queue, Calendar, Search links | VERIFIED | All 7 links present including Queue, Calendar, Search |
| `mounttrack/src/app/(app)/search/page.tsx` | Server component — reads searchParams, runs Supabase query, renders results | VERIFIED | `searchParams` typed as `Promise<{...}>` and awaited; full query logic present; results linked to `/jobs/[id]` |

---

## Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| job-detail-client.tsx PhotoUploadZone | getPhotoUploadUrls action | same pattern as job intake form | VERIFIED | `PhotoUploadZone` internally calls `getPhotoUploadUrls` (photo-upload-zone.tsx line 67) |
| job-detail-client.tsx upload handler | addJobPhotos action | startTransition + await | VERIFIED | `handlePhotoUpload` directly awaits `addJobPhotos(job.id, newPaths)` at line 94; no startTransition wrapping but direct async call inside try/finally |
| calendar/page.tsx | CalendarClient | jobs prop passed as serializable array | VERIFIED | `<CalendarClient jobs={jobsWithOverdue} />` at line 35 of calendar/page.tsx |
| CalendarClient event click | /jobs/[id] | onSelectEvent | VERIFIED | `onSelectEvent={handleSelectEvent}` wired; `handleSelectEvent` calls `router.push('/jobs/${event.resource.id}')` |
| search form | searchParams | HTML form method=GET | VERIFIED | `<form method="GET">` at line 106 of search/page.tsx; `searchParams` awaited at line 21 |
| Supabase query | job_number filter | parseInt + .or() with job_number.eq.N | VERIFIED | `parseInt(params.q, 10)` guard at line 51; `job_number.eq.${jobNum}` in or() at line 53 |

---

## Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| JOB-01 | 03-01 | Owner can view and edit any job field after intake | SATISFIED | `updateJob` form covers all fields; form action bound in `job-detail-client.tsx` |
| JOB-02 | 03-01 | Owner can update estimated completion date at any time | SATISFIED | `estimated_completion_date` date field in Timeline section; persisted by `updateJob` |
| JOB-03 | 03-01 | Owner can upload progress photos at any time including camera capture | PARTIAL | Upload widget works; `capture=environment` (mobile camera) is missing — see gap |
| JOB-04 | 03-01 | Owner can add internal notes via notes feed | SATISFIED (scoped) | Notes textarea present; approved scope: single textarea accepted as satisfying requirement |
| JOB-05 | 03-03 | Owner can view full communication history per job | DEFERRED | Explicitly deferred to Phase 6 per approved scope decision; not implemented |
| QUEUE-01 | 03-02 | Queue view — all active jobs ordered by estimated completion date with per-stage counts | SATISFIED | queue/page.tsx orders ASC by estimated_completion_date; per-stage counts rendered |
| QUEUE-02 | 03-02 | Calendar view — all active jobs plotted by estimated completion date | SATISFIED | calendar-client.tsx renders all jobs as events on their due dates |
| QUEUE-03 | 03-02 | Calendar reveals weeks with too many jobs due | SATISFIED | Month view default; multiple events per day are visible stacked; overdue/rush coloring adds signal |
| SEARCH-01 | 03-03 | Search active and past jobs by customer name, job number, or animal type | SATISFIED | search/page.tsx queries all jobs (no status filter); .or() covers all three fields |
| SEARCH-02 | 03-03 | Filter by stage, overdue status, rush status, or date range | SATISFIED | All four filter types implemented and composable |
| SOCIAL-02 | 03-01 | Photo sharing opt-in status visible and editable on job detail page | SATISFIED (scoped) | `social_media_consent` select present; approved scope: per-job toggle accepted; per-photo badging deferred to Phase 7 |

**Orphaned requirements check:** REQUIREMENTS.md traceability table maps JOB-05 to Phase 3 as "Complete" — this is inconsistent with the approved scope decision to defer JOB-05 to Phase 6. The traceability table should be updated to reflect Phase 6 / Pending status for JOB-05. This is a documentation inconsistency, not a code gap.

---

## Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `mounttrack/src/app/(app)/queue/page.tsx` | 19 | Supabase query cast uses `Promise<...>` type assertion rather than the `as { data: ... }` post-await pattern used elsewhere | Info | Type safety difference only; no runtime impact |
| `mounttrack/src/app/(app)/calendar/page.tsx` | 16 | Same Promise-cast type assertion pattern | Info | Type safety difference only; no runtime impact |

No blocker anti-patterns found. No TODO/placeholder/stub comments in any phase-3 file.

---

## Human Verification Required

### 1. Calendar event rendering

**Test:** Visit `/calendar` with at least one job in the database
**Expected:** Jobs appear as labeled events on their `estimated_completion_date`; overdue jobs show red background, rush jobs show amber background
**Why human:** Cannot render react-big-calendar programmatically; visual output requires a live browser

### 2. Calendar event click navigation

**Test:** Click any event on the calendar
**Expected:** Browser navigates to `/jobs/[id]` for that job
**Why human:** onClick handler requires live browser; `router.push` cannot be triggered in static analysis

### 3. Queue per-stage counts with data

**Test:** Visit `/queue` when jobs exist across multiple stages
**Expected:** Pill badges above the list show "StageName: N" for each stage that has jobs
**Why human:** Requires populated Supabase database to exercise the rendering path

### 4. Mobile camera capture (known gap — verify after fix)

**Test:** On a mobile device, open a job detail page, tap "Add Photos", select from camera
**Expected:** After the capture gap is fixed, device camera should open directly
**Why human:** Requires a physical mobile device; touch interaction cannot be automated

---

## Gaps Summary

One gap blocks full goal achievement.

**Gap: Mobile camera capture not wired (JOB-03 partial)**

The plan specified that `PhotoUploadZone` passes `capture="environment"` to the file input, enabling direct camera access on mobile. This attribute is absent. The `photo-upload-zone.tsx` component uses react-dropzone's `getInputProps()` which does not inject `capture` — the prop would need to be explicitly passed as an extra input attribute or added to the component's props interface and threaded through. The component's `PhotoUploadZoneProps` interface (`jobId`, `onUploadComplete`) has no `capture` prop.

The upload widget otherwise functions correctly: files can be selected via gallery, dragged in on desktop, and are uploaded and appended to the job. Only the direct-camera-capture path on mobile is missing.

**Scope note:** The REQUIREMENTS.md traceability table marks JOB-05 as "Phase 3 — Complete" but the approved scope decision defers it to Phase 6. The table entry is a documentation error and does not reflect a code gap.

---

_Verified: 2026-03-08_
_Verifier: Claude (gsd-verifier)_
