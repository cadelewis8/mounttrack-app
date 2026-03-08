# Phase 3: Job Detail, Views & Search — Research

**Researched:** 2026-03-08
**Domain:** Next.js App Router views, Supabase filtered queries, calendar UI library
**Confidence:** HIGH

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| JOB-01 | Owner can view and edit any job field after intake | Already implemented in Phase 2 at /jobs/[id] — confirm scope, add SOCIAL-02 consent visibility |
| JOB-02 | Owner can update estimated completion date at any time | Already implemented in Phase 2 updateJob action and job detail form |
| JOB-03 | Owner can upload progress photos to a job at any time (including direct camera capture on mobile) | Phase 2 photo upload exists at intake; needs photo upload on job detail page + camera capture via `capture="environment"` on mobile input |
| JOB-04 | Owner can add internal notes to a job via a chronological notes feed | Notes textarea exists but is a single blob; requirement says "chronological notes feed" — clarify whether single textarea or append-only feed is acceptable for v1 |
| JOB-05 | Owner can view the full communication history per job | DEFER to Phase 6 per scope decisions (notifications don't exist yet) |
| QUEUE-01 | Owner can view a queue showing all active jobs ordered by estimated completion date with per-stage job counts | Server-rendered list page at /queue; Supabase query ordered by estimated_completion_date ASC |
| QUEUE-02 | Owner can view a calendar view showing all active jobs plotted by estimated completion date | react-big-calendar v1.19.4 in a 'use client' component; events mapped from jobs |
| QUEUE-03 | Calendar view allows owner to identify weeks where too many jobs are due at once | react-big-calendar month view shows stacked events per day; visually surfaces overcommitment |
| SEARCH-01 | Owner can search active and past jobs by customer name, job number, or animal type | Server action with Supabase .or() + .ilike() across customer_name, job_number cast to text, animal_type |
| SEARCH-02 | Owner can filter jobs by stage, overdue status, rush status, or date range | Supabase .eq('stage_id') + .eq('is_rush') + .lte('estimated_completion_date', today) + .gte/.lte date range |
| SOCIAL-02 | Photo sharing opt-in status visible on job detail page and on photos flagged as shareable | social_media_consent field already on Job type and in updateJob; surface on job detail sidebar |
</phase_requirements>

---

## Summary

Phase 3 has a smaller true scope than it appears. The job detail page at `/jobs/[id]` was fully built during Phase 2 (Plan 05) — all fields are editable, notes are stored, photos are displayed, stage and rush toggles work. What genuinely remains is: (1) photo upload on the detail page (not just at intake), (2) surfacing social media consent status per SOCIAL-02, (3) the queue view at `/queue`, (4) the calendar view at `/calendar`, and (5) search/filters.

For the calendar view, `react-big-calendar` v1.19.4 is the right choice. It is a pure React library that requires `'use client'`, renders events in a Google-Calendar-style month/week/day grid, and supports a lightweight `date-fns` localizer. It has no SSR requirements and no CSS conflicts with Tailwind when the stylesheet is scoped. The bundle cost is modest when paired with `date-fns` (which is a common transitive dependency).

For search, the correct pattern is a dedicated server-side search page at `/search` that constructs a Supabase query with `.or('customer_name.ilike.%term%,animal_type.ilike.%term%')` for text search and chained `.eq()` / `.gte()` / `.lte()` filters for stage/rush/dates. This avoids loading all jobs into the browser and will scale to large shops. The queue view at `/queue` is a simple server-rendered list ordered by `estimated_completion_date ASC`.

**Primary recommendation:** Build queue as a server component page, search as a server-action-driven page with URL params, and wrap react-big-calendar in a single `'use client'` component for the calendar view.

---

## What Is Already Done (Do NOT Rebuild)

| Feature | Status | File |
|---------|--------|------|
| /jobs/[id] page shell + server data fetch | DONE | `src/app/(app)/jobs/[id]/page.tsx` |
| JobDetailClient: edit all fields, save | DONE | `src/app/(app)/jobs/[id]/job-detail-client.tsx` |
| Notes field (single textarea) | DONE | job-detail-client.tsx + updateJob action |
| Stage change from detail page | DONE | handleStageChange + updateJobStage action |
| Rush toggle from detail page | DONE | handleRushToggle + toggleJobRush action |
| Delete job from detail page | DONE | handleDelete + deleteJob action |
| Photo display on detail page | DONE | signed URLs in sidebar SideCard |
| updateJob server action | DONE | `src/actions/jobs.ts` |
| Nav links: Board, New Job, Settings | DONE | `src/components/nav-links.tsx` |

**What remains for JOB-01/JOB-02:** These are already satisfied. The plan should note this and skip rebuilding.

**JOB-03 gap:** Photos can be uploaded at intake but NOT on the detail page. The detail page shows existing photos but has no upload control. Adding photo upload to the detail page is genuine Phase 3 work.

**JOB-04 clarification:** The current notes field is a single textarea (not a chronological feed). Per REQUIREMENTS.md, the requirement says "chronological notes feed." For v1 simplicity, the planner should treat a multi-entry timestamped append-only log as the target, OR treat the existing single textarea as "good enough" — research recommends the append-only model since it preserves history. This requires a new `job_notes` table or a JSONB `notes_entries` column.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react-big-calendar | ^1.19.4 | Month/week/day calendar grid for job completion dates | Only mature pure-React calendar; no Moment.js required with date-fns localizer |
| date-fns | ^4.x (or ^2.x) | Date formatting localizer for react-big-calendar | Lighter than moment.js; widely used in React ecosystem |

**Note on date-fns version:** react-big-calendar v1.19.4 supports date-fns v2. Verify date-fns v3/v4 compatibility before installing. The project does not currently have date-fns installed.

### Already Installed (no new installs needed for these)
| Library | Version | Used For |
|---------|---------|---------|
| @supabase/supabase-js | ^2.98.0 | All Supabase queries (search, queue, calendar data fetch) |
| lucide-react | ^0.576.0 | Icons for queue, search, nav |
| next | 16.1.6 | App Router pages and server actions |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| react-big-calendar | @fullcalendar/react | FullCalendar is heavier, more features than needed; react-big-calendar is sufficient for month-view job plotting |
| react-big-calendar | Hand-rolled month grid | Custom grid avoids library bundle but requires substantial date calculation logic; not worth it |
| Server-side search action | Client-side filter on board | Client filter works for small shops but loads ALL jobs into browser; server-side scales better and supports archived job search (SEARCH-01 says "active and past jobs") |

**Installation:**
```bash
# In mounttrack/ directory:
npm install react-big-calendar date-fns
# If date-fns v3/v4 causes issues with react-big-calendar, use:
npm install react-big-calendar date-fns@2
```

---

## Architecture Patterns

### Recommended New Route Structure
```
src/app/(app)/
├── queue/
│   └── page.tsx              # Server component — jobs ordered by estimated_completion_date
├── calendar/
│   └── page.tsx              # Server component — fetches jobs, passes to CalendarClient
│   └── calendar-client.tsx   # 'use client' — react-big-calendar wrapper
├── search/
│   └── page.tsx              # Server component — reads URL searchParams, runs Supabase query
src/components/
├── nav-links.tsx             # Add Queue + Calendar links (already 'use client')
```

### Pattern 1: Queue View — Server-Rendered List

**What:** Server component fetches all active jobs ordered by `estimated_completion_date ASC`, grouped by stage, and renders a simple list.

**When to use:** Read-only view, no interactivity required, benefits from server rendering.

```typescript
// Source: Supabase JS docs — supabase.com/docs/reference/javascript/using-filters
// src/app/(app)/queue/page.tsx (server component)
const { data: jobs } = await (supabase.from('jobs') as any)
  .select('*, stages(name, position)')
  .eq('shop_id', userId)
  .order('estimated_completion_date', { ascending: true })
  .is('archived_at', null)  // if archiving is added later; omit for now

// Group by stage client-side after fetch for per-stage counts
```

**Note:** The Job type does not have an `archived_at` field in v1. Query all jobs and note the queue shows all active (non-deleted) jobs.

### Pattern 2: Calendar View — Server-Fetches, Client Renders

**What:** Server component page fetches all jobs and passes them as props to a client component that renders react-big-calendar.

**Why:** react-big-calendar is a client-only library (event interactivity, DOM manipulation). The data fetch stays on the server.

```typescript
// Source: react-big-calendar GitHub README — github.com/jquense/react-big-calendar
// src/app/(app)/calendar/calendar-client.tsx
'use client'
import { Calendar, dateFnsLocalizer } from 'react-big-calendar'
import { format, parse, startOfWeek, getDay } from 'date-fns'
import { enUS } from 'date-fns/locale'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import type { Job } from '@/types/database'

const locales = { 'en-US': enUS }
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales })

interface CalendarEvent {
  title: string
  start: Date
  end: Date
  resource: Job  // full job for tooltip/click
}

export function CalendarClient({ jobs }: { jobs: Job[] }) {
  const events: CalendarEvent[] = jobs.map(job => {
    const d = new Date(job.estimated_completion_date + 'T00:00:00')
    return {
      title: `#${String(job.job_number).padStart(4, '0')} ${job.customer_name}`,
      start: d,
      end: d,
      resource: job,
    }
  })

  return (
    <div style={{ height: 'calc(100vh - 120px)' }}>
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        defaultView="month"
        views={['month', 'week']}
      />
    </div>
  )
}
```

**CSS scoping note:** `react-big-calendar/lib/css/react-big-calendar.css` is a global stylesheet. In Next.js App Router, import it in the client component file — Next.js will scope it correctly if CSS modules are not used. Tailwind base styles may conflict with calendar cell borders; verify after install and override selectively.

### Pattern 3: Search — URL Params + Server Action

**What:** Search page reads `searchParams` (Next.js App Router server component prop) and runs a Supabase query. Form submits via GET to preserve bookmarkable URLs.

**When to use:** Multi-field search and filtering with server-side execution.

```typescript
// Source: Supabase JS docs — supabase.com/docs/reference/javascript/using-filters
// src/app/(app)/search/page.tsx (server component)
export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; stage?: string; rush?: string; overdue?: string; from?: string; to?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  const userId = data?.claims?.sub ?? null
  if (!userId) redirect('/login')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (supabase.from('jobs') as any)
    .select('*, stages(name)')
    .eq('shop_id', userId)
    .order('created_at', { ascending: false })

  // Text search — OR across customer_name, animal_type; job_number cast via ::text in raw SQL not available via JS client
  // Use ilike on string fields; job_number requires cast or separate eq filter
  if (params.q) {
    const term = `%${params.q}%`
    const jobNum = parseInt(params.q, 10)
    if (!isNaN(jobNum)) {
      // Exact job number match OR name/animal match
      query = query.or(`customer_name.ilike.${term},animal_type.ilike.${term},job_number.eq.${jobNum}`)
    } else {
      query = query.or(`customer_name.ilike.${term},animal_type.ilike.${term}`)
    }
  }

  // Stage filter
  if (params.stage) query = query.eq('stage_id', params.stage)

  // Rush filter
  if (params.rush === 'true') query = query.eq('is_rush', true)

  // Overdue filter — estimated_completion_date < today
  if (params.overdue === 'true') {
    const today = new Date().toISOString().slice(0, 10)
    query = query.lt('estimated_completion_date', today)
  }

  // Date range filter
  if (params.from) query = query.gte('estimated_completion_date', params.from)
  if (params.to) query = query.lte('estimated_completion_date', params.to)

  const { data: jobs } = await query as { data: Job[] | null }
  // ...render results
}
```

**Key insight on job_number search:** `job_number` is a numeric column in the database. Supabase JS `.ilike()` only works on text columns. The correct approach: if the search term is a valid integer, add `.or()` with `job_number.eq.${num}` alongside text field ilike filters.

### Pattern 4: Notes Feed — Append-Only vs Single Textarea

Two valid approaches for JOB-04:

**Option A (simpler — matches current implementation):** Treat notes as a single editable textarea. Owner can edit the blob at any time. No history preserved. Current behavior.

**Option B (matches "chronological feed" wording):** Add a `job_notes` table:
```sql
CREATE TABLE job_notes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id uuid REFERENCES jobs(id) ON DELETE CASCADE,
  shop_id uuid REFERENCES shops(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);
```
Owner appends notes; old notes are read-only. Displayed as a scrollable feed with timestamps.

**Recommendation:** Use Option B (chronological feed). The requirement explicitly says "chronological notes feed — never visible to customers." This implies distinct entries. Option B also protects against accidental overwrites. A new migration will be needed.

### Anti-Patterns to Avoid

- **Importing react-big-calendar in a Server Component:** Will throw — it uses browser APIs. Always wrap in `'use client'`.
- **Loading all jobs client-side for search:** Defeats the purpose of server-side filtering and breaks SEARCH-01's "active and past jobs" scope.
- **Using `.ilike()` on `job_number` directly:** The column is numeric — use `.eq('job_number', parsedInt)` when search term looks like a number.
- **Fetching signed photo URLs on every search/queue/calendar page load:** Only fetch signed URLs on the job detail page. Queue/calendar/search should render without photos.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Month calendar grid | Custom date grid with manual week/day calculations | react-big-calendar | Date boundary edge cases (DST, week starts, locale) are subtle; react-big-calendar handles them correctly |
| Photo upload on job detail | Custom file input + fetch | Reuse existing PhotoUploadZone + getPhotoUploadUrls pattern from Phase 2 | The pattern is already proven; just add the component to job-detail-client.tsx |
| Search debounce/URL sync | Custom useState + router.push | HTML form with GET method and searchParams | Server component reads searchParams natively; no JS needed for initial render |

**Key insight:** Most of Phase 3's hard work was done in Phase 2. The planner should avoid duplicating the job detail form work and instead focus on the genuinely new surfaces: queue, calendar, search, photo-on-detail, notes feed.

---

## Common Pitfalls

### Pitfall 1: react-big-calendar CSS Conflicts with Tailwind
**What goes wrong:** Tailwind's preflight (`* { box-sizing: border-box }`) and reset styles collide with react-big-calendar's `.rbc-*` CSS, causing broken borders and zero-height calendar cells.
**Why it happens:** react-big-calendar CSS expects standard browser defaults; Tailwind strips them.
**How to avoid:** Import `react-big-calendar/lib/css/react-big-calendar.css` in the client component. If Tailwind's `@layer base` still conflicts, add targeted overrides in a scoped `.rbc-calendar` wrapper CSS class.
**Warning signs:** Calendar renders as a zero-height element or has no visible cell borders.

### Pitfall 2: react-big-calendar Requires Explicit Height
**What goes wrong:** Calendar renders as a collapsed 0px-height div.
**Why it happens:** The Calendar component requires an explicit height on its container — it does not auto-size.
**How to avoid:** Always wrap Calendar in a div with `style={{ height: 'calc(100vh - Npx)' }}` or a fixed px height. The exact offset depends on header height in the layout.
**Warning signs:** Calendar appears empty or invisible after installation.

### Pitfall 3: Date Timezone Shift on Calendar
**What goes wrong:** Jobs appear on the wrong day in the calendar (e.g., December 31 job shows on December 30).
**Why it happens:** `estimated_completion_date` is stored as `YYYY-MM-DD`. Constructing `new Date('2025-12-31')` in JavaScript parses as UTC midnight, which shifts to the previous day in negative UTC offset timezones (US timezones).
**How to avoid:** Always append `T00:00:00` (local time) when constructing Date objects from date-only strings: `new Date(job.estimated_completion_date + 'T00:00:00')`.
**Warning signs:** Calendar events appear one day early for users in US timezones.

### Pitfall 4: searchParams in Next.js App Router are Async
**What goes wrong:** `searchParams.q` throws or returns undefined even when the URL has `?q=foo`.
**Why it happens:** In Next.js 16 App Router, `searchParams` is a Promise (async) — it must be awaited.
**How to avoid:** Type the page as `{ searchParams: Promise<{...}> }` and `await searchParams` at the top of the function. This is already the pattern used in `page.tsx` for `params`.
**Warning signs:** Search filters appear to do nothing; console shows "Cannot read properties of undefined."

### Pitfall 5: Job Number Search on Numeric Column
**What goes wrong:** `.ilike('job_number', '%123%')` throws a Supabase error.
**Why it happens:** `job_number` is an integer column; ilike only works on text/varchar.
**How to avoid:** Parse the query string as an integer and use `.eq('job_number', num)` when valid, combined via `.or()` with text field ilike filters.
**Warning signs:** Runtime Supabase filter error when user types a number in the search box.

### Pitfall 6: NavLinks Active State for New Routes
**What goes wrong:** Queue and Calendar nav links don't highlight as active when visiting `/queue/...` sub-routes or query-string variants.
**Why it happens:** The current active detection is `pathname.startsWith(href)` — this works if links use exact top-level paths.
**How to avoid:** Add `/queue` and `/calendar` to nav-links.tsx with `href: '/queue'` and `href: '/calendar'`. No logic change needed — `pathname.startsWith('/queue')` will correctly highlight the Queue link.

---

## Code Examples

### Supabase Multi-Column OR Search
```typescript
// Source: supabase.com/docs/reference/javascript/using-filters
// Verified pattern for text search across customer_name and animal_type

const term = `%${searchTerm}%`
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let query = (supabase.from('jobs') as any)
  .select('*')
  .eq('shop_id', userId)

// Text search
query = query.or(`customer_name.ilike.${term},animal_type.ilike.${term}`)

// Optionally add exact job_number match when term is numeric
const num = parseInt(searchTerm, 10)
if (!isNaN(num)) {
  query = query.or(`customer_name.ilike.${term},animal_type.ilike.${term},job_number.eq.${num}`)
}
```

### Supabase Chained Filters (Stage + Rush + Date Range)
```typescript
// Source: supabase.com/docs/reference/javascript/using-filters
// Filters are AND'ed when chained
if (stageId) query = query.eq('stage_id', stageId)
if (isRush)  query = query.eq('is_rush', true)
if (fromDate) query = query.gte('estimated_completion_date', fromDate)
if (toDate)   query = query.lte('estimated_completion_date', toDate)
if (overdueOnly) {
  const today = new Date().toISOString().slice(0, 10)
  query = query.lt('estimated_completion_date', today)
}
```

### react-big-calendar Minimal Setup
```typescript
// Source: github.com/jquense/react-big-calendar (v1.19.4 README)
'use client'
import { Calendar, dateFnsLocalizer } from 'react-big-calendar'
import { format, parse, startOfWeek, getDay } from 'date-fns'
import { enUS } from 'date-fns/locale'
import 'react-big-calendar/lib/css/react-big-calendar.css'

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales: { 'en-US': enUS },
})

// CRITICAL: container must have explicit height
// CRITICAL: date-only strings need 'T00:00:00' suffix to avoid UTC timezone shift
export function CalendarClient({ jobs }: { jobs: Job[] }) {
  const events = jobs.map(job => {
    const d = new Date(job.estimated_completion_date + 'T00:00:00')
    return { title: `#${String(job.job_number).padStart(4,'0')} ${job.customer_name}`, start: d, end: d, resource: job }
  })
  return (
    <div style={{ height: 'calc(100vh - 120px)' }}>
      <Calendar localizer={localizer} events={events} startAccessor="start" endAccessor="end" defaultView="month" />
    </div>
  )
}
```

### Queue Page — Supabase Ordered Query
```typescript
// Source: supabase.com/docs/reference/javascript/order
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const { data: jobs } = await (supabase.from('jobs') as any)
  .select('id, job_number, customer_name, animal_type, mount_style, estimated_completion_date, stage_id, is_rush, is_overdue')
  .eq('shop_id', userId)
  .order('estimated_completion_date', { ascending: true })
  as { data: Job[] | null }
```

**Note:** `is_overdue` must be computed at the application layer (compare to today's date) — it is not a DB column. The board already does this with SQL `estimated_completion_date < now()::date`; the queue/search pages should replicate this logic.

### Photo Upload on Job Detail — Reuse Existing Pattern
```typescript
// Reuse PhotoUploadZone from Phase 2 (src/components/photo-upload-zone.tsx)
// Pattern: getPhotoUploadUrls() server action → client uploads to Supabase Storage
// → updateJob() with new photo_paths array (existing paths + new paths)
// The detail page needs to merge existing photo_paths with newly uploaded paths on save
```

### Job Notes Feed — Append-Only DB Schema
```sql
-- New migration for chronological notes feed (if Option B chosen by planner)
CREATE TABLE job_notes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id uuid NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  shop_id uuid NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE job_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "shop_owner_owns_job_notes"
  ON job_notes FOR ALL
  USING (shop_id = auth.uid())
  WITH CHECK (shop_id = auth.uid());
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| moment.js localizer for react-big-calendar | date-fns localizer (lighter, tree-shakeable) | react-big-calendar v0.x → v1.x | Eliminates 67KB moment.js bundle |
| Server components with direct data access | Server component page + 'use client' child for interactive UI | Next.js 13+ App Router | Keeps data on server; client component only for interactivity |
| next/router.push for search | HTML form GET + searchParams (server component) | Next.js App Router | No JavaScript required; URLs are bookmarkable; server renders filtered results |

**Deprecated/outdated:**
- `moment` localizer in react-big-calendar: Still supported but not recommended; prefer `date-fns` or `dayjs`
- `useRouter().push` for filter navigation in App Router: Prefer searchParams + form GET for server-rendered filter pages

---

## Open Questions

1. **JOB-04: Single textarea or chronological notes feed?**
   - What we know: Current implementation is a single editable textarea. Requirement says "chronological notes feed."
   - What's unclear: Whether a new `job_notes` table migration is required, or if the single textarea is accepted for v1.
   - Recommendation: Build the chronological feed (Option B) — it matches the requirement wording and is not significantly more complex. Requires one new migration + server action.

2. **Photo upload on job detail (JOB-03): Merge or replace photo_paths?**
   - What we know: `photo_paths` is a `string[]` on the jobs table. updateJob does not currently handle photos.
   - What's unclear: Whether newly uploaded photos should append to existing paths or replace them.
   - Recommendation: Append new photos to existing `photo_paths` array. The detail page should pass existing paths through, then merge with newly uploaded paths before calling updateJob.

3. **react-big-calendar date-fns version compatibility:**
   - What we know: react-big-calendar v1.19.4 officially supports date-fns v2. date-fns v3/v4 has breaking API changes.
   - What's unclear: Whether the project needs date-fns v2 specifically or if v3 works.
   - Recommendation: Install `date-fns@2` to guarantee compatibility. Verify the react-big-calendar changelog for v3 support before using a newer version.

4. **Search placement: /search page or on /board?**
   - What we know: Scope decisions say "Search & filters (/search or on /board)."
   - What's unclear: Final URL.
   - Recommendation: Use `/search` as a dedicated page. It handles both active and past jobs (SEARCH-01 requires "active and past"), whereas the board only shows active jobs. A dedicated search page avoids coupling search state to the board's dnd-kit state.

---

## Sources

### Primary (HIGH confidence)
- `github.com/jquense/react-big-calendar` — version (v1.19.4), localizer API, Calendar props, event shape
- `supabase.com/docs/reference/javascript/using-filters` — or() + ilike() syntax, eq/gte/lte filter chaining
- Project codebase: `mounttrack/src/actions/jobs.ts`, `mounttrack/src/app/(app)/jobs/[id]/job-detail-client.tsx`, `mounttrack/src/types/database.ts`, `mounttrack/package.json` — confirmed what is already built and what stack is in use

### Secondary (MEDIUM confidence)
- `supabase.com/docs/reference/javascript/textsearch` — textSearch() API (considered but not recommended for this use case; ilike + or is simpler for the search fields in scope)
- WebSearch: react-big-calendar Next.js App Router 'use client' pattern — confirmed that wrapping in 'use client' is the standard approach; no SSR issues documented

### Tertiary (LOW confidence)
- WebSearch: date-fns v3/v4 compatibility with react-big-calendar — not conclusively verified from official source; treat date-fns@2 as safe default

---

## Metadata

**Confidence breakdown:**
- Standard stack (react-big-calendar + date-fns + Supabase filters): HIGH — verified against GitHub README and official Supabase docs
- Architecture (server page + client calendar, URL-param search, queue list): HIGH — matches established Next.js App Router patterns already in use in this codebase
- Pitfalls (timezone shift, CSS conflicts, calendar height, numeric job_number search): HIGH — all derive from documented library behaviors or concrete codebase analysis
- JOB-04 notes feed decision: MEDIUM — requirement wording favors Option B but planner must make final call

**Research date:** 2026-03-08
**Valid until:** 2026-04-08 (react-big-calendar and Supabase JS are both stable; date-fns version question should be rechecked at install time)
