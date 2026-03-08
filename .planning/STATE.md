---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: unknown
last_updated: "2026-03-08T22:30:00Z"
progress:
  total_phases: 3
  completed_phases: 2
  total_plans: 12
  completed_plans: 12
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-01)

**Core value:** A taxidermy shop owner can intake a job, drag it through production stages, and have the customer automatically kept informed and able to pay — without the owner picking up the phone.
**Current focus:** Phase 3 — Job Detail Views & Search

## Current Position

Phase: 3 of 7 (Job Detail Views & Search) — IN PROGRESS
Plan: 3 of 3 in current phase — COMPLETE
Status: 03-03 complete — /search server component with full-text and composable filter support
Last activity: 2026-03-08 — 03-03 complete (/search page: text search via .or()/.ilike()/.eq(), stage/rush/overdue/date-range filters)

Progress: [███████░░░] 24% (9 of 29 estimated total plans)

## Performance Metrics

**Velocity:**
- Total plans completed: 5
- Average duration: 7 min
- Total execution time: 0.60 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-foundation | 4 | 37 min | 9 min |
| 02-job-intake-board | 1 | 5 min | 5 min |

**Recent Trend:**
- Last 5 plans: 10 min, 2 min, 10 min, 15 min, 5 min
- Trend: Consistent execution; schema/types plans faster than UI plans

*Updated after each plan completion*

| Plan | Duration | Tasks | Files |
|------|----------|-------|-------|
| Phase 01-foundation P01 | 10 min | 2 tasks | 17 files |
| Phase 01-foundation P02 | 2 min | 2 tasks | 8 files |
| Phase 01-foundation P03 | 10 min | 2 tasks | 10 files |
| Phase 01-foundation P04 | 15 min | 2 tasks | 15 files |
| Phase 02-job-intake-board P01 | 5 min | 2 tasks | 2 files |
| Phase 02-job-intake-board P04 | 3 min | 2 tasks | 5 files |
| Phase 02-job-intake-board P02 | 6 min | 2 tasks | 5 files |
| Phase 02-job-intake-board P03 | 9 | 2 tasks | 4 files |
| Phase 03-job-detail-views-search P03 | 8 | 1 tasks | 2 files |
| Phase 03-job-detail-views-search P01 | 12 min | 2 tasks | 2 files |

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- Multi-tenant SaaS enforced at DB level via Supabase RLS — must be established in Phase 1 before any feature work
- Dual Stripe flows (shop subscriptions via Billing + customer payments via Payment Intents) must be discriminated by metadata to avoid webhook corruption
- Customer portal uses token-only access (no login) — 32-byte crypto random token in URL
- Flat monthly subscription for shop owners (not per-job billing)
- No Stripe Connect in v1 — all customer payments route through MountTrack's platform Stripe account
- [Phase 01-foundation]: src/proxy.ts with exported proxy function (not middleware.ts) — Next.js 16 proxy API pattern
- [Phase 01-foundation]: getClaims() returns { claims } (JWT payload) not { user } — use claims.sub as userId in server-side auth checks
- [Phase 01-foundation P02]: Server Actions use (prevState, formData) two-parameter signature — required by useActionState in React 19
- [Phase 01-foundation P02]: /auth/confirm placed outside (auth) route group — Supabase email links must bypass the auth gate
- [Phase 01-foundation P02]: forgotPassword always returns same response regardless of email existence — prevents enumeration
- [Phase 01-foundation P03]: Stripe checkout includes shop_id in BOTH session.metadata AND subscription_data.metadata — session metadata handles checkout.session.completed, subscription metadata handles subscription lifecycle events
- [Phase 01-foundation P03]: Supabase hand-written types require (supabase.from() as any) with explicit return type assertions for insert/update/upsert — supabase-js v2.98 GenericSchema constraint causes never inference without Relationships/Views/Functions fields
- [Phase 01-foundation P03]: /onboarding/complete polls shop record for subscription_status=active — handles Stripe redirect arriving before async webhook fires
- [Phase 01-foundation P04]: Client component wrappers (ShopSettingsForm, BrandingForm, BillingPortalButton) used for forms needing useActionState — keeps Server Component pages while supporting React 19 form state
- [Phase 01-foundation P04]: ThemeToggle renders placeholder before mount (useEffect + mounted state) — avoids hydration mismatch with next-themes SSR
- [Phase 01-foundation P04]: next.config.ts remotePatterns required for *.supabase.co — next/image won't load external URLs without this
- [Phase 02-job-intake-board P01]: get_next_job_number uses SECURITY DEFINER — counter write must bypass RLS insert policy
- [Phase 02-job-intake-board P01]: seed_default_stages trigger is SECURITY DEFINER — fires as postgres role so stages can be inserted before shop owner's RLS session is established
- [Phase 02-job-intake-board P01]: stage_id FK on jobs uses ON DELETE RESTRICT — stages with jobs cannot be deleted, prevents orphaned jobs
- [Phase 02-job-intake-board P01]: is_overdue is TypeScript-only optional field — computed at application layer, not stored in DB
- [Phase 02-job-intake-board]: dnd-kit listeners on grip handle only so rename/delete buttons remain clickable without triggering drag
- [Phase 02-job-intake-board]: deleteStage guards: stageCount <= 1 blocks last-stage delete, jobCount > 0 blocks delete of occupied stage
- [Phase 02-job-intake-board]: Settings page pattern: Server Component page + use client manager child component receiving initialX prop
- [Phase 02-job-intake-board]: PhotoUploadZone uses forwardRef + useImperativeHandle to expose uploadAll — canonical pattern for imperative async APIs from child components
- [Phase 02-job-intake-board]: Zod v4 + zodResolver: remove .default() from boolean schema fields, use defaultValues in useForm; use z.string().refine() for numeric fields to avoid unknown inference
- [Phase 02-job-intake-board]: supabase.rpc() cast as (supabase as any).rpc() with explicit return type — same GenericSchema workaround as supabase.from() as any
- [Phase 02-job-intake-board]: is_overdue computed in SQL at query time (estimated_completion_date < now()::date) for server clock accuracy
- [Phase 02-job-intake-board]: useDroppable on column container required for empty columns to accept drops — SortableContext alone insufficient
- [Phase 02-job-intake-board]: PointerSensor activationConstraint distance:5 allows button clicks in cards without triggering drag
- [Phase 02-job-intake-board]: Bulk select state lifted into KanbanBoard — ready for Plan 05 toolbar without refactor
- [Phase 03-job-detail-views-search P01]: addJobPhotos fetches existing photo_paths before merging — append-safe pattern, avoids overwriting existing photos
- [Phase 03-job-detail-views-search P01]: PhotoUploadZone onUploadComplete prop used (not onFilesSelected) — actual component interface; uploadAll() return value provides paths; onUploadComplete clears feedback state only
- [Phase 03-job-detail-views-search]: job_number search uses .eq() not .ilike() — ilike on numeric columns throws in Postgres
- [Phase 03-job-detail-views-search]: Search page only queries DB when hasQuery is true — avoids full table scan on empty /search visit
- [Phase 03-job-detail-views-search]: JOB-05 (communication history) explicitly deferred to Phase 6 — not implemented in search plan

### Pending Todos

None yet.

### Blockers/Concerns

- Twilio A2P 10DLC registration must be initiated at project kickoff — takes 2-4 weeks; blocks Phase 6 SMS delivery in production
- All package versions in stack research are based on August 2025 training data — verify against official releases before `npm install`
- Stripe Connect timing: confirm v1 platform-collects model is acceptable before Phase 5 planning; if shops need direct payouts from day one, Phase 3 scope changes

## Session Continuity

Last session: 2026-03-08
Stopped at: Completed 03-01-PLAN.md — photo upload on job detail page (addJobPhotos action + Add Photos SideCard)
Resume file: None
