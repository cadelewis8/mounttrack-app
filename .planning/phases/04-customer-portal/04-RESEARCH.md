# Phase 4: Customer Portal — Research

**Researched:** 2026-03-09
**Domain:** Next.js App Router unauthenticated routes, Supabase token-gated access, Supabase Storage signed URLs, mobile-first branded UI
**Confidence:** HIGH

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| PORTAL-01 | Customer receives a unique personal link via SMS and email at job intake | Phase 4 builds the portal page and link display on the owner job detail; SMS/email delivery is Phase 6. Token column migration covers this. |
| PORTAL-02 | Customer can open their portal via the personal link with no login or account required | Route outside (app) auth group + anonymous Supabase client with no session required. |
| PORTAL-03 | Portal shows a visual progress timeline of all stages with the current stage highlighted | Stages fetched by shop_id (derived from job row). Custom StageTimeline component — no library needed. |
| PORTAL-04 | Portal shows the estimated completion date; updates in real time when the owner changes it | "Real-time" = fresh server render on each page load. No WebSocket needed in Phase 4. |
| PORTAL-05 | Portal is mobile-first — single column layout, large touch targets, no horizontal scroll | Tailwind responsive utilities. Single-column max-w-lg mx-auto layout. |
| PORTAL-06 | Customer can view progress photos the owner has uploaded | Supabase Storage signed URLs with 7-day expiry generated server-side at render time. |
| PORTAL-07 | Customer can tap any photo to view it full-screen | CSS-only `<dialog>` lightbox or tiny next-image + Tailwind overlay. No JS lightbox library needed. |
| PORTAL-08 | Portal is branded with the shop's logo, name, and custom brand color — no MountTrack branding visible | Shop row fetched alongside job. brand_color applied via inline CSS custom property. |
</phase_requirements>

---

## Summary

Phase 4 adds a single public-facing surface to an otherwise fully authenticated Next.js application: a branded, read-only customer portal accessible via a unique UUID token in the URL. The token acts as the credential — no session, no login. The implementation requires three coordinated pieces: (1) a DB migration adding a `portal_token` UUID column to the `jobs` table, (2) a new Next.js route at `/portal/[token]` that lives completely outside the `(app)` auth-gated route group, and (3) server-side generation of Supabase Storage signed URLs so unauthenticated customers can see photos without needing a Supabase session.

The portal itself is a Server Component page. It fetches the job by token (using the Supabase service role key, since the customer has no auth session), derives the shop from `shop_id`, fetches all stages for that shop, generates signed photo URLs server-side, and renders everything in a single pass. There is no client-side data fetching, no WebSocket, and no real-time subscription — "real-time" simply means the customer gets the current state on every page load.

The UI is three components: a `StageTimeline` (all stages with current one highlighted), a `PhotoGrid` with a full-screen lightbox on tap, and a branded header/footer using the shop's `logo_url`, `shop_name`, and `brand_color`. Brand color is applied via a single inline CSS custom property on the root element, which Tailwind's `[--brand]` arbitrary value syntax can consume. On the owner side, the job detail page gains a "Portal Link" section showing the shareable URL so the owner can copy and send it manually (Phase 6 will automate SMS/email delivery).

**Primary recommendation:** Add `portal_token UUID DEFAULT gen_random_uuid() NOT NULL UNIQUE` to the jobs table, place the portal route at `src/app/portal/[token]/page.tsx` (outside all route groups), use the Supabase **service role** client for the token lookup (no RLS session), and generate signed photo URLs server-side with a 604800-second (7-day) expiry.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js App Router | (project version) | `/portal/[token]` Server Component page | Already in project; RSC eliminates client JS for static portal content |
| Supabase JS (server) | (project version) | Token lookup + signed URL generation | Already in project; service role client bypasses RLS for public token read |
| Tailwind CSS | (project version) | Mobile-first layout and brand color | Already in project; arbitrary CSS vars via `[var(--brand)]` syntax |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| next/image | (built-in) | Photo display with optimisation | All customer-facing photos — handles resizing, WebP conversion |
| HTML `<dialog>` element | (native) | Full-screen photo lightbox | No library needed; CSS + minimal JS `showModal()`/`close()` covers PORTAL-07 |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `<dialog>` lightbox | yet-another-react-lightbox / photoswipe | Adds ~20 KB JS bundle to a page that should be near-zero JS; overkill for simple full-screen tap |
| Server Component page | Client Component with `useEffect` fetch | Server Component gives zero client JS, faster FCP on mobile, and no auth session complexity |
| Service role client | Supabase anon key + RLS public policy | Service role is simpler and safer — no public RLS policy to misconfigure; token IS the credential |

**Installation:** No new packages required. Everything needed is already installed.

---

## Architecture Patterns

### Recommended Project Structure
```
src/
├── app/
│   ├── (app)/                    # Existing auth-gated group (unchanged)
│   └── portal/
│       └── [token]/
│           └── page.tsx          # Server Component — the entire portal
├── components/
│   ├── portal/
│   │   ├── stage-timeline.tsx    # Visual stage progress component
│   │   ├── photo-grid.tsx        # Photo grid + lightbox (client component)
│   │   └── portal-header.tsx     # Branded header (logo, shop name, brand color)
│   └── ...                       # Existing components (unchanged)
└── lib/
    └── supabase/
        ├── server.ts             # Existing authenticated client
        └── service.ts            # New: service role client for portal lookups
```

### Pattern 1: Route Outside Auth Group

**What:** The portal route lives at `src/app/portal/[token]/page.tsx` — a sibling of `(app)`, not nested inside it. This means the `(app)` layout (which enforces authentication) never runs for portal requests.

**When to use:** Any publicly accessible page in a Next.js app that also has an authenticated section.

```typescript
// src/app/portal/[token]/page.tsx
// Source: Next.js App Router docs — Route Groups
import { notFound } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/service'

export default async function PortalPage({
  params,
}: {
  params: { token: string }
}) {
  const supabase = createServiceClient()

  // Look up job by token — no auth session needed
  const { data: job } = await (supabase.from('jobs') as any)
    .select('*, shops(*), stages(*)')
    .eq('portal_token', params.token)
    .single() as { data: JobWithShopAndStages | null }

  if (!job) notFound()

  // Generate signed URLs server-side (7-day expiry)
  const signedPhotoUrls = await getSignedPhotoUrls(supabase, job.photo_paths)

  return (
    <div style={{ '--brand': job.shops.brand_color } as React.CSSProperties}>
      <PortalHeader shop={job.shops} />
      <StageTimeline stages={allStages} currentStageId={job.stage_id} />
      <PhotoGrid photos={signedPhotoUrls} />
    </div>
  )
}
```

### Pattern 2: Service Role Client

**What:** A separate Supabase client using `SUPABASE_SERVICE_ROLE_KEY` that bypasses RLS entirely. Used only server-side for the portal token lookup.

**When to use:** Server-only pages where the access credential is a token in the URL (not a user session). Never expose the service role key to the client.

```typescript
// src/lib/supabase/service.ts
// Source: Supabase docs — service_role key usage
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

export function createServiceClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!, // server-only env var (no NEXT_PUBLIC_)
    { auth: { persistSession: false } }
  )
}
```

### Pattern 3: Server-Side Signed Photo URLs

**What:** Generate signed read URLs for all of a job's photos at page render time, with a 7-day (604800 second) expiry. The customer's browser loads photos directly from Supabase Storage using these URLs — no auth session needed.

**When to use:** Any time unauthenticated users need to view files stored in a private Supabase Storage bucket.

```typescript
// Inside portal page.tsx server component
async function getSignedPhotoUrls(
  supabase: ReturnType<typeof createServiceClient>,
  photoPaths: string[]
): Promise<string[]> {
  if (!photoPaths.length) return []

  const { data, error } = await (supabase.storage as any)
    .from('job-photos')
    .createSignedUrls(photoPaths, 604800) // 7 days in seconds

  if (error || !data) return []
  return data.map((item: { signedUrl: string }) => item.signedUrl)
}
```

### Pattern 4: Brand Color via CSS Custom Property

**What:** Apply the shop's `brand_color` hex value as an inline CSS custom property on the portal root element. Tailwind can reference it via arbitrary value syntax.

```tsx
// Root element of portal page
<div style={{ '--brand': shop.brand_color } as React.CSSProperties}>
  {/* Tailwind usage: className="bg-[var(--brand)] text-[var(--brand)]" */}
</div>
```

### Pattern 5: DB Migration — portal_token Column

**What:** Add a UUID token column to the `jobs` table with a server-generated default. Existing rows get tokens via the DEFAULT at migration time.

```sql
-- Migration: add portal_token to jobs
ALTER TABLE jobs
  ADD COLUMN portal_token UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE;

-- Index for fast token lookups (portal page load)
CREATE INDEX jobs_portal_token_idx ON jobs (portal_token);

-- RLS: No new policy needed — service role bypasses RLS
-- The portal_token is never exposed via any authenticated API endpoint
-- unless explicitly selected
```

**TypeScript type update required:**
```typescript
// src/types/database.ts — add to Job interface
portal_token: string  // UUID — used as the public portal URL token
```

### Pattern 6: Stage Timeline Component

**What:** A horizontal (desktop) / vertical (mobile) list of all stages for the shop, with the current stage visually highlighted using the brand color.

```tsx
// src/components/portal/stage-timeline.tsx
// Pure presentational — no client JS needed
export function StageTimeline({
  stages,
  currentStageId,
  brandColor,
}: {
  stages: Stage[]
  currentStageId: string | null
  brandColor: string
}) {
  return (
    <ol className="flex flex-col gap-2 sm:flex-row sm:gap-0">
      {stages.map((stage, i) => {
        const isCurrent = stage.id === currentStageId
        const isPast = stages.findIndex(s => s.id === currentStageId) > i
        return (
          <li
            key={stage.id}
            className="flex items-center gap-2"
            style={isCurrent ? { color: brandColor } : undefined}
          >
            <span className={isCurrent ? 'font-bold' : isPast ? 'opacity-50' : ''}>
              {stage.name}
            </span>
          </li>
        )
      })}
    </ol>
  )
}
```

### Pattern 7: Owner Job Detail — Portal Link Display

**What:** Show the portal URL on the owner's job detail page so they can copy and share it manually. Phase 6 will automate sending it via SMS/email.

```tsx
// In job-detail-client.tsx or a new PortalLinkCard server component
const portalUrl = `${process.env.NEXT_PUBLIC_APP_URL}/portal/${job.portal_token}`

<div className="rounded-lg border p-4">
  <p className="text-sm font-medium">Customer Portal Link</p>
  <div className="flex items-center gap-2 mt-1">
    <code className="text-xs break-all">{portalUrl}</code>
    <CopyButton value={portalUrl} />  {/* small client component */}
  </div>
</div>
```

### Anti-Patterns to Avoid

- **Putting `/portal` inside `(app)` route group:** The `(app)` layout enforces auth. Portal customers have no session — they will hit the auth redirect and see a login page.
- **Using anon Supabase key + public RLS policy for token lookup:** Creates a public RLS policy on the jobs table that could be queried without a token if misconfigured. Service role + server-only is safer.
- **Generating signed URLs client-side:** Would require exposing the service role key to the browser. Always generate signed URLs in the Server Component.
- **Storing portal_token as a non-UNIQUE column:** Token must have a UNIQUE constraint — collisions (however unlikely with UUID v4) would expose the wrong customer's job.
- **Fetching stages via shop_id exposed from job row — RLS concern:** The service role bypasses RLS, so this is fine. But if you ever switch to anon key, you need a policy allowing stages to be read when the requester has a valid portal token.
- **Not indexing portal_token:** Every portal page load does a full table scan without the index. Add `CREATE INDEX jobs_portal_token_idx ON jobs (portal_token)` in the migration.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Signed URL generation | Custom URL signing / token append logic | `supabase.storage.createSignedUrls()` | Supabase handles expiry, HMAC signing, bucket policy enforcement |
| UUID token generation | Custom random string generator | `gen_random_uuid()` DB default | Cryptographically secure, collision-resistant, zero application code |
| Full-screen photo lightbox | Custom CSS modal + JS state machine | HTML `<dialog>` + `showModal()` | Native browser API, accessibility (focus trap, Escape key) built-in |
| Mobile responsive layout | Custom CSS breakpoints | Tailwind `sm:` / `md:` prefixes | Already in project, consistent with rest of app |

**Key insight:** The "hard" parts of this phase (token security, file access control, UUID generation) are all solved by existing infrastructure (Supabase + PostgreSQL). The implementation is mostly routing architecture and UI composition.

---

## Common Pitfalls

### Pitfall 1: Portal Route Inside Auth Group
**What goes wrong:** Customer opens their portal link and lands on the login page.
**Why it happens:** Developer places `portal/[token]` inside `(app)/` — the `(app)` layout's auth check fires and redirects unauthenticated visitors.
**How to avoid:** Place `src/app/portal/` as a sibling directory to `src/app/(app)/`, not inside it.
**Warning signs:** Portal URL works when logged in as owner, fails in incognito/fresh browser.

### Pitfall 2: Service Role Key Leaked to Client Bundle
**What goes wrong:** `SUPABASE_SERVICE_ROLE_KEY` appears in browser network requests or JS bundle.
**Why it happens:** Using the service role client in a Client Component, or naming the env var with `NEXT_PUBLIC_` prefix.
**How to avoid:** Only create the service client in Server Components or Route Handlers. Never prefix with `NEXT_PUBLIC_`. Verify with `next build` — it will warn about server-only env vars in client bundles.
**Warning signs:** Browser DevTools > Network shows `Authorization: Bearer <long key>` on direct Supabase requests.

### Pitfall 3: Photo URLs Expire Before Customer Views Them
**What goes wrong:** Customer bookmarks portal, returns a week later, photos show broken image icons.
**Why it happens:** Signed URL expiry is set too short (e.g., 1 hour).
**How to avoid:** Use 604800 seconds (7 days) as the expiry. Acceptable tradeoff — portal is meant for active jobs, not long-term archiving. Phase 5/6 can revisit if needed.
**Warning signs:** Photos visible on first visit, missing on return visits.

### Pitfall 4: `notFound()` Leaks Information
**What goes wrong:** Attacker can probe for valid tokens by observing different HTTP responses for valid vs. invalid tokens.
**Why it happens:** Returning 404 for missing tokens vs. some other error for malformed tokens creates an oracle.
**How to avoid:** Call `notFound()` for ALL cases where the job cannot be found (missing token, expired, deleted job). Uniform 404 response gives no information.
**Warning signs:** Different error pages for different invalid token patterns.

### Pitfall 5: Missing `portal_token` in TypeScript Job type
**What goes wrong:** TypeScript errors when accessing `job.portal_token` on the Job interface. Developers add `as any` casts.
**Why it happens:** DB migration adds the column but `src/types/database.ts` is not updated.
**How to avoid:** Update Job interface and Database type in the same wave as the migration task.
**Warning signs:** `Property 'portal_token' does not exist on type 'Job'` TS errors.

### Pitfall 6: Brand Color Not Applied to Portal Header Background
**What goes wrong:** Portal header uses generic gray/white instead of shop's brand color. PORTAL-08 fails.
**Why it happens:** `brand_color` hex value is in the data but not wired to the component styles.
**How to avoid:** Pass `brand_color` as an inline CSS custom property (`--brand`) at the root. Use `bg-[var(--brand)]` in Tailwind.
**Warning signs:** Portal looks identical regardless of which shop's job you visit.

---

## Code Examples

### Complete DB Migration
```sql
-- Source: PostgreSQL docs + Supabase migration pattern used in phases 1-3
ALTER TABLE jobs
  ADD COLUMN IF NOT EXISTS portal_token UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE;

CREATE INDEX IF NOT EXISTS jobs_portal_token_idx ON jobs (portal_token);

-- Backfill existing rows (DEFAULT handles new inserts; existing rows need explicit update)
UPDATE jobs SET portal_token = gen_random_uuid() WHERE portal_token IS NULL;
```

### Portal Page — Full Server Component Sketch
```typescript
// src/app/portal/[token]/page.tsx
// Source: Next.js App Router docs + Supabase docs
import { notFound } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/service'
import { StageTimeline } from '@/components/portal/stage-timeline'
import { PhotoGrid } from '@/components/portal/photo-grid'
import { PortalHeader } from '@/components/portal/portal-header'
import type { Job, Shop, Stage } from '@/types/database'

type PortalJob = Job & { shops: Shop }

export default async function PortalPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const supabase = createServiceClient()

  // Look up job by portal_token — no auth session required
  const { data: job } = await (supabase.from('jobs') as any)
    .select('*, shops(*)')
    .eq('portal_token', token)
    .single() as { data: PortalJob | null }

  if (!job) notFound()

  // Fetch all stages for this shop (for timeline)
  const { data: stages } = await (supabase.from('stages') as any)
    .select('*')
    .eq('shop_id', job.shop_id)
    .order('position', { ascending: true }) as { data: Stage[] | null }

  // Generate signed photo URLs server-side (7-day expiry)
  const signedUrls: string[] = []
  if (job.photo_paths.length > 0) {
    const { data: signed } = await (supabase.storage as any)
      .from('job-photos')
      .createSignedUrls(job.photo_paths, 604800)
    if (signed) signedUrls.push(...signed.map((s: { signedUrl: string }) => s.signedUrl))
  }

  return (
    <div
      className="min-h-screen bg-white"
      style={{ '--brand': job.shops.brand_color } as React.CSSProperties}
    >
      <PortalHeader shop={job.shops} />
      <main className="max-w-lg mx-auto px-4 py-8 space-y-8">
        <div>
          <h2 className="text-lg font-semibold mb-1">Your Mount Status</h2>
          <StageTimeline
            stages={stages ?? []}
            currentStageId={job.stage_id}
          />
        </div>
        <div>
          <p className="text-sm text-gray-500">
            Estimated completion:{' '}
            <span className="font-medium text-gray-900">
              {job.estimated_completion_date}
            </span>
          </p>
        </div>
        {signedUrls.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-3">Progress Photos</h2>
            <PhotoGrid photos={signedUrls} />
          </div>
        )}
      </main>
    </div>
  )
}
```

### `params` Await Pattern (Next.js 16)
```typescript
// Next.js 15+ changed params to be a Promise
// Source: Next.js 15 upgrade guide
export default async function PortalPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params  // Must await — not params.token directly
  // ...
}
```

### PhotoGrid with Native Dialog Lightbox
```tsx
// src/components/portal/photo-grid.tsx
'use client'
import Image from 'next/image'
import { useRef, useState } from 'react'

export function PhotoGrid({ photos }: { photos: string[] }) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [activePhoto, setActivePhoto] = useState<string | null>(null)

  const open = (url: string) => {
    setActivePhoto(url)
    dialogRef.current?.showModal()
  }
  const close = () => {
    dialogRef.current?.close()
    setActivePhoto(null)
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {photos.map((url, i) => (
          <button
            key={i}
            onClick={() => open(url)}
            className="aspect-square relative overflow-hidden rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--brand)]"
          >
            <Image src={url} alt={`Progress photo ${i + 1}`} fill className="object-cover" />
          </button>
        ))}
      </div>
      <dialog
        ref={dialogRef}
        onClick={close}
        className="fixed inset-0 w-screen h-screen max-w-none max-h-none m-0 p-4 bg-black/90 backdrop:bg-transparent"
      >
        {activePhoto && (
          <div className="relative w-full h-full">
            <Image src={activePhoto} alt="Full screen photo" fill className="object-contain" />
          </div>
        )}
      </dialog>
    </>
  )
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `params.token` (direct access) | `const { token } = await params` | Next.js 15 | params is now a Promise — must be awaited |
| Custom lightbox libraries (lightgallery, photoswipe) | Native HTML `<dialog>` + `showModal()` | Browsers ~2022+ | Full accessibility (focus trap, Escape close) with zero dependencies |
| Manually generating UUID tokens in application code | `gen_random_uuid()` DB default | PostgreSQL 13+ (pgcrypto built-in) | Zero application code, cryptographically secure, collision-resistant |

**Note:** The project's STATE.md records that params must be awaited in Next.js 16 (see `[Phase 01-foundation]` decision re proxy.ts pattern). The portal page must follow this same pattern.

---

## Open Questions

1. **Should `portal_token` be exposed in the authenticated jobs API?**
   - What we know: The service role client fetches it for the portal. The authenticated owner API (`supabase.from('jobs').select(*)`) will also return it under RLS.
   - What's unclear: Is it a security concern that the owner can see their customers' portal tokens in API responses? (Probably fine — the owner IS sharing the link.)
   - Recommendation: Include it in the full select. The owner needs it to display the portal link on the job detail page.

2. **`NEXT_PUBLIC_APP_URL` env var for generating the portal link**
   - What we know: The portal URL displayed on the job detail page needs the base URL (e.g., `https://app.mounttrack.com/portal/<token>`).
   - What's unclear: Is `NEXT_PUBLIC_APP_URL` already defined in the project's `.env.local`?
   - Recommendation: Add `NEXT_PUBLIC_APP_URL=http://localhost:3000` to `.env.local` in Wave 0 of the plan, and document it in `.env.example`.

3. **`next/image` remotePatterns for Supabase Storage signed URLs**
   - What we know: STATE.md records that `next.config.ts remotePatterns required for *.supabase.co` was established in Phase 1.
   - What's unclear: Confirm the existing pattern covers signed URLs (they use the same `*.supabase.co` hostname).
   - Recommendation: Verify the existing `remotePatterns` entry covers `*.supabase.co` — it should already work from Phase 1 work.

---

## Sources

### Primary (HIGH confidence)
- Next.js App Router docs — Route Groups, Server Components, dynamic params as Promise
- Supabase JS docs — `storage.createSignedUrls()`, service role client, `createClient` with `persistSession: false`
- PostgreSQL docs — `gen_random_uuid()`, `DEFAULT` expressions, `UNIQUE` constraint
- Project source: `mounttrack/src/types/database.ts` — existing Job, Shop, Stage types
- Project source: `mounttrack/src/actions/jobs.ts` — established patterns (service client, as-any casts, GenericSchema workaround)
- Project source: `.planning/STATE.md` — recorded decisions (await params, remotePatterns, service role patterns)

### Secondary (MEDIUM confidence)
- HTML Living Standard — `<dialog>` element, `showModal()`, `close()` methods
- Tailwind CSS docs — arbitrary CSS variable syntax `[var(--brand)]`

### Tertiary (LOW confidence)
- None — all findings grounded in primary sources or existing project patterns.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new packages required; all patterns from existing project
- Architecture: HIGH — route group structure and service client pattern are well-documented and match existing project conventions
- Pitfalls: HIGH — based on verified Next.js/Supabase behavior, not speculation
- DB migration: HIGH — standard PostgreSQL UUID default pattern

**Research date:** 2026-03-09
**Valid until:** 2026-04-09 (30 days — stable stack)
