---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: unknown
last_updated: "2026-03-06T13:57:57.074Z"
progress:
  total_phases: 2
  completed_phases: 1
  total_plans: 9
  completed_plans: 6
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-01)

**Core value:** A taxidermy shop owner can intake a job, drag it through production stages, and have the customer automatically kept informed and able to pay — without the owner picking up the phone.
**Current focus:** Phase 2 — Job Intake Board (in progress)

## Current Position

Phase: 2 of 7 (Job Intake Board) — IN PROGRESS
Plan: 4 of 5 in current phase — COMPLETE
Status: 02-04 complete — Stage Manager at /settings/stages with full CRUD; 02-05 (Kanban board) remaining
Last activity: 2026-03-06 — 02-04 complete (stage manager + dnd-kit sortable)

Progress: [██████░░░░] 21% (6 of 29 estimated total plans)

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

### Pending Todos

None yet.

### Blockers/Concerns

- Twilio A2P 10DLC registration must be initiated at project kickoff — takes 2-4 weeks; blocks Phase 6 SMS delivery in production
- All package versions in stack research are based on August 2025 training data — verify against official releases before `npm install`
- Stripe Connect timing: confirm v1 platform-collects model is acceptable before Phase 5 planning; if shops need direct payouts from day one, Phase 3 scope changes

## Session Continuity

Last session: 2026-03-06
Stopped at: Completed 02-04-PLAN.md — Stage Manager at /settings/stages
Resume file: None
