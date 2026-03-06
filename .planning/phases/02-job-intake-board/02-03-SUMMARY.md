---
phase: 02-job-intake-board
plan: 03
subsystem: ui
tags: [react, dnd-kit, kanban, nextjs, supabase, typescript]

# Dependency graph
requires:
  - phase: 02-01
    provides: database schema (stages, jobs tables), TypeScript types (Stage, Job)
  - phase: 02-02
    provides: server actions (updateJobStage, toggleJobRush, createJob)
provides:
  - /board page Server Component that fetches stages + jobs grouped by stage
  - KanbanBoard client component with dnd-kit multi-container drag-and-drop
  - KanbanColumn component with useDroppable for empty column drop support
  - JobCard component with rush/overdue left-border indicators and rush toggle
affects:
  - 02-05 (bulk select toolbar will extend KanbanBoard selectedJobIds state)
  - any future board features referencing kanban-board.tsx, kanban-column.tsx, job-card.tsx

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Server Component data fetch passes grouped Record<stageId, Job[]> to Client Component
    - dnd-kit multi-container pattern: DndContext > KanbanColumn (useDroppable + SortableContext) > JobCard (useSortable)
    - Optimistic drag: onDragOver updates state immediately; onDragEnd persists to DB in useTransition
    - PointerSensor activationConstraint distance:5 prevents button clicks from triggering drag
    - is_overdue computed server-side in SQL (estimated_completion_date < now()::date), not JS
    - DragOverlay renders ghost card with rotate-1 and opacity-90 during drag

key-files:
  created:
    - mounttrack/src/app/(app)/board/page.tsx
    - mounttrack/src/components/kanban-board.tsx
    - mounttrack/src/components/kanban-column.tsx
    - mounttrack/src/components/job-card.tsx
  modified: []

key-decisions:
  - "is_overdue computed in SQL at query time (not JS/runtime) — server clock accuracy, no drift"
  - "useDroppable on column container required for empty columns to accept drops — SortableContext alone insufficient"
  - "PointerSensor activationConstraint distance:5 — allows button clicks in cards without triggering drag"
  - "Bulk select state lifted into KanbanBoard (not column) — ready for Plan 05 toolbar without refactor"
  - "Overdue (red border) takes priority over rush (orange border) — critical visual hierarchy for owner scanning"

patterns-established:
  - "Kanban drag pattern: DndContext.onDragOver for optimistic column moves, onDragEnd for DB persistence via useTransition"
  - "Empty column drop support: useDroppable({ id: stage.id }) on column container alongside SortableContext"
  - "Card ghost during drag: isDragging ? opacity-0 on original + DragOverlay renders ghost"

requirements-completed: [BOARD-01, BOARD-02, BOARD-05, BOARD-06, BOARD-07]

# Metrics
duration: 9min
completed: 2026-03-06
---

# Phase 2 Plan 03: Kanban Board Summary

**Multi-column dnd-kit Kanban at /board with server-rendered data fetch, optimistic drag-and-drop across stages, and rush/overdue card indicators**

## Performance

- **Duration:** 9 min
- **Started:** 2026-03-06T14:10:36Z
- **Completed:** 2026-03-06T14:20:18Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- Board page Server Component fetches stages ordered by position and jobs with is_overdue computed in SQL, groups jobs into Record<stageId, Job[]> for the client
- KanbanBoard implements dnd-kit multi-container drag with optimistic state (onDragOver moves card immediately) and DB persistence (onDragEnd via useTransition)
- KanbanColumn uses both SortableContext and useDroppable so empty columns accept dropped cards without a SortableContext workaround
- JobCard renders rush (orange) and overdue (red) left borders with overdue taking priority; Zap icon button toggles rush without triggering drag thanks to activationConstraint distance:5

## Task Commits

Each task was committed atomically:

1. **Task 1: Board page Server Component (data fetch + grouping)** - `b45fc02` (feat)
2. **Task 2: KanbanBoard, KanbanColumn, and JobCard client components** - `79c3fea` (feat)

**Plan metadata:** `(pending docs commit)` (docs: complete plan)

## Files Created/Modified

- `mounttrack/src/app/(app)/board/page.tsx` - Server Component: fetches stages + jobs, groups by stage, renders KanbanBoard or empty-state message
- `mounttrack/src/components/kanban-board.tsx` - DndContext wrapper with optimistic drag state, bulk select state, and column layout
- `mounttrack/src/components/kanban-column.tsx` - SortableContext per column + useDroppable for empty column drop target
- `mounttrack/src/components/job-card.tsx` - useSortable card with rush/overdue borders, rush toggle button, and bulk select checkbox

## Decisions Made

- **SQL is_overdue over JS:** `estimated_completion_date < now()::date` computed in the Supabase query, not in JavaScript after fetch — server clock is authoritative and there is no risk of timezone drift
- **useDroppable required for empty columns:** SortableContext with an empty `items` array is not a valid drop target; adding `useDroppable({ id: stage.id })` on the column container resolves this known dnd-kit pitfall
- **activationConstraint distance:5:** Prevents the PointerSensor from treating a click on the rush toggle button as a drag start — cards only begin dragging after 5px of movement
- **Bulk select state in KanbanBoard:** State lifted to board level now so Plan 05's bulk-action toolbar can read selectedJobIds without needing a context refactor

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- Pre-existing TypeScript error in `.next/dev/types/validator.ts` related to the Stripe portal route handler returning `BillingState` instead of `Response` — this existed before this plan and was not caused by kanban changes. Logged to deferred items, out of scope.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- /board page and all kanban components are ready for use
- Bulk select state (selectedJobIds + toggleSelect) is pre-wired in KanbanBoard for Plan 05 bulk-action toolbar
- Job cards link to the server actions created in Plan 02 (updateJobStage, toggleJobRush)
- No blockers for remaining phase plans

## Self-Check: PASSED

- FOUND: mounttrack/src/app/(app)/board/page.tsx
- FOUND: mounttrack/src/components/kanban-board.tsx
- FOUND: mounttrack/src/components/kanban-column.tsx
- FOUND: mounttrack/src/components/job-card.tsx
- FOUND commit: b45fc02
- FOUND commit: 79c3fea

---
*Phase: 02-job-intake-board*
*Completed: 2026-03-06*
