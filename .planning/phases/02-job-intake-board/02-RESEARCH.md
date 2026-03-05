# Phase 2: Job Intake & Board - Research

**Researched:** 2026-03-05
**Domain:** Kanban DnD, multi-field form with file upload, Supabase schema design, sequential job numbering
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Intake Form Flow**
- Single page with all fields visible — no multi-step wizard
- Accessed via "New Job" button in the sidebar nav (full page at /jobs/new)
- After saving, owner lands back on the Kanban board (new card appears in first stage)
- Inline field errors below each invalid field — stay on form until valid
- Required fields: customer name, animal type, mount style, quoted price, estimated completion date
- Optional fields: phone, email, deposit, referral source, photos, rush flag

**Job Card Contents**
- Primary line: customer name — animal type, mount style (e.g. "John Smith — White-tail, Shoulder Mount")
- Secondary line: estimated completion date + job number (subdued text)
- Rush indicator: thick orange left border on the card
- Overdue indicator: thick red left border (takes priority over orange if both)
- Rush is togglable directly on the Kanban card (quick toggle, no need to open job)
- Rush also set via checkbox in the intake form

**Photo Upload**
- Photos can be added during intake AND after (post-creation via job detail page in Phase 3)
- Intake form has a drag-and-drop upload zone with thumbnail previews before saving
- Photos upload to Supabase Storage when the job form is saved
- Limit: 10 photos max per job at intake, 5MB each, PNG/JPG/HEIC
- No photo thumbnails on Kanban cards — photos only visible inside the job record

**Stage Management**
- Stages managed in Settings > Stages tab (new tab alongside Shop/Branding/Subscription)
- Drag-and-drop reordering with a handle icon (⠿) on each row — consistent with board DnD library
- Add new stage: inline text input at the bottom of the list + "Add" button
- Rename: click the stage name to edit inline
- Delete: trash icon; blocked with error "Move all jobs out of this stage first" if jobs exist
- Minimum 1 stage — cannot delete the last one
- Default stages pre-loaded on account creation: Skinning, Fleshing, Tanning, Mounting, Finishing, Ready for Pickup

### Claude's Discretion
- Exact drag-and-drop library for the Kanban board (dnd-kit recommended based on React ecosystem)
- Optimistic update strategy for card drag (optimistic UI with server revalidation)
- Board column overflow/scroll behaviour when many stages exist
- Empty state for the board when no jobs exist yet
- Job number format (sequential per shop, e.g. #0001)

### Deferred Ideas (OUT OF SCOPE)
- None — discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| INTAKE-01 | Owner can create a job with customer name, phone, and email | Server Action pattern, react-hook-form + zod schema, Supabase insert |
| INTAKE-02 | Owner can select animal type from predefined list or add custom type | Combobox/select with "Other (custom)" option; static list + free-text fallback |
| INTAKE-03 | Owner can specify mount style (shoulder, full body, European, fish panel, etc.) | Same combobox pattern as INTAKE-02 |
| INTAKE-04 | Each job automatically assigned a unique job number at creation | Per-shop counter table with UPDATE...RETURNING in DB trigger or server action |
| INTAKE-05 | Owner can record quoted price and deposit amount at intake | Number inputs with zod numeric validation |
| INTAKE-06 | Owner can set an estimated completion date at intake | HTML date input; overdue computed as `estimated_completion_date < today` |
| INTAKE-07 | Owner can select a referral source or add a custom source | Same combobox pattern as INTAKE-02 |
| INTAKE-08 | Owner can upload photos at intake | react-dropzone client-side zone + Supabase Storage signed URL upload |
| BOARD-01 | Owner can view all active jobs on a visual Kanban stage board | Server component fetching jobs+stages; client KanbanBoard with dnd-kit |
| BOARD-02 | Owner can drag a job card between stage columns | @dnd-kit/core + @dnd-kit/sortable multi-container with onDragEnd Server Action |
| BOARD-03 | Owner can customise stages per shop — add, rename, reorder | Settings > Stages page; stage reorder uses same dnd-kit sortable; CRUD Server Actions |
| BOARD-04 | Owner can bulk-select multiple job cards and move them all to a stage | Checkbox per card, "Move selected" dropdown; bulk update Server Action |
| BOARD-05 | Owner can mark a job as Rush | Toggle Server Action; optimistic update on card; orange left border |
| BOARD-06 | Jobs past estimated completion date flagged as overdue | Computed in DB query: `estimated_completion_date < CURRENT_DATE`; red left border |
| BOARD-07 | Each stage column displays the job count | Derived from grouped query result; rendered in column header |
| SOCIAL-01 | Job intake form includes social media consent checkbox | Boolean field in jobs table; checkbox in intake form |
</phase_requirements>

---

## Summary

Phase 2 builds the core daily workflow surface of MountTrack: a job intake form and a Kanban production board. The technical challenges cluster around three areas: (1) a multi-field form with photo uploads that routes through the established Server Action pattern, (2) a real-time-feeling Kanban board with cross-column drag that writes to Supabase on drop, and (3) a Supabase schema with a per-shop sequential job number counter that never produces gaps.

The project already has `react-hook-form`, `zod`, `@hookform/resolvers`, and the full Supabase stack installed. No new packages are required for the form. For drag-and-drop, `@dnd-kit/core`, `@dnd-kit/sortable`, and `@dnd-kit/utilities` must be installed (React >=16.8 peer dep is satisfied by the existing React 19.2.3). For photo uploads, `react-dropzone` (v15.0.0) handles the client-side drop zone and thumbnail previews; the actual upload uses Supabase Storage signed URLs because the 10-photo-at-5MB-each scenario would blow past Next.js Server Action's default 1MB body limit.

The overdue flag requires no cron job — it is computed at query time with `estimated_completion_date < CURRENT_DATE`. The rush toggle is a direct boolean column update. Job numbers are per-shop sequential integers managed by a `job_number_seq` counter table with `UPDATE ... RETURNING` inside the same transaction that inserts the job.

**Primary recommendation:** Use `@dnd-kit/core` 6.3.1 + `@dnd-kit/sortable` 10.0.0 for the board and stage reorder; use `react-dropzone` 15 + Supabase signed-URL upload for photos; use a counter-table approach for gap-free per-shop job numbers.

---

## Standard Stack

### Core (already installed — no changes needed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react-hook-form | ^7.71.2 | Form state, validation, submission | Already in project; zero re-render form state management |
| zod | ^4.3.6 | Schema validation | Already in project; pairs with @hookform/resolvers |
| @hookform/resolvers | ^5.2.2 | Bridge between zod and react-hook-form | Already in project |
| @supabase/supabase-js | ^2.98.0 | DB + Storage client | Already in project |

### New Packages Required
| Library | Version | Purpose | Why This One |
|---------|---------|---------|--------------|
| @dnd-kit/core | 6.3.1 | DnD context, sensors, events | Most adopted React DnD library (2,239 dependents); not react-beautiful-dnd (unmaintained) |
| @dnd-kit/sortable | 10.0.0 | SortableContext + useSortable hook | Official sortable preset for ordered lists and Kanban columns |
| @dnd-kit/utilities | 3.2.2 | CSS.Transform helper | Needed for useSortable transform-to-style conversion |
| react-dropzone | 15.0.0 | Client-side drop zone with thumbnail previews | Standard hook-based dropzone; useDropzone API; 4,473 npm dependents; works with React 19 (>=16.8 peer dep) |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| @dnd-kit/core | @dnd-kit/react (0.3.2) | New rewrite — only 32 npm dependents, no maintainer roadmap response, not production-ready |
| @dnd-kit/core | react-beautiful-dnd | Unmaintained since 2022; no React 18+ support |
| react-dropzone | Native `<input type="file">` | No drag-zone, no thumbnail previews out of box; hand-rolling required |
| Signed URL upload | Server Action direct upload | Fails for 10 × 5MB photos (50MB total vs 1MB default limit) |

**Installation:**
```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities react-dropzone
```

---

## Architecture Patterns

### Recommended Project Structure

```
src/
├── actions/
│   ├── jobs.ts           # createJob, updateJobStage, toggleJobRush, bulkMoveJobs
│   └── stages.ts         # createStage, updateStage, deleteStage, reorderStages
├── app/(app)/
│   ├── board/
│   │   └── page.tsx      # Server component: fetches stages + jobs, renders KanbanBoard
│   ├── jobs/
│   │   └── new/
│   │       └── page.tsx  # Server component shell; renders JobIntakeForm
│   └── settings/
│       └── stages/
│           └── page.tsx  # Server component: fetches stages, renders StageManager
├── components/
│   ├── kanban-board.tsx      # 'use client' — DndContext wrapper + column layout
│   ├── kanban-column.tsx     # 'use client' — SortableContext per column + useDroppable
│   ├── job-card.tsx          # 'use client' — useSortable, rush toggle, overdue/rush border
│   ├── job-intake-form.tsx   # 'use client' — useActionState + react-hook-form + photo zone
│   ├── photo-upload-zone.tsx # 'use client' — react-dropzone, thumbnail previews, signed URLs
│   └── stage-manager.tsx     # 'use client' — DndContext for stage reorder, CRUD
└── types/
    └── database.ts           # Extend with Job, Stage, JobNumberSeq interfaces
supabase/
└── migrations/
    └── 0002_jobs_stages.sql  # stages, jobs, job_number_seq tables + RLS + trigger
```

### Pattern 1: Multi-Container Kanban with dnd-kit

**What:** One `DndContext` wrapping all columns; one `SortableContext` per column; `useDroppable` on each column for empty-column support; `DragOverlay` for ghost card during drag.

**When to use:** Any Kanban where cards cross column boundaries.

**Key events:** `onDragStart` captures `activeId`; `onDragOver` moves item optimistically between column arrays; `onDragEnd` commits to DB via Server Action.

**Collision detection:** Use `closestCenter` — official recommendation for multi-container sortable.

```typescript
// Source: dndkit.com/presets/sortable + official multiple containers example
'use client'
import {
  DndContext, DragOverlay, closestCenter,
  useSensor, useSensors, PointerSensor, KeyboardSensor,
  type DragStartEvent, type DragOverEvent, type DragEndEvent,
} from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable'
import { useState } from 'react'
import { updateJobStage } from '@/actions/jobs'

// jobsByStage: Record<stageId, Job[]>
export function KanbanBoard({ stages, initialJobs }: KanbanBoardProps) {
  const [jobsByStage, setJobsByStage] = useState(initialJobs)
  const [activeJobId, setActiveJobId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  )

  function onDragStart({ active }: DragStartEvent) {
    setActiveJobId(active.id as string)
  }

  function onDragOver({ active, over }: DragOverEvent) {
    if (!over) return
    const fromStage = findStageForJob(active.id as string, jobsByStage)
    const toStage = findStageForJob(over.id as string, jobsByStage) ?? over.id as string
    if (fromStage === toStage) return
    setJobsByStage(prev => moveJobBetweenStages(prev, active.id as string, fromStage, toStage))
  }

  async function onDragEnd({ active, over }: DragEndEvent) {
    setActiveJobId(null)
    if (!over) return
    const toStage = findStageForJob(over.id as string, jobsByStage) ?? over.id as string
    // Persist to DB (fire-and-forget; optimistic state already applied)
    await updateJobStage(active.id as string, toStage)
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto h-full p-4">
        {stages.map(stage => (
          <KanbanColumn
            key={stage.id}
            stage={stage}
            jobs={jobsByStage[stage.id] ?? []}
          />
        ))}
      </div>
      <DragOverlay>
        {activeJobId ? <JobCard job={findJob(activeJobId, jobsByStage)} isOverlay /> : null}
      </DragOverlay>
    </DndContext>
  )
}
```

### Pattern 2: useSortable Job Card

**What:** Each job card uses `useSortable` to be both draggable and a drop target within its column.

```typescript
// Source: dndkit.com/presets/sortable — useSortable hook
'use client'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

export function JobCard({ job, isOverlay }: { job: Job; isOverlay?: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: job.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  // Border priority: overdue (red) > rush (orange) > none
  const borderClass = job.is_overdue
    ? 'border-l-4 border-l-red-500'
    : job.is_rush
    ? 'border-l-4 border-l-orange-500'
    : ''

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`rounded-md bg-card border p-3 cursor-grab shadow-sm ${borderClass}`}
    >
      <p className="text-sm font-medium">
        {job.customer_name} — {job.animal_type}, {job.mount_style}
      </p>
      <p className="text-xs text-muted-foreground mt-1">
        {formatDate(job.estimated_completion_date)} · #{job.job_number.toString().padStart(4, '0')}
      </p>
    </div>
  )
}
```

### Pattern 3: Photo Upload — Signed URL Flow

**What:** Client collects files with react-dropzone, shows thumbnails. On form submit, a separate Server Action generates Supabase signed upload URLs; client uploads directly to Supabase Storage; paths are stored in the job record.

**Why signed URLs instead of passing files through Server Action:** 10 × 5MB = up to 50MB — far exceeds Next.js Server Action's 1MB default body limit. Signed URLs bypass the limit entirely by uploading directly from client to Supabase.

```typescript
// Step 1: Server Action returns signed URLs (called before main form submit)
// src/actions/jobs.ts
'use server'
export async function getPhotoUploadUrls(
  jobId: string,
  fileNames: string[]
): Promise<{ signedUrls: { path: string; token: string; signedUrl: string }[]; error?: string }> {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  const userId = data?.claims?.sub
  if (!userId) return { signedUrls: [], error: 'Not authenticated' }

  const results = await Promise.all(
    fileNames.map(async (name) => {
      const path = `${userId}/${jobId}/${Date.now()}-${name}`
      const { data, error } = await supabase.storage
        .from('job-photos')
        .createSignedUploadUrl(path)
      return error ? null : { path, ...data }
    })
  )
  return { signedUrls: results.filter(Boolean) as any[] }
}

// Step 2: Client uploads to signed URLs
// src/components/photo-upload-zone.tsx
const { signedUrls } = await getPhotoUploadUrls(jobId, files.map(f => f.name))
const uploadedPaths = await Promise.all(
  signedUrls.map(async ({ path, token }, i) => {
    const { error } = await supabase.storage
      .from('job-photos')
      .uploadToSignedUrl(path, token, files[i])
    return error ? null : path
  })
)
// Pass uploadedPaths to main createJob server action as JSON string in FormData
```

### Pattern 4: Job Intake Form — react-hook-form + useActionState Bridge

**What:** The existing project pattern uses `useActionState` with Server Actions. For the intake form with client-side validation (zod) AND file uploads, use `react-hook-form` with `zodResolver` for client validation, then bridge to a Server Action for the DB write.

```typescript
// src/components/job-intake-form.tsx
'use client'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createJob } from '@/actions/jobs'

const intakeSchema = z.object({
  customer_name: z.string().min(1, 'Customer name is required'),
  customer_phone: z.string().optional(),
  customer_email: z.string().email('Invalid email').optional().or(z.literal('')),
  animal_type: z.string().min(1, 'Animal type is required'),
  animal_type_custom: z.string().optional(),
  mount_style: z.string().min(1, 'Mount style is required'),
  mount_style_custom: z.string().optional(),
  quoted_price: z.coerce.number().positive('Must be a positive amount'),
  deposit_amount: z.coerce.number().min(0).optional(),
  estimated_completion_date: z.string().min(1, 'Completion date is required'),
  referral_source: z.string().optional(),
  referral_source_custom: z.string().optional(),
  is_rush: z.boolean().default(false),
  social_media_consent: z.boolean().default(false),
})

export function JobIntakeForm() {
  const form = useForm({ resolver: zodResolver(intakeSchema) })

  async function onSubmit(values: z.infer<typeof intakeSchema>) {
    // 1. Upload photos first (signed URL flow)
    // 2. Call createJob server action with form values + photo paths
    const formData = new FormData()
    Object.entries(values).forEach(([k, v]) => formData.append(k, String(v)))
    formData.append('photo_paths', JSON.stringify(uploadedPhotoPaths))
    await createJob(undefined, formData)
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      {/* fields with inline errors via form.formState.errors.field?.message */}
    </form>
  )
}
```

### Pattern 5: Per-Shop Sequential Job Number

**What:** A `job_number_seq` table with one row per shop. The job insert runs an `UPDATE ... RETURNING` to atomically increment and capture the counter. The DB enforces sequential assignment; no application-level race condition possible.

**Why not PostgreSQL SEQUENCE:** Native sequences skip numbers on transaction rollback. For a job number that appears on receipts and communications, gaps are confusing to shop owners.

```sql
-- In migration 0002_jobs_stages.sql
CREATE TABLE job_number_seq (
  shop_id UUID PRIMARY KEY REFERENCES shops(id) ON DELETE CASCADE,
  last_number INTEGER NOT NULL DEFAULT 0
);

-- RLS: only the owning shop can read/update
ALTER TABLE job_number_seq ENABLE ROW LEVEL SECURITY;
CREATE POLICY "seq_select" ON job_number_seq FOR SELECT TO authenticated
  USING (shop_id = (SELECT auth.uid()));

-- Function called inside createJob server action
-- NOTE: run via service-role client to bypass RLS on the counter update
CREATE OR REPLACE FUNCTION get_next_job_number(p_shop_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_number INTEGER;
BEGIN
  INSERT INTO job_number_seq (shop_id, last_number)
    VALUES (p_shop_id, 1)
    ON CONFLICT (shop_id)
    DO UPDATE SET last_number = job_number_seq.last_number + 1
    RETURNING last_number INTO v_number;
  RETURN v_number;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Server Action usage:**
```typescript
// In createJob server action — call function via rpc
const { data: jobNum } = await supabase.rpc('get_next_job_number', { p_shop_id: userId })
// Insert job with job_number: jobNum
```

### Pattern 6: Stage Manager (Settings > Stages)

**What:** Reuses the same dnd-kit sortable for reordering stages. Each row has a drag handle (not whole-row drag) using `useSortable` + a separate handle element.

```typescript
// Drag-handle-only sortable row pattern
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical } from 'lucide-react'

function StageRow({ stage }: { stage: Stage }) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: stage.id })

  return (
    <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }}
         className="flex items-center gap-2 p-2 border rounded">
      {/* Handle only — listeners go on the grip icon, not the whole row */}
      <button className="cursor-grab touch-none" {...attributes} {...listeners}>
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </button>
      <span>{stage.name}</span>
      {/* Edit/delete controls */}
    </div>
  )
}
```

### Anti-Patterns to Avoid
- **Putting `listeners` on the entire job card:** Prevents the rush toggle button from being clickable. Apply `listeners` to a drag-handle area OR use `activationConstraint: { distance: 5 }` on `PointerSensor` so small clicks don't initiate drag.
- **Uploading photos through a Server Action form directly:** Will fail silently for files > 1MB unless `bodySizeLimit` is increased. Use the signed URL pattern.
- **Using PostgreSQL native SEQUENCE for job numbers:** Sequences skip on rollback — the counter never decrements. A counter table with `INSERT...ON CONFLICT DO UPDATE` is gapless.
- **Computing overdue on the client:** The board is a server component that fetches fresh data. Add `is_overdue` as a computed column (`estimated_completion_date < CURRENT_DATE`) in the SQL query — no JS Date math needed.
- **Using `@dnd-kit/react` (0.3.2):** The new rewrite has 32 npm dependents vs 2,239 for `@dnd-kit/core`. No maintainer response on stability/migration timeline as of 2026-03-05. Use the proven `@dnd-kit/core` stack.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Drag-and-drop Kanban | Custom mouse event listeners + z-index tricks | @dnd-kit/core + @dnd-kit/sortable | Touch support, keyboard a11y, scroll-container awareness, DragOverlay ghost — all built in |
| File drop zone with thumbnails | onChange + dragenter/dragleave event handlers | react-dropzone (useDropzone) | Handles Firefox/Safari file drag quirks, concurrent drop rejections, file type/size filtering |
| Form validation with inline errors | Refs + manual error state per field | react-hook-form + zod | Already installed; uncontrolled perf, field-level errors, type inference |
| Photo upload to Supabase | POST file through Server Action | Supabase signed URL pattern (createSignedUploadUrl + uploadToSignedUrl) | Server Actions cap at 1MB by default; signed URLs upload directly from browser to Supabase |
| Sequential gapless job numbers | UUID or native SEQUENCE | Counter table with INSERT...ON CONFLICT DO UPDATE | Sequences skip on rollback; counter table is atomic and gapless |
| Overdue detection | Cron job or client Date comparison | SQL: `estimated_completion_date < CURRENT_DATE` in query | Always accurate, no scheduled job needed |

**Key insight:** The dnd-kit and react-dropzone surface areas look simple but hide significant cross-browser complexity. Both libraries have 2,000+ npm dependents and active real-world production use — their edge-case handling is worth the dependency.

---

## Common Pitfalls

### Pitfall 1: PointerSensor Fires on Button Clicks Inside Cards
**What goes wrong:** The rush toggle button on a job card becomes unclickable — every tap starts a drag.
**Why it happens:** By default `PointerSensor` starts dragging immediately on pointerdown.
**How to avoid:** Configure `activationConstraint: { distance: 5 }` (drag only starts after 5px movement).
**Warning signs:** Clicking any interactive element inside a card triggers drag instead of the click handler.

```typescript
const sensors = useSensors(
  useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  useSensor(KeyboardSensor)
)
```

### Pitfall 2: Empty Column Cannot Receive Drops
**What goes wrong:** A stage with no jobs cannot accept a card dragged into it because there are no sortable targets to collide with.
**Why it happens:** `SortableContext` items array is empty — collision detection finds nothing.
**How to avoid:** Wrap each column's inner area with `useDroppable({ id: stage.id })`. The droppable zone acts as a fixed drop target even when `SortableContext` items is empty.
**Warning signs:** Cards can be dragged out of a column but not dragged into an empty column.

### Pitfall 3: DragOverlay Causes Double-Render of Active Card
**What goes wrong:** The card appears in two places: its original position and the DragOverlay.
**Why it happens:** `useSortable` keeps the original DOM element; `DragOverlay` renders a copy.
**How to avoid:** Set `opacity: isDragging ? 0 : 1` (not 0.4) on the original card so only the overlay is visible. Or keep a faded placeholder.
**Warning signs:** Two cards visible while dragging — one transparent placeholder, one overlay.

### Pitfall 4: react-dropzone Object URL Memory Leak
**What goes wrong:** Each file dropped creates an object URL via `URL.createObjectURL(file)`. These are never freed, accumulating in browser memory during a long session.
**Why it happens:** react-dropzone v7+ removed automatic `preview` URL generation; devs forget to revoke.
**How to avoid:** Call `URL.revokeObjectURL(file.preview)` in the `<img>` `onLoad` handler, or in a `useEffect` cleanup that runs when the photo list changes.
**Warning signs:** Memory usage climbs steadily every time photos are previewed.

### Pitfall 5: Supabase Type Inference Fails on New Tables
**What goes wrong:** `supabase.from('jobs').insert(...)` TypeScript type is inferred as `never`.
**Why it happens:** Established project pattern — supabase-js v2.98 GenericSchema constraint; hand-written types require the `Relationships`/`Views`/`Functions` fields.
**How to avoid:** Follow the existing project convention: `(supabase.from('jobs') as any).insert(data)` with an explicit return type annotation. Extend `src/types/database.ts` with `jobs` and `stages` table definitions following the `shops` pattern.
**Warning signs:** TypeScript error "Type 'never' is not assignable to..." on Supabase insert/update/upsert.

### Pitfall 6: Stage Delete Silently Orphans Jobs
**What goes wrong:** Deleting a stage with active jobs leaves them with a null `stage_id`, making them invisible on the board.
**Why it happens:** No FK constraint check before delete, or ON DELETE SET NULL on the FK.
**How to avoid:** In the `deleteStage` Server Action, query `SELECT COUNT(*) FROM jobs WHERE stage_id = $1 AND shop_id = $1` before deleting. Return the error "Move all jobs out of this stage first" if count > 0. Use `ON DELETE RESTRICT` on the FK in the migration.
**Warning signs:** Board card count drops after stage delete; jobs disappear from board.

### Pitfall 7: onDragOver Called Before onDragEnd Persist Causes Flicker
**What goes wrong:** The board flickers or reverts briefly when drag ends.
**Why it happens:** `onDragOver` updates local state optimistically; if the server action revalidation triggers a re-render before `onDragEnd` finishes, the board briefly shows the pre-drag state.
**How to avoid:** Use `useOptimistic` (React 19) for the cross-column move: the optimistic state persists until the server revalidation resolves. Wrap the server action call in `startTransition`.
**Warning signs:** Card visibly snaps back to original column briefly after drop.

---

## Code Examples

### DB Migration: stages + jobs + job_number_seq

```sql
-- Source: established project pattern from 0001_initial_schema.sql
-- Migration: 0002_jobs_stages.sql

-- STAGES TABLE
CREATE TABLE stages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id     UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  position    INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX stages_shop_id_idx ON stages (shop_id);

CREATE TRIGGER stages_updated_at
  BEFORE UPDATE ON stages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE stages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "stages_select" ON stages FOR SELECT TO authenticated
  USING (shop_id = (SELECT auth.uid()));
CREATE POLICY "stages_insert" ON stages FOR INSERT TO authenticated
  WITH CHECK (shop_id = (SELECT auth.uid()));
CREATE POLICY "stages_update" ON stages FOR UPDATE TO authenticated
  USING (shop_id = (SELECT auth.uid())) WITH CHECK (shop_id = (SELECT auth.uid()));
CREATE POLICY "stages_delete" ON stages FOR DELETE TO authenticated
  USING (shop_id = (SELECT auth.uid()));

-- JOB NUMBER SEQUENCE COUNTER TABLE
CREATE TABLE job_number_seq (
  shop_id     UUID PRIMARY KEY REFERENCES shops(id) ON DELETE CASCADE,
  last_number INTEGER NOT NULL DEFAULT 0
);

ALTER TABLE job_number_seq ENABLE ROW LEVEL SECURITY;

-- Counter table only writable by service role (via SECURITY DEFINER function)
-- Read access for the owning shop
CREATE POLICY "seq_select" ON job_number_seq FOR SELECT TO authenticated
  USING (shop_id = (SELECT auth.uid()));

-- Function: atomic gapless counter increment (runs as SECURITY DEFINER to bypass RLS on insert)
CREATE OR REPLACE FUNCTION get_next_job_number(p_shop_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_number INTEGER;
BEGIN
  INSERT INTO job_number_seq (shop_id, last_number)
    VALUES (p_shop_id, 1)
    ON CONFLICT (shop_id)
    DO UPDATE SET last_number = job_number_seq.last_number + 1
    RETURNING last_number INTO v_number;
  RETURN v_number;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- JOBS TABLE
CREATE TABLE jobs (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id                  UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  job_number               INTEGER NOT NULL,
  stage_id                 UUID REFERENCES stages(id) ON DELETE RESTRICT,
  customer_name            TEXT NOT NULL,
  customer_phone           TEXT,
  customer_email           TEXT,
  animal_type              TEXT NOT NULL,
  mount_style              TEXT NOT NULL,
  quoted_price             NUMERIC(10,2) NOT NULL,
  deposit_amount           NUMERIC(10,2),
  estimated_completion_date DATE NOT NULL,
  referral_source          TEXT,
  is_rush                  BOOLEAN NOT NULL DEFAULT FALSE,
  social_media_consent     BOOLEAN NOT NULL DEFAULT FALSE,
  photo_paths              TEXT[] DEFAULT '{}',
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (shop_id, job_number)
);

CREATE INDEX jobs_shop_id_idx ON jobs (shop_id);
CREATE INDEX jobs_stage_id_idx ON jobs (stage_id);

CREATE TRIGGER jobs_updated_at
  BEFORE UPDATE ON jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "jobs_select" ON jobs FOR SELECT TO authenticated
  USING (shop_id = (SELECT auth.uid()));
CREATE POLICY "jobs_insert" ON jobs FOR INSERT TO authenticated
  WITH CHECK (shop_id = (SELECT auth.uid()));
CREATE POLICY "jobs_update" ON jobs FOR UPDATE TO authenticated
  USING (shop_id = (SELECT auth.uid())) WITH CHECK (shop_id = (SELECT auth.uid()));
CREATE POLICY "jobs_delete" ON jobs FOR DELETE TO authenticated
  USING (shop_id = (SELECT auth.uid()));

-- STORAGE: job-photos bucket RLS policies
-- Run AFTER creating 'job-photos' bucket in Supabase Dashboard (private bucket)
CREATE POLICY "photos_insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'job-photos' AND (storage.foldername(name))[1] = (SELECT auth.uid()::text));
CREATE POLICY "photos_select" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'job-photos' AND (storage.foldername(name))[1] = (SELECT auth.uid()::text));
CREATE POLICY "photos_delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'job-photos' AND (storage.foldername(name))[1] = (SELECT auth.uid()::text));
```

### Fetching Board Data with Overdue Computed in SQL

```typescript
// src/app/(app)/board/page.tsx — Server Component
import { createClient } from '@/lib/supabase/server'

export default async function BoardPage() {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  const userId = data?.claims?.sub
  if (!userId) redirect('/login')

  // Stages ordered by position
  const { data: stages } = await (supabase.from('stages') as any)
    .select('id, name, position')
    .eq('shop_id', userId)
    .order('position', { ascending: true }) as { data: Stage[] | null }

  // Jobs with overdue flag computed in SQL — no JS Date math
  const { data: jobs } = await (supabase.from('jobs') as any)
    .select(`
      id, job_number, stage_id,
      customer_name, animal_type, mount_style,
      estimated_completion_date, is_rush,
      (estimated_completion_date < CURRENT_DATE) as is_overdue
    `)
    .eq('shop_id', userId)
    .order('created_at', { ascending: true }) as { data: Job[] | null }

  // Group by stage_id
  const jobsByStage = groupByStage(stages ?? [], jobs ?? [])

  return <KanbanBoard stages={stages ?? []} initialJobs={jobsByStage} />
}
```

### react-dropzone Photo Zone with Thumbnails

```typescript
// src/components/photo-upload-zone.tsx
'use client'
import { useDropzone } from 'react-dropzone'
import { useCallback, useState } from 'react'

const ACCEPTED = { 'image/jpeg': [], 'image/png': [], 'image/heic': [] }
const MAX_SIZE = 5 * 1024 * 1024  // 5MB
const MAX_FILES = 10

interface PhotoFile extends File {
  preview: string
}

export function PhotoUploadZone({ onChange }: { onChange: (files: File[]) => void }) {
  const [files, setFiles] = useState<PhotoFile[]>([])

  const onDrop = useCallback((accepted: File[]) => {
    const withPreview = accepted.map(f =>
      Object.assign(f, { preview: URL.createObjectURL(f) })
    ) as PhotoFile[]
    setFiles(prev => [...prev, ...withPreview].slice(0, MAX_FILES))
    onChange([...files, ...accepted].slice(0, MAX_FILES))
  }, [files, onChange])

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept: ACCEPTED,
    maxSize: MAX_SIZE,
    maxFiles: MAX_FILES - files.length,
    multiple: true,
  })

  return (
    <div className="space-y-3">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
          ${isDragActive ? 'border-[var(--brand)] bg-[var(--brand)]/5' : 'border-muted'}`}
      >
        <input {...getInputProps()} />
        <p className="text-sm text-muted-foreground">
          {isDragActive ? 'Drop photos here' : 'Drag photos here or click to select'}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          PNG, JPG, HEIC — max 5MB each, up to 10
        </p>
      </div>

      {/* Thumbnail previews */}
      <div className="flex flex-wrap gap-2">
        {files.map(file => (
          <div key={file.preview} className="relative h-16 w-16 rounded overflow-hidden border">
            <img
              src={file.preview}
              alt="preview"
              className="h-full w-full object-cover"
              onLoad={() => URL.revokeObjectURL(file.preview)}  // prevent memory leak
            />
          </div>
        ))}
      </div>

      {fileRejections.length > 0 && (
        <p className="text-xs text-red-500">
          {fileRejections[0].errors[0].message}
        </p>
      )}
    </div>
  )
}
```

### TypeScript Types for database.ts Extension

```typescript
// Extend src/types/database.ts with new tables
export interface Stage {
  id: string
  shop_id: string
  name: string
  position: number
  created_at: string
  updated_at: string
}

export interface Job {
  id: string
  shop_id: string
  job_number: number
  stage_id: string | null
  customer_name: string
  customer_phone: string | null
  customer_email: string | null
  animal_type: string
  mount_style: string
  quoted_price: number
  deposit_amount: number | null
  estimated_completion_date: string  // ISO date string
  referral_source: string | null
  is_rush: boolean
  social_media_consent: boolean
  photo_paths: string[]
  is_overdue?: boolean               // computed in SELECT, not stored
  created_at: string
  updated_at: string
}

export interface JobNumberSeq {
  shop_id: string
  last_number: number
}

// Add to Database interface:
// stages: { Row: Stage; Insert: ...; Update: ...; Relationships: [] }
// jobs: { Row: Job; Insert: ...; Update: ...; Relationships: [] }
// job_number_seq: { Row: JobNumberSeq; Insert: ...; Update: ...; Relationships: [] }
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| react-beautiful-dnd | @dnd-kit/core + @dnd-kit/sortable | 2022 (rbd abandoned) | rbd has no React 18+ support; dnd-kit is the community successor |
| Dropzone manual DOM events | react-dropzone useDropzone hook | v6 (2018) | Hook API replaces class component; much simpler integration |
| React 18 useOptimistic (experimental) | React 19 useOptimistic (stable) | React 19 release | Stable API for optimistic drag updates; `startTransition` integration |
| Input `type="file"` for uploads | react-dropzone + Supabase signed URL | 2023+ | Server Action body limit makes direct upload impractical for multi-file |

**Deprecated/outdated:**
- `react-beautiful-dnd`: Unmaintained since 2022, no React 18+ support. Do not use.
- `@dnd-kit/react` (0.3.2): New experimental rewrite, not production-ready as of 2026-03-05.
- Passing large file arrays through Server Action FormData: 1MB default limit; use signed URLs.

---

## Open Questions

1. **HEIC support in react-dropzone accept filter**
   - What we know: react-dropzone accepts MIME type strings. HEIC files from iPhones may arrive as `image/heic` or `image/heif`.
   - What's unclear: Whether browsers consistently set the correct MIME type for HEIC uploads, or whether they arrive as `application/octet-stream`.
   - Recommendation: Accept both `{ 'image/heic': [], 'image/heif': [] }` in react-dropzone. Validate by file extension as a fallback. Supabase Storage will store whatever binary it receives — thumbnail generation for HEIC can be deferred to Phase 3.

2. **`useOptimistic` vs local state for cross-column drag**
   - What we know: `useOptimistic` provides automatic rollback on server error; local `useState` is simpler but requires manual error recovery.
   - What's unclear: Whether the board page uses `revalidatePath` after stage changes (which would trigger a full server-component re-render, resetting the client state).
   - Recommendation: Use local `useState` for the drag state (as shown in Pattern 1) because the board is primarily client-driven during a session. Call `revalidatePath('/board')` in the Server Action but don't `await` it from the client — the optimistic state remains until the next full navigation.

3. **Board route: `/board` vs `/dashboard`**
   - What we know: CONTEXT.md suggests `/board/page.tsx` or `/dashboard` becomes the board. The existing `/dashboard` is a stub page.
   - What's unclear: Whether `/dashboard` should be repurposed as the board or kept as a separate summary page.
   - Recommendation: Make `/board` the Kanban and redirect `/dashboard` to `/board`. This keeps the dashboard URL distinct for a potential future summary widget page, and `board` is self-describing.

4. **Default stage seeding for new shops**
   - What we know: 6 default stages must be pre-loaded on account creation. The shop record is created in Phase 1 during onboarding.
   - What's unclear: Whether to seed defaults via a DB trigger on shop insert or in the createJob/first-visit flow.
   - Recommendation: Seed via a PostgreSQL trigger on `INSERT INTO shops` — keeps the seeding atomic with shop creation, no risk of a shop existing without stages.

---

## Sources

### Primary (HIGH confidence)
- `@dnd-kit/core` npm registry — version 6.3.1, React >=16.8 peer dep (verified via `npm view`)
- `@dnd-kit/sortable` npm registry — version 10.0.0 (verified via `npm view`)
- `@dnd-kit/utilities` npm registry — version 3.2.2 (verified via `npm view`)
- `react-dropzone` npm registry — version 15.0.0, last published 23 days ago (verified via `npm view`)
- https://dndkit.com/presets/sortable — SortableContext API, useSortable returns, multi-container pattern, closestCenter recommendation
- https://supabase.com/docs/reference/javascript/storage-from-uploadtosignedurl — uploadToSignedUrl signature (path, token, fileBody, options)
- https://supabase.com/docs/reference/javascript/storage-from-createsigneduploadurl — createSignedUploadUrl API
- https://nextjs.org/docs/app/api-reference/config/next-config-js/serverActions — bodySizeLimit config (experimental.serverActions.bodySizeLimit), version 16.1.6, updated 2026-02-27
- https://react.dev/reference/react/useOptimistic — useOptimistic hook API and Kanban applicability
- `mounttrack/supabase/migrations/0001_initial_schema.sql` — established RLS + trigger patterns
- `mounttrack/src/actions/shop.ts` — established Server Action pattern, Supabase client usage, `(supabase.from() as any)` pattern
- `mounttrack/package.json` — confirmed installed packages and versions

### Secondary (MEDIUM confidence)
- https://deepwiki.com/clauderic/dnd-kit/4.4-multiple-containers — multiple containers lifecycle, closestCorners recommendation
- https://github.com/clauderic/dnd-kit/discussions/1842 — @dnd-kit/react vs @dnd-kit/core roadmap discussion (0 maintainer responses as of 2026-03-05)
- https://github.com/kimmobrunfeldt/howto-everything/blob/master/postgres-gapless-counter-for-invoice-purposes.md — gapless counter table pattern with ACCESS EXCLUSIVE lock; adapted to INSERT...ON CONFLICT approach

### Tertiary (LOW confidence)
- WebSearch results on "per-shop sequential job number" — no authoritative single source; counter-table pattern synthesized from multiple PostgreSQL forum posts and cybertec-postgresql.com

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all versions verified via `npm view`; dndkit.com official docs confirmed API
- Architecture patterns: HIGH — dnd-kit multi-container docs explicit; Supabase signed URL API docs confirmed; counter table pattern well-established in PostgreSQL literature
- Pitfalls: HIGH — activation constraint and empty column pitfalls from official dnd-kit sortable docs and community issues; type inference pitfall from established project code pattern
- Photo upload signed URL flow: HIGH — Supabase official API docs confirmed; bodySizeLimit Next.js official docs confirmed

**Research date:** 2026-03-05
**Valid until:** 2026-04-05 (stable libraries; dnd-kit 6.x has been stable for 1+ year; react-dropzone 15 just published)
