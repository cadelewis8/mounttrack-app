# Phase 2: Job Intake & Board - Context

**Gathered:** 2026-03-04
**Status:** Ready for planning

<domain>
## Phase Boundary

The owner can create a job with all required fields (customer info, animal details, pricing, photos), see every active job on a visual Kanban board organised by stage, and move jobs between stages. Includes stage customisation. No job detail page, search, filters, customer portal, or notifications — those are later phases.

</domain>

<decisions>
## Implementation Decisions

### Intake Form Flow
- Single page with all fields visible — no multi-step wizard
- Accessed via "New Job" button in the sidebar nav (full page at /jobs/new)
- After saving, owner lands back on the Kanban board (new card appears in first stage)
- Inline field errors below each invalid field — stay on form until valid
- Required fields: customer name, animal type, mount style, quoted price, estimated completion date
- Optional fields: phone, email, deposit, referral source, photos, rush flag

### Job Card Contents
- Primary line: customer name — animal type, mount style (e.g. "John Smith — White-tail, Shoulder Mount")
- Secondary line: estimated completion date + job number (subdued text)
- Rush indicator: thick orange left border on the card
- Overdue indicator: thick red left border (takes priority over orange if both)
- Rush is togglable directly on the Kanban card (quick toggle, no need to open job)
- Rush also set via checkbox in the intake form

### Photo Upload
- Photos can be added during intake AND after (post-creation via job detail page in Phase 3)
- Intake form has a drag-and-drop upload zone with thumbnail previews before saving
- Photos upload to Supabase Storage when the job form is saved
- Limit: 10 photos max per job at intake, 5MB each, PNG/JPG/HEIC
- No photo thumbnails on Kanban cards — photos only visible inside the job record

### Stage Management
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

</decisions>

<specifics>
## Specific Ideas

- The board is the owner's primary work surface — they'll look at it all day. Cards must be scannable at a glance. No photo thumbnails on cards.
- Rush/overdue indicators should be visible across the whole board immediately without reading each card — coloured left border achieves this.
- Stage management is an infrequent operation (set up once, rarely changed) — Settings page is the right home, not inline board editing.

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/components/step-indicator.tsx`: Multi-step progress indicator — available if ever needed but NOT used for intake (single-page form decision)
- `src/components/settings-tabs.tsx`: Tab navigation component — extend with "Stages" tab for phase 2
- `src/actions/shop.ts`: Server Action pattern with `useActionState` — replicate for job actions
- `src/lib/supabase/server.ts` + `proxy.ts`: Established SSR Supabase client pattern
- `src/types/database.ts`: Extend with jobs and stages table types

### Established Patterns
- Server Actions with React 19 `(_prevState, formData)` signature for all mutations
- `useActionState` hook for form state in client components
- `(SELECT auth.uid())` RLS pattern — all new tables must use this
- Supabase Storage for file uploads (logos bucket pattern replicable for job photos)
- CSS `var(--brand)` for accent colour on interactive elements
- Route groups: `(app)` for authenticated pages, all new routes go here

### Integration Points
- New routes: `src/app/(app)/jobs/new/page.tsx`, `src/app/(app)/board/page.tsx` (or `/dashboard` becomes the board)
- Sidebar in `src/app/(app)/layout.tsx` — add "Board" and "New Job" nav items
- Settings tabs in `src/components/settings-tabs.tsx` — add "Stages" tab
- New Supabase migration: `jobs` table (shop_id FK, all intake fields, stage_id FK) + `stages` table (shop_id FK, name, position, is_default)
- RLS on both tables: `shop_id = (SELECT auth.uid())`

</code_context>

<deferred>
## Deferred Ideas

- None — discussion stayed within phase scope

</deferred>

---

*Phase: 02-job-intake-board*
*Context gathered: 2026-03-04*
