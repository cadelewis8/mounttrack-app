---
phase: 02-job-intake-board
plan: 05
subsystem: ui
tags: [react, next-app-router, server-actions, supabase, typescript]

# Dependency graph
requires:
  - phase: 02-job-intake-board
    provides: KanbanBoard, job actions, stages, layout from 02-01 through 02-04

provides:
  - Sidebar nav with Board + New Job links via NavLinks client component
  - /dashboard redirects to /board
  - Bulk select toolbar in KanbanBoard (select, move to stage, clear)
  - Job detail page at /jobs/[id] with full editable form + stage/rush sidebar
  - Notes field on both new job form (/jobs/new) and job detail page (/jobs/[id])

affects: [03-job-detail-views-search]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "NavLinks as 'use client' component using usePathname for active link highlighting"
    - "Bulk toolbar: optimistic local state update before server action, then startTransition for DB persist"
    - "Job detail: server component page fetches job + stages + signed photo URLs, passes to client component"
    - "useActionState for updateJob — Save Changes button shows Saved! feedback on success"

key-files:
  created:
    - mounttrack/src/components/nav-links.tsx
    - mounttrack/src/app/(app)/jobs/[id]/page.tsx
    - mounttrack/src/app/(app)/jobs/[id]/job-detail-client.tsx
  modified:
    - mounttrack/src/app/(app)/layout.tsx
    - mounttrack/src/app/(app)/dashboard/page.tsx
    - mounttrack/src/components/kanban-board.tsx
    - mounttrack/src/components/job-intake-form.tsx
    - mounttrack/src/actions/jobs.ts

key-decisions:
  - "NavLinks extracted as client component so layout.tsx stays a server component"
  - "Bulk move updates local jobsByStage state immediately (optimistic) before awaiting bulkMoveJobs"
  - "Job detail reuses existing updateJob action — notes field added to both createJob and updateJob"
  - "Notes field added to intake form schema, submit handler, createJob action, and job detail UI"

requirements-completed: [BOARD-04]

# Metrics
duration: ~1 session
completed: 2026-03-08
---

# Phase 2 Plan 5: Wire Phase 2 + Bulk Select + Job Detail + Notes

**Sidebar nav, /board redirect, bulk select toolbar, job detail page, and notes field — Phase 2 complete.**

## Accomplishments
- NavLinks client component with active-link highlighting; sidebar now shows Board, New Job, Settings
- /dashboard page replaced with redirect to /board
- Bulk select toolbar in KanbanBoard: shows selected count, stage dropdown, Move + Clear buttons with optimistic UI
- Job detail page at /jobs/[id]: editable form for all job fields, stage dropdown, rush toggle, dates, photo gallery
- Notes textarea added to both /jobs/new and /jobs/[id], saved via createJob and updateJob actions

## Files Created/Modified
- `mounttrack/src/components/nav-links.tsx` - Client component: Board, New Job, Settings links with usePathname active state
- `mounttrack/src/app/(app)/layout.tsx` - Updated to use NavLinks component
- `mounttrack/src/app/(app)/dashboard/page.tsx` - Replaced with redirect('/board')
- `mounttrack/src/components/kanban-board.tsx` - Added bulk select toolbar (selectedJobIds, bulkTargetStageId, Move/Clear)
- `mounttrack/src/app/(app)/jobs/[id]/page.tsx` - Server component: fetches job, stages, signed photo URLs
- `mounttrack/src/app/(app)/jobs/[id]/job-detail-client.tsx` - Client component: full edit form + sidebar cards
- `mounttrack/src/components/job-intake-form.tsx` - Added notes field to schema, UI, and submit handler
- `mounttrack/src/actions/jobs.ts` - Added notes to createJob jobData

## Next Phase Readiness
- Full Phase 2 owner workflow functional: create job → board → drag → rush → bulk move → manage stages → view/edit job detail
- Job detail page exists but search, list view, and filtering are Phase 3 scope
- BOARD-04 requirement fulfilled

---
*Phase: 02-job-intake-board*
*Completed: 2026-03-08*
