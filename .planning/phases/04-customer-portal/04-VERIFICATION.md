---
phase: 04-customer-portal
verified: 2026-03-09T23:30:00Z
status: gaps_found
score: 10/13 must-haves verified
re_verification: false
gaps:
  - truth: "Customer receives a unique personal link via SMS and email at job intake (Success Criterion 1)"
    status: partial
    reason: "Portal link exists and owner can copy it manually, but no SMS or email delivery mechanism was built in Phase 4. The plan explicitly deferred SMS/email to Phase 6 as NOTIF-01/NOTIF-02, but the ROADMAP Success Criterion 1 and PORTAL-01 requirement state delivery must happen at intake. Phase 4 delivers only the manual-copy half of PORTAL-01."
    artifacts:
      - path: "mounttrack/src/app/(app)/jobs/[id]/job-detail-client.tsx"
        issue: "CopyButton + portalUrl built correctly. No sendSms/sendEmail call at job creation anywhere in codebase."
    missing:
      - "SMS and/or email delivery of portal link at job intake (deferred to Phase 6 per plan — flag for roadmap awareness)"

  - truth: "Portal shows estimated completion date; updates in real time when the owner changes it (PORTAL-04 / Success Criterion 2)"
    status: partial
    reason: "Portal renders the estimated_completion_date correctly on page load via SSR, but there is no real-time subscription (Supabase Realtime channel, polling, or useEffect) in portal/[token]/page.tsx or any child component. The date is current at load time only — a browser refresh is required to see owner changes."
    artifacts:
      - path: "mounttrack/src/app/portal/[token]/page.tsx"
        issue: "Pure Server Component — no realtime subscription. No client component wraps the date field to subscribe."
    missing:
      - "Realtime update mechanism: either a Supabase Realtime subscription in a Client Component wrapper, Next.js revalidation trigger (revalidatePath called on job update), or router.refresh() polling from a client shell"

  - truth: "Migration applied — jobs table actually has portal_token column in the database"
    status: failed
    reason: "The migration file 0003_portal_token.sql is correct and complete, but the SUMMARY explicitly documents it was NOT applied. Both supabase db push (no remote link) and supabase migration up --local (no local Supabase running) failed. The column does not exist in any running database."
    artifacts:
      - path: "mounttrack/supabase/migrations/0003_portal_token.sql"
        issue: "File is correct SQL. Migration not applied — blocked on Supabase connection."
    missing:
      - "Run: cd mounttrack && npx supabase link --project-ref <ref> && npx supabase db push"
      - "Or: cd mounttrack && npx supabase start && npx supabase migration up --local"
      - "Verify: SELECT portal_token FROM jobs LIMIT 1 should return a UUID"

human_verification:
  - test: "Open /portal/<valid-token> in incognito browser"
    expected: "Page loads with job data, branded header, stage timeline, completion date — no login redirect"
    why_human: "Requires live database with migration applied and a real job row with portal_token"
  - test: "Open /portal/invalid-random-string in any browser"
    expected: "Next.js 404 page — not a login redirect"
    why_human: "Requires live database to confirm notFound() fires"
  - test: "Tap any photo thumbnail in the portal photo grid"
    expected: "Native dialog opens full-screen. Pressing Escape or clicking backdrop closes it."
    why_human: "Dialog showModal() behavior and Escape key require browser interaction"
  - test: "Change the estimated_completion_date on a job, then view the portal without refreshing"
    expected: "If real-time is implemented: date updates automatically. Currently: refresh required."
    why_human: "Confirms whether real-time gap (Gap 2) is acceptable or must be fixed"
  - test: "View portal on a 375px-wide mobile screen"
    expected: "Single-column layout, no horizontal scroll, all content within viewport"
    why_human: "Layout verification requires browser DevTools or real device"
  - test: "Check portal footer and all visible text for 'MountTrack' string"
    expected: "No MountTrack branding visible anywhere in the rendered portal"
    why_human: "The comment in page.tsx confirms intent; human must verify rendered output"
---

# Phase 4: Customer Portal Verification Report

**Phase Goal:** Customers can follow their mount's progress through a branded, no-login portal accessible via a unique personal link — with real-time status, photos, and the shop's identity throughout.
**Verified:** 2026-03-09T23:30:00Z
**Status:** gaps_found
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

Truths derived from ROADMAP.md Success Criteria and plan `must_haves` frontmatter.

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Every job row has a unique, non-null portal_token UUID column — migration file exists with correct SQL | ✓ VERIFIED | `0003_portal_token.sql` contains ALTER TABLE + UNIQUE + INDEX + backfill |
| 2 | Migration applied to running database — jobs table has portal_token column | ✗ FAILED | SUMMARY documents both db push and local migration failed — column not in DB |
| 3 | Token lookups are fast via dedicated index on jobs.portal_token | ✓ VERIFIED | `CREATE INDEX IF NOT EXISTS jobs_portal_token_idx` present in migration |
| 4 | Job TypeScript interface includes portal_token with type safety | ✓ VERIFIED | `portal_token: string` on Job interface at line 57 of database.ts |
| 5 | Database Insert shape makes portal_token optional (DB has DEFAULT) | ✓ VERIFIED | Insert Omit includes 'portal_token', then re-adds as `portal_token?: string` |
| 6 | Service client uses persistSession: false | ✓ VERIFIED | `{ auth: { persistSession: false } }` at line 8 of service.ts |
| 7 | Customer can open /portal/<token> with no login — no auth redirect | ? HUMAN | Architecture correct: portal/ is sibling of (app)/, (app)/layout.tsx auth guard does not fire. Live test needed. |
| 8 | Portal shows all shop stages as a visual timeline with current stage highlighted in brand color | ✓ VERIFIED | StageTimeline renders ordered stages; isCurrent uses `border-[var(--brand)] bg-[var(--brand)]` |
| 9 | Portal shows estimated completion date; updates in real time when owner changes it | ✗ PARTIAL | Date rendered correctly on load. No realtime subscription exists — refresh required to see changes. |
| 10 | Portal shows progress photos loaded via 7-day signed URLs | ✓ VERIFIED | `createSignedUrls(photoPaths, 604800)` in page.tsx; photos passed to PhotoGrid |
| 11 | Customer can tap any photo to view full-screen in native dialog lightbox; Escape/backdrop closes it | ? HUMAN | Code implementation correct — `dialogRef.current?.showModal()`, backdrop onClick close. Browser test needed. |
| 12 | Portal header displays shop logo, shop name, and uses brand color — no MountTrack branding | ✓ VERIFIED | PortalHeader renders `shop.logo_url`, `shop.shop_name`, `bg-[var(--brand)]`. Footer shows only `shop.shop_name`. "MountTrack" appears only in a code comment, not rendered output. |
| 13 | Portal renders in single-column max-w-lg layout with no horizontal scroll on 375px mobile | ✓ VERIFIED | `<main className="mx-auto max-w-lg px-4 py-8">` — layout-only, no wide fixed elements visible |
| 14 | Invalid/non-existent token renders 404 (notFound()) | ? HUMAN | `if (!job) notFound()` is present; requires live DB to confirm no redirect instead |
| 15 | Owner can see Customer Portal Link section on job detail page with full portal URL | ✓ VERIFIED | SideCard "Customer Portal Link" at line 409 of job-detail-client.tsx; portalUrl = `${NEXT_PUBLIC_URL}/portal/${job.portal_token}` |
| 16 | Owner can copy portal URL to clipboard with a single button tap | ✓ VERIFIED | CopyButton calls `navigator.clipboard.writeText(value)` with 2-second "Copied!" state |
| 17 | Customer receives portal link via SMS and email at job intake | ✗ PARTIAL | Manual copy by owner exists (Plan 03). No SMS/email delivery built — explicitly deferred to Phase 6. PORTAL-01 requirement partially fulfilled. |

**Score:** 10/13 automated truths verified (3 gaps: migration unapplied, no realtime, no SMS/email delivery)

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `mounttrack/supabase/migrations/0003_portal_token.sql` | ALTER TABLE + UNIQUE + INDEX | ✓ VERIFIED | All SQL present; NOT applied to running DB |
| `mounttrack/src/types/database.ts` | portal_token on Job interface and Insert shape | ✓ VERIFIED | Line 57 (interface) + line 89-92 (Insert) |
| `mounttrack/src/lib/supabase/service.ts` | createServiceClient with persistSession: false | ✓ VERIFIED | Line 8 |
| `mounttrack/src/app/portal/[token]/page.tsx` | Server Component portal page — token lookup, signed URLs, branded render | ✓ VERIFIED | 111 lines; no 'use client'; params awaited; notFound() on missing job |
| `mounttrack/src/components/portal/stage-timeline.tsx` | StageTimeline — ordered stages, current highlighted | ✓ VERIFIED | 63 lines; exports StageTimeline; brand color via var(--brand) |
| `mounttrack/src/components/portal/photo-grid.tsx` | PhotoGrid — 2-col grid + native dialog lightbox | ✓ VERIFIED | 76 lines; 'use client'; showModal()/close() wired; Escape key native to dialog |
| `mounttrack/src/components/portal/portal-header.tsx` | PortalHeader — branded logo + shop name header | ✓ VERIFIED | 26 lines; exports PortalHeader; renders logo_url + shop_name in brand-colored header |
| `mounttrack/src/app/(app)/jobs/[id]/job-detail-client.tsx` | CopyButton + portal URL card in sidebar | ✓ VERIFIED | Lines 36-54 (CopyButton), 80 (portalUrl), 408-421 (SideCard) |
| `mounttrack/next.config.ts` | remotePatterns for signed photo URLs (/sign/**) | ✓ VERIFIED | Second pattern for `/storage/v1/object/sign/**` present |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `0003_portal_token.sql` | jobs table | ALTER TABLE + DEFAULT gen_random_uuid() | ✓ FILE WIRED | SQL correct; migration unapplied to DB |
| `src/types/database.ts Job interface` | portal page type safety | portal_token: string field | ✓ VERIFIED | Field present; downstream portal/[token]/page.tsx imports Job type |
| `portal/[token]/page.tsx` | createServiceClient() | import + call on line 29 | ✓ VERIFIED | `import { createServiceClient }` + `const supabase = createServiceClient()` |
| `portal/[token]/page.tsx` | supabase.storage.createSignedUrls | 604800s expiry | ✓ VERIFIED | `.createSignedUrls(photoPaths, 604800)` at line 17 |
| `portal/[token]/page.tsx` | StageTimeline, PhotoGrid, PortalHeader | RSC composition | ✓ VERIFIED | All three imported and rendered; --brand set on root div |
| `portal root div` | brand_color | --brand CSS custom property | ✓ VERIFIED | `style={{ '--brand': shop.brand_color } as React.CSSProperties}` line 63 |
| `job-detail-client.tsx CopyButton` | navigator.clipboard.writeText | async click handler | ✓ VERIFIED | Line 41: `await navigator.clipboard.writeText(value)` |
| `jobs/[id]/page.tsx` | portal_token in query | select('*') includes portal_token | ✓ VERIFIED | Line 15: `.select('*')` — portal_token in Job type means it's returned |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| PORTAL-01 | 04-01, 04-03 | Customer receives unique personal link via SMS and email at intake | ✗ PARTIAL | Portal link exists; manual copy by owner via CopyButton. SMS/email delivery deferred to Phase 6. The "receives" part of the requirement is unmet. |
| PORTAL-02 | 04-01, 04-02 | Customer can open portal via personal link with no login required | ✓ VERIFIED (pending live test) | portal/ is outside (app)/ auth group; service client used; no auth redirect in code path |
| PORTAL-03 | 04-02 | Portal shows visual progress timeline with current stage highlighted | ✓ VERIFIED | StageTimeline: isCurrent/isPast logic with brand-colored indicators |
| PORTAL-04 | 04-02 | Portal shows estimated completion date; updates in real time when owner changes it | ✗ PARTIAL | Date displayed on load. No realtime subscription — page must be refreshed. |
| PORTAL-05 | 04-02 | Portal is mobile-first — single column, large touch targets, no horizontal scroll | ✓ VERIFIED (pending visual test) | max-w-lg, single-column main; button touch targets use padding |
| PORTAL-06 | 04-02 | Customer can view progress photos the owner has uploaded | ✓ VERIFIED | 7-day signed URLs generated server-side; PhotoGrid renders 2-col thumbnail grid |
| PORTAL-07 | 04-02 | Customer can tap any photo to view it full-screen | ✓ VERIFIED (pending browser test) | PhotoGrid dialog lightbox: showModal on thumb click; close on backdrop or X button |
| PORTAL-08 | 04-02 | Portal branded with shop logo, name, and brand color — no MountTrack branding | ✓ VERIFIED | PortalHeader uses shop data; --brand propagated; "MountTrack" appears only in a code comment |

**Orphaned requirements:** None. All 8 PORTAL-01 through PORTAL-08 are claimed in plan frontmatter and verified above.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `job-detail-client.tsx` | 206, 228, 251, 296 | `placeholder="..."` | ℹ Info | HTML input placeholder attributes — not stub implementations. Expected for form fields. |
| `portal/[token]/page.tsx` | 104 | `{/* Minimal footer — shop name only, no MountTrack branding */}` | ℹ Info | Comment documents architectural intent. Not a stub. |

No stub implementations, empty handlers, or TODO/FIXME anti-patterns found in phase 4 files.

### Human Verification Required

#### 1. Unauthenticated Portal Access

**Test:** Open `/portal/<valid-uuid-token>` in an incognito browser window after migration is applied.
**Expected:** Job data renders — branded header, stage timeline, completion date, photos. No login redirect.
**Why human:** Requires live database with migration applied and a real job row.

#### 2. Invalid Token 404 Behavior

**Test:** Open `/portal/this-is-not-a-real-token` in any browser.
**Expected:** Next.js 404 page is shown. No redirect to `/login`.
**Why human:** `notFound()` requires a live DB query to return null.

#### 3. Photo Lightbox Interaction

**Test:** In the portal, tap any photo thumbnail.
**Expected:** Native dialog opens full-screen showing the photo. Press Escape or click the dark backdrop — dialog closes.
**Why human:** `dialog.showModal()` and Escape key behavior require browser interaction.

#### 4. Real-Time Date Behavior (Gap 2)

**Test:** With the portal open in one tab, change the estimated completion date on the job detail page in another tab. Without refreshing the portal tab, wait 10 seconds.
**Expected (if gap is acceptable):** Date does not change — a manual refresh is needed.
**Expected (if requirement is strict):** Date updates automatically.
**Why human:** This confirms whether the real-time gap is a blocker for this project's standards or acceptable as "current at load time."

#### 5. Mobile Layout at 375px

**Test:** Open portal in browser DevTools set to 375px width (iPhone SE).
**Expected:** Single-column layout, all content within viewport, no horizontal scroll, touch targets usable.
**Why human:** Layout correctness requires visual inspection.

#### 6. No MountTrack Branding in Rendered Portal

**Test:** View-source or inspect the rendered portal HTML.
**Expected:** The string "MountTrack" does not appear in any visible text, alt text, or title attribute.
**Why human:** Code analysis confirms no rendered MountTrack text, but final confirmation needs a rendered-output check.

### Gaps Summary

Three gaps prevent full goal achievement:

**Gap 1 — Migration Not Applied (Blocker for production use)**
The SQL migration file is correctly written but was never applied to the database. The portal cannot function — every token lookup will fail because the `portal_token` column does not exist. This is an infrastructure/setup gap, not a code gap. The fix is straightforward: apply the migration with `supabase db push` after linking the project.

**Gap 2 — No Real-Time Updates (PORTAL-04 partial)**
The REQUIREMENTS.md and ROADMAP.md Success Criterion both specify the estimated completion date "updates in real time." The portal page is a pure Server Component with no Supabase Realtime channel or polling. The date is accurate at page load but requires a browser refresh to reflect owner changes. Whether this constitutes a blocker depends on product judgment — the plan's own must_haves do not claim real-time behavior, suggesting this may have been accepted as out-of-scope for Phase 4. Flag for review.

**Gap 3 — PORTAL-01 SMS/Email Delivery Deferred**
The requirement says customers "receive" the link. Phase 4 only enables the owner to manually copy and share it. The plan explicitly scoped this as MVP and deferred SMS/email to Phase 6. This is a known, intentional gap — not a mistake. It means PORTAL-01 is partially fulfilled by Phase 4, with completion expected in Phase 6 (NOTIF-01/NOTIF-02).

---

_Verified: 2026-03-09T23:30:00Z_
_Verifier: Claude (gsd-verifier)_
