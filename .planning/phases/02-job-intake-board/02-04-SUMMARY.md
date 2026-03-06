---
phase: 02-job-intake-board
plan: 04
subsystem: ui
tags: [react, dnd-kit, server-actions, next-app-router, supabase]

# Dependency graph
requires:
  - phase: 02-job-intake-board
    provides: Stage type in database.ts, stages table with RLS established in 02-01

provides:
  - createStage, updateStage, deleteStage, reorderStages server actions in src/actions/stages.ts
  - StageManager client component with dnd-kit sortable drag-and-drop, inline rename, inline add, delete
  - /settings/stages page (server component fetching ordered stages)
  - Settings tab navigation updated to include Stages tab (Shop | Branding | Subscription | Stages)

affects: [02-05-kanban-board, 02-02-job-form, 03-customer-portal]

# Tech tracking
tech-stack:
  added: ["@dnd-kit/core ^6.3.1", "@dnd-kit/sortable ^10.0.0", "@dnd-kit/utilities ^3.2.2"]
  patterns:
    - "dnd-kit sortable with handle-only drag (listeners on grip button, not whole row)"
    - "optimistic UI update: setStages locally then await server action"
    - "server component page + client StageManager child for mutation interactivity"
    - "deleteStage / reorderStages as plain async functions (not useActionState) — called directly from event handlers"
    - "createStage / updateStage as (prevState, formData) actions — compatible with useActionState signature but called imperatively via FormData"

key-files:
  created:
    - mounttrack/src/actions/stages.ts
    - mounttrack/src/components/stage-manager.tsx
    - mounttrack/src/app/(app)/settings/stages/page.tsx
  modified:
    - mounttrack/src/components/settings-tabs.tsx
    - mounttrack/package.json

key-decisions:
  - "dnd-kit listeners attached to grip handle button only — prevents click conflicts with rename/delete buttons on the row"
  - "deleteStage guards: (1) stageCount <= 1 blocks last-stage delete, (2) jobCount > 0 blocks delete of occupied stage"
  - "reorderStages uses Promise.all of per-row update calls — no DB stored procedure needed for position updates"
  - "StageManager uses optimistic local state for delete and reorder; createStage relies on revalidatePath for server refresh"
  - "stages page passes active='stages' to SettingsTabs — plan template omitted this required prop, fixed inline"

patterns-established:
  - "Settings page pattern: Server Component page + 'use client' manager child component receiving initialX prop"
  - "Tabs active prop: each settings page passes its own tab ID to SettingsTabs"

requirements-completed: [BOARD-03]

# Metrics
duration: 3min
completed: 2026-03-06
---

# Phase 2 Plan 4: Stage Manager Summary

**dnd-kit sortable stage manager at /settings/stages with inline rename, add, delete-with-guard, and drag reorder persisted via server actions**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-06T04:54:08Z
- **Completed:** 2026-03-06T04:57:10Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Four server actions in stages.ts: createStage, updateStage, deleteStage (with job count and last-stage guards), reorderStages
- StageManager component: dnd-kit drag-and-drop with handle-only activation, click-to-edit inline rename, bottom add input, delete with error display
- /settings/stages server component page fetching stages ordered by position
- Settings tab navigation extended with Stages tab — now shows Shop | Branding | Subscription | Stages

## Task Commits

Each task was committed atomically:

1. **Task 1: Stage server actions (stages.ts)** - `2973a9c` (feat)
2. **Task 2: StageManager component + settings/stages page + update settings-tabs** - `ab46b5f` (feat)

**Plan metadata:** _(docs commit — see below)_

## Files Created/Modified
- `mounttrack/src/actions/stages.ts` - Four server actions: createStage, updateStage, deleteStage, reorderStages
- `mounttrack/src/components/stage-manager.tsx` - Client component: dnd-kit sortable list with full CRUD controls
- `mounttrack/src/app/(app)/settings/stages/page.tsx` - Server component page at /settings/stages
- `mounttrack/src/components/settings-tabs.tsx` - Added Stages tab after Subscription
- `mounttrack/package.json` - Added @dnd-kit/core, @dnd-kit/sortable, @dnd-kit/utilities to dependencies

## Decisions Made
- dnd-kit handle-only drag: `{...listeners}` on grip button only so rename/delete buttons remain clickable without triggering drag
- deleteStage runs two guards sequentially: last-stage check then job-count check — returns early with specific error messages
- reorderStages: Promise.all of individual position update calls (no DB function needed at this scale)
- StageManager optimistically updates local `stages` state on delete/reorder; createStage clears input and relies on Next.js revalidatePath for the new item to appear

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed missing `active` prop on SettingsTabs in stages page**
- **Found during:** Task 2 (stages settings page)
- **Issue:** Plan template showed `<SettingsTabs />` without the required `active` prop. The component signature requires `{ active: TabId }` — omitting it would cause a TypeScript error and the Stages tab would never show as highlighted
- **Fix:** Passed `active="stages"` in the stages page; added "stages" to the tabs array and `TabId` union in settings-tabs.tsx
- **Files modified:** mounttrack/src/app/(app)/settings/stages/page.tsx, mounttrack/src/components/settings-tabs.tsx
- **Verification:** TypeScript compiles clean for all new src/ files
- **Committed in:** ab46b5f (Task 2 commit)

**2. [Rule 3 - Blocking] Added dnd-kit to package.json dependencies**
- **Found during:** Task 1 (pre-execution dependency check)
- **Issue:** @dnd-kit/core, @dnd-kit/sortable, @dnd-kit/utilities were in node_modules and package-lock.json but missing from package.json dependencies — would cause issues on fresh installs
- **Fix:** Ran `npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities --save` to add them to package.json
- **Files modified:** mounttrack/package.json
- **Verification:** All three packages appear in package.json dependencies
- **Committed in:** 2973a9c (Task 1 commit)

---

**Total deviations:** 2 auto-fixed (1 bug, 1 blocking)
**Impact on plan:** Both fixes required for correctness. No scope creep.

## Issues Encountered
- Pre-existing TypeScript error in `.next/dev/types/validator.ts` related to Stripe portal route returning `BillingState` instead of `Response` — out of scope for this plan, deferred

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- /settings/stages fully functional: owners can reorder, rename, add, and delete stages
- deleteStage safety guards prevent orphaned jobs and empty-stage state
- Stage order persists to DB and revalidates /board path — Kanban board plan (02-05) can rely on ordered stages query
- BOARD-03 requirement fulfilled

---
*Phase: 02-job-intake-board*
*Completed: 2026-03-06*
