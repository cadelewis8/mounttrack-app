# Project Research Summary

**Project:** MountTrack
**Domain:** Multi-tenant taxidermy shop management SaaS
**Researched:** 2026-03-01
**Confidence:** MEDIUM

## Executive Summary

MountTrack is a vertical SaaS product for independent taxidermy shops — a niche trade-shop management tool that combines job tracking, customer communication, and payment collection. The domain maps closely to established small-business service SaaS patterns (auto repair, pet grooming, print shops), with two taxidermy-specific characteristics that shape the entire architecture: jobs span months not days, and customers are essentially unreachable without proactive outreach. The product's core value proposition is a single sentence — "intake a job, move it through stages, and the customer is automatically kept informed and can pay online" — and every technical decision should be evaluated against whether it advances or complicates that outcome.

The recommended approach is a Next.js 15 App Router application hosted on Vercel, backed by Supabase for auth, database (PostgreSQL with row-level security), file storage, and real-time. Stripe handles two completely separate payment flows: shop owner subscriptions (Stripe Billing) and customer job payments (Payment Intents). SMS and email notifications run through Twilio and Resend respectively. Multi-tenancy is enforced at the database level through Supabase RLS, making it impossible for a broken API route to leak cross-tenant data. The customer portal is a no-login, token-gated page that reflects the shop's branding — customers never see MountTrack.

The two highest risks in this build are multi-tenancy correctness and the dual Stripe payment flow. RLS misconfiguration is silent — data leaks produce no errors — and a missing policy on any table exposes all tenant data. The Stripe dual-flow risk is that a single webhook endpoint receives both subscription lifecycle events and customer payment events; without explicit metadata discrimination, the two flows corrupt each other's state. Both risks must be addressed in Phase 1 before any feature work proceeds. A third significant operational risk is Twilio A2P 10DLC registration: without it, all SMS notifications fail silently in production and registration takes 2-4 weeks. This must begin at project kickoff.

---

## Key Findings

### Recommended Stack

The stack is a tightly integrated set of services that avoids redundancy. Supabase replaces what would otherwise be separate auth, database, storage, and real-time services. The Next.js App Router's Server Components eliminate boilerplate API routes for owner-facing reads while Server Actions handle mutations. The most consequential technology choice is `@supabase/ssr` (not the deprecated `@supabase/auth-helpers-nextjs`) — this distinction matters because the wrong package causes auth to fail silently in the App Router's server context.

All versions were researched based on training data through August 2025 with web tools unavailable. Specific package versions should be verified against official releases before project initialization.

**Core technologies:**
- **Next.js 15 (App Router):** Full-stack framework — Server Components for read-heavy dashboard, Server Actions for mutations, Edge Middleware for tenant routing
- **Supabase:** Single managed backend providing auth + PostgreSQL + Storage + Realtime — RLS at DB level enforces tenant isolation even if API code is wrong
- **`@supabase/ssr`:** Required App Router integration package — replaces deprecated auth-helpers; provides `createServerClient` and `createBrowserClient`
- **Stripe (dual context):** Billing API for shop subscriptions + Payment Intents for customer portal payments — two flows that must never be conflated
- **Twilio + Resend:** SMS and transactional email for automated stage-change notifications — shop-branded, not MountTrack-branded
- **`@dnd-kit/core` + `@dnd-kit/sortable`:** Accessibility-first, touch-compatible drag-and-drop — the only maintained option (react-beautiful-dnd is archived)
- **Tailwind CSS v4 + shadcn/ui:** Styling without component library lock-in — shadcn components are copied into the repo, not imported as a dependency
- **Zustand + TanStack Query:** Client UI state (drag state, modals) and server state caching respectively — do not use either for the other's purpose
- **Zod:** Schema validation shared between client forms and server-side Server Action input validation, including Stripe webhook payload typing
- **Vercel:** Hosting with first-class Next.js support, Edge Middleware for portal routing, and per-PR preview deployments

**What to avoid:**
- `@supabase/auth-helpers-nextjs` (deprecated, App Router incompatible)
- `react-beautiful-dnd` (unmaintained since 2023, no touch support)
- Any ORM (Prisma/Drizzle) — loses RLS benefits and duplicates the Supabase client abstraction
- Pusher/Socket.io — Supabase Realtime is already included
- MUI/Chakra UI — fights with Tailwind and hard to theme for per-shop brand colors

---

### Expected Features

The taxidermy domain imposes specific feature expectations that generic shop-management software misses: jobs are measured in months, seasonal intake spikes can bring 60-100 jobs in 8 weeks, and the core owner pain is tracking what stage 80+ active mounts are in without losing jobs on a whiteboard.

**Must have — table stakes for v1:**
- Job intake form (customer name, phone, email, animal type, mount style, price, deposit — deposit is required, not optional in this domain)
- Unique job numbers (e.g., `2026-0042` format)
- Kanban stage board with drag-and-drop and customizable stages per shop
- Customer portal — no-login, token URL, mobile-first, shows stage timeline, photos, balance
- Branded SMS + email notification on every stage change (Twilio + Resend, shop branding only)
- Stripe payment on customer portal (Payment Intents, partial payments supported)
- Overdue job flagging and rush flag on Kanban cards
- Search and filter jobs (name, job number, status, animal type)
- Deposit vs. balance tracking per job
- Basic revenue and outstanding balance reports
- Mobile-first UI throughout (owner works on the shop floor with a phone)
- Photo attachments per job (camera capture on mobile)

**Should have — differentiators that justify monthly payment:**
- Visual Kanban with column job counts and horizontal scroll for 6+ stages
- Progress photo gallery on customer portal with tap-to-expand
- Auto payment link sent when job reaches "Ready for Pickup" stage
- Per-job communication history (log of all SMS/email sent)
- Referral source tracking at intake
- Queue/backlog view with estimated completion dates and overdue sorting
- Bulk stage move (multi-select, move all to next stage — critical for batch processing)
- Dark mode (owner may work in low-light environments)

**Defer to v2:**
- Calendar view of estimated completion dates
- Waitlist / pre-intake flow
- Supply alerts
- Referral source reports (requires accumulated data)

**Defer to v3+:**
- Multi-user / employee assignment per job
- AI completion date estimates
- Accounting integrations (CSV export covers v1 need)
- Customer reviews/feedback
- Native iOS/Android app (mobile-first web + PWA covers the owner use case)

**Never build:**
- Customer login/accounts — token URL is the entire portal UX; adding accounts kills the "just click the link" value
- Two-way in-app chat — send SMS outbound; owner replies via their normal phone
- Multi-location/franchise support — adds cross-tenant complexity before product-market fit

---

### Architecture Approach

The architecture has two distinct user surfaces that must be kept cleanly separated: the authenticated owner dashboard (`/app/*`) and the no-auth customer portal (`/portal/[token]`). The owner dashboard uses standard Supabase Auth + RLS for all data access. The portal uses a cryptographically random 64-character token (32 random bytes hex-encoded) stored in a separate `portal_tokens` table; all portal data fetching happens in Next.js Server Components using the Supabase service role key, and only the safe serialized result reaches the browser — no Supabase client is instantiated in the browser for portal pages.

The dual Stripe architecture is the most critical design decision. Shop owner subscriptions use Stripe Billing (Checkout Sessions, Subscriptions, Billing Portal). Customer job payments use Stripe Payment Intents. Both event types flow through the same webhook endpoint and must be discriminated by `metadata.flow = 'customer_payment'` on all customer Payment Intents. For v1, all customer payments go to MountTrack's platform Stripe account; Stripe Connect (direct payouts to shops) is a v2+ concern.

**Major components:**
1. **Owner Dashboard** (`/app/(dashboard)/*`) — authenticated, RLS-enforced; Server Components for reads, Server Actions for mutations; Supabase Realtime for multi-device board sync
2. **Customer Portal** (`/app/portal/[token]/*`) — no-auth; server-side token resolution via service role; polling (30s `router.refresh()`) for v1 live updates, Realtime upgrade path for v2
3. **Portal API** (`/app/api/portal/[token]`) — token validation, Payment Intent creation, signed URL generation; never accepts user-supplied tenant identifiers
4. **Stripe Webhook Handler** (`/app/api/webhooks/stripe`) — single endpoint; event routing by type + metadata discrimination; thin handler that queues work to avoid Vercel timeout
5. **Notification Dispatcher** — triggered by stage changes; fetches shop branding; renders React Email templates; calls Twilio and Resend; logs to `notifications` table
6. **Supabase RLS Layer** — enforces tenant isolation at the database level for all authenticated queries; service role used only in server-side-only contexts (webhooks, portal resolution)

**Database schema highlights:**
- All tenant-scoped tables carry a denormalized `shop_id` column for direct RLS comparison (no subquery joins per row)
- `get_my_shop_id()` SQL function with `SECURITY DEFINER` + `STABLE` avoids N+1 policy evaluation
- `portal_tokens` table is separate from `jobs` — token is never the job's primary key
- `payments` table has a `UNIQUE (stripe_payment_intent_id)` constraint to prevent duplicate webhook processing
- Stage `position` should use fractional indexing (float or Lexorank), not sequential integers

---

### Critical Pitfalls

1. **RLS disabled on any table — silent full tenant exposure.** Supabase tables have RLS disabled by default. Add a CI check: `SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND rowsecurity = false` must return zero rows. Template every migration with `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` as the first line after `CREATE TABLE`.

2. **Service role key used in route handlers that accept user-supplied `shop_id`.** If a route accepts `{ shop_id: "..." }` from the client and queries using the service role key, any user can access any tenant's data. Always derive `shop_id` server-side from `auth.uid()` via the RLS-protected `shops` table. Service role key is for webhooks and portal server components only.

3. **Stripe dual-flow webhook confusion.** Both Stripe Billing and Payment Intent events arrive at the same webhook endpoint. Without `metadata.flow = 'customer_payment'` on customer Payment Intents, `payment_intent.succeeded` events from subscription invoices will corrupt job payment records (and vice versa). Tag every customer Payment Intent at creation time; check the tag before any business logic in the webhook handler.

4. **Twilio A2P 10DLC not registered before launch.** Without registration, carriers silently filter 100% of SMS messages in production. Twilio returns HTTP 200 (accepted) — there is no error. Registration takes 2-4 weeks. Begin at project kickoff, not at launch.

5. **Partial payment balance drift from duplicate webhook delivery.** Stripe retries webhooks on 5xx responses. Without a `UNIQUE (stripe_payment_intent_id)` constraint on the payments ledger, duplicate deliveries double-credit payments. Use an immutable ledger model (append-only `payments` records) and rely on the constraint to safely ignore duplicate webhook deliveries.

Additional pitfalls to keep active during development:
- Customer portal token must be 32-byte crypto random (not job UUID); tokens should have an expiry mechanism even if not enforced in v1
- Photo uploads on mobile require client-side compression before Supabase Storage upload (12MP photos crash Safari tabs)
- Supabase Storage must use private buckets + signed URLs — never public buckets for job photos
- Webhook handlers must return 200 immediately and queue work to avoid Vercel's 10-second serverless timeout
- Stage ordering should use fractional indexing — sequential integers require full re-numbering on reorder
- Estimated completion dates should be stored as PostgreSQL `DATE` type to avoid UTC timezone shift on the customer portal

---

## Implications for Roadmap

Based on combined research, the architecture's dependency graph and pitfall phase-mapping strongly suggest a 6-phase structure. The critical path is: foundation (security model) → owner workflow (core product) → billing gate (monetization prerequisite) → customer portal (core value prop) → notifications (automation layer) → polish and reporting.

### Phase 1: Foundation and Security Model

**Rationale:** RLS correctness cannot be retrofitted. Every feature built on a misconfigured tenant boundary becomes a liability. The authentication pattern, RLS policies, service role conventions, and Stripe account setup must be established before any feature work. The Vercel/Supabase infrastructure, DNS records, and Twilio 10DLC registration also belong here because they have lead times (DNS propagation, A2P registration).

**Delivers:** Working Supabase project with all tables, RLS policies validated by integration tests; Next.js App Router scaffold with auth middleware; CI check for zero-RLS tables; Stripe account with both flow types configured; Resend domain with SPF/DKIM; Twilio 10DLC registration initiated.

**Addresses from FEATURES.md:** Shop account creation, owner login/signup flow, customizable stages (schema + CRUD).

**Avoids from PITFALLS.md:** Pitfalls 1 (RLS disabled), 2 (wrong RLS policy pattern), 3 (service role key misuse), 5 (webhook signature bypass), 8 (10DLC not registered), 10 (service key in client bundle), 17 (SPF/DKIM not configured), 19 (stage ordering with integers).

**Research flag:** Standard patterns — no phase research needed. Supabase RLS, Next.js App Router auth middleware, and Stripe account setup are well-documented.

---

### Phase 2: Owner Core Workflow

**Rationale:** The Kanban board and job intake form are the product. Nothing else in the roadmap is useful without working job management. This phase delivers the complete owner experience before payments or notifications exist — a functional, testable product loop.

**Delivers:** Job intake form (all required fields including deposit), Kanban board with drag-and-drop (dnd-kit), job detail page, photo uploads (with mobile compression), search and filter, overdue flagging, rush flag. Supabase Realtime on the board for multi-device sync.

**Addresses from FEATURES.md:** All 9 table-stakes features plus visual Kanban, photo attachments, progress gallery, rush flag, and overdue flagging from differentiators.

**Uses from STACK.md:** dnd-kit, Zustand (drag state), TanStack Query (board polling), Supabase Realtime, Supabase Storage (signed URLs, private bucket), React Hook Form + Zod (intake form).

**Avoids from PITFALLS.md:** Pitfall 11 (optimistic UI divergence — requires Realtime from day one), 12 (bulk stage move via RPC, not parallel UPDATEs), 13 (mobile photo compression), 14 (private storage buckets + signed URLs), 19 (fractional stage ordering).

**Research flag:** Standard patterns for Next.js + Supabase + dnd-kit. No phase research needed. Verify dnd-kit current API version before implementation.

---

### Phase 3: Stripe Billing Gate

**Rationale:** The subscription gate must exist before the app can be given to real users. It also validates the billing architecture in isolation, before the more complex customer payment flow is added in Phase 4. Building billing before the portal means the Stripe account and webhook infrastructure are proven before customer payment logic is layered on top.

**Delivers:** Stripe Billing checkout session for new shops, subscription status gate (middleware blocks dashboard access for inactive/canceled shops), Billing Portal for owner self-service subscription management, webhook handler for subscription lifecycle events (created, updated, deleted, invoice failed/succeeded), grace period logic.

**Uses from STACK.md:** Stripe Node SDK, Stripe Billing API, Stripe Billing Portal. Webhook handler pattern from ARCHITECTURE.md.

**Avoids from PITFALLS.md:** Pitfall 5 (webhook signature verification), 6 (dual-flow confusion — subscription events established before customer payment events added), 15 (Stripe Customer stored by ID, not looked up by email).

**Research flag:** Standard patterns. Stripe Billing is extensively documented. No phase research needed.

---

### Phase 4: Customer Portal and Customer Payments

**Rationale:** The customer portal is the product's primary differentiator and the most architecturally distinct piece of the system (no-auth, token-gated, branded). It depends on jobs (Phase 2) existing and on Stripe being configured (Phase 3). Payment Intents are added here as the second Stripe flow, building on the webhook infrastructure established in Phase 3.

**Delivers:** Customer portal page (token resolution, job timeline, photo gallery, balance display), Stripe Payment Intent creation (server-side, `client_secret` passed to browser), Stripe Elements embedded on portal page, partial payment support, payment webhook handling (`payment_intent.succeeded`), portal token generation on job creation, portal URL included in intake confirmation. Polling-based portal updates (30s `router.refresh()`).

**Uses from STACK.md:** `@stripe/stripe-js`, `@stripe/react-stripe-js` (Stripe Elements), Supabase service role client (token resolution), signed URLs for photos, `server-only` package for service role files.

**Avoids from PITFALLS.md:** Pitfall 4 (guessable tokens — 32-byte crypto random), 6 (dual-flow webhook — metadata discrimination for customer payments), 7 (partial payment ledger model + UNIQUE constraint), 14 (private bucket + signed URLs on portal), 16 (DATE type for estimated completion), 18 (thin webhook handler + queue to avoid Vercel timeout).

**Research flag:** The portal Realtime upgrade path (Supabase Realtime Broadcast vs polling) needs verification against current Supabase docs before Phase 6. Polling is safe for v1.

---

### Phase 5: Notifications

**Rationale:** Notifications depend on the full job lifecycle (Phase 2), the customer portal URL existing (Phase 4), and shop branding being in place. They are the automation layer that delivers the "automatic customer updates" value without requiring owner action. Building notifications after the portal ensures the portal URL is available to include in SMS/email templates.

**Delivers:** Notification dispatcher (Twilio + Resend), branded SMS + email templates (React Email), stage-change trigger (fires on every stage update), "Ready for Pickup" trigger (includes payment link), opt-out handling (Twilio inbound webhook, `sms_opt_out` flag per customer), notification history log per job (`notifications` table), opt-out status surfaced in job detail.

**Uses from STACK.md:** Twilio SDK, Resend SDK, React Email components, Zod (notification payload validation).

**Avoids from PITFALLS.md:** Pitfall 8 (10DLC registered — started in Phase 1), 9 (STOP reply handler via Twilio inbound webhook), 17 (SPF/DKIM configured — done in Phase 1), 18 (async notification dispatch to avoid webhook timeout).

**Research flag:** Verify current Twilio 10DLC registration status and requirements before implementation. Regulatory environment evolves. Standard patterns otherwise.

---

### Phase 6: Reports, Polish, and v1 Completion

**Rationale:** All core workflows are proven by Phase 5. Phase 6 adds the operational visibility features (reports, calendar, queue view), bulk operations that improve shop efficiency, and UI polish. These features require accumulated job data to be useful, which is why they come last.

**Delivers:** Revenue and outstanding balance reports, turnaround time reports, referral source tracking and report, queue/backlog view (jobs sorted by estimated date), calendar view of completion dates, bulk stage move (multi-select on Kanban via RPC), supply alerts (dashboard reminder system), dark mode, PWA manifest for home screen install, performance optimization for 100+ job boards.

**Addresses from FEATURES.md:** Queue view, calendar view, bulk stage move, supply alerts, referral source reporting — all deferred from earlier phases.

**Avoids from PITFALLS.md:** Pitfall 12 (bulk stage move uses single RPC, not parallel UPDATEs — schema for this established in Phase 1).

**Research flag:** Calendar view and queue view are standard patterns. Reports use standard Supabase aggregate queries. No phase research needed.

---

### Phase Ordering Rationale

- **Security before features:** RLS and service role conventions must be established before any data exists. Retrofitting tenant isolation after data is in place is a rewrite, not a fix.
- **Owner core before customer portal:** The portal is a read/pay surface for job data that must be created by the owner workflow first. There is no portal without jobs.
- **Billing before portal:** The Stripe infrastructure and webhook patterns are simpler to validate with one flow (subscriptions) before adding the second (payment intents). Phase 4 builds on Phase 3's webhook plumbing.
- **Notifications after portal:** Notifications link to the portal URL. Building them before the portal would require placeholders that add complexity.
- **Reports last:** Reports require real data to be meaningful and test properly. They also have no dependencies on each other, making them safe to slip if earlier phases run long.

---

### Research Flags

**Needs phase research before implementation:**
- **Phase 5 (Twilio):** Verify current A2P 10DLC registration requirements and timeline at https://www.twilio.com/en-us/guidelines/a2p-10dlc — regulatory environment changes and the 2-4 week lead time has major launch implications.
- **Phase 4 (Supabase Realtime on portal):** Verify current Supabase Realtime Broadcast API (vs. postgres_changes) for unauthenticated portal use before choosing between polling and WebSocket approaches for v1.

**Standard patterns (skip phase research):**
- **Phase 1:** Supabase RLS, Next.js App Router auth middleware, and Stripe account setup are comprehensively documented.
- **Phase 2:** Next.js + Supabase + dnd-kit patterns are stable and well-covered. Verify dnd-kit version API at https://dndkit.com before use.
- **Phase 3:** Stripe Billing is the most documented payment product Stripe offers. Standard patterns apply.
- **Phase 6:** Report queries, PWA manifest, and calendar/queue views are straightforward extensions of Phase 2 data access patterns.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | MEDIUM | Architectural patterns are HIGH confidence. Specific package versions based on training data through August 2025 — web tools unavailable during research. Verify all versions against official releases before `npm install`. |
| Features | MEDIUM | Table stakes and differentiators derived from training-data analysis of comparable trade-shop SaaS (Jobber, RepairDesk, ServiceTitan). Taxidermy-specific patterns (multi-month timelines, seasonal spikes) are LOW-MEDIUM — niche domain with limited training data depth. Recommend verifying against live competitor research (TaxiTracker, TBM) before roadmap finalization. |
| Architecture | MEDIUM-HIGH | Core patterns (RLS, dual Stripe flow, token portal via service role) are well-established and widely documented. Token-based portal using Server Components + service role is the canonical Next.js App Router pattern for this use case. Supabase Realtime for portal (polling vs. WebSocket) needs current-docs verification. |
| Pitfalls | HIGH | RLS pitfalls, Stripe webhook patterns, TCPA/opt-out requirements, partial payment ledger design, and mobile photo handling are all based on stable, mature technical patterns. Twilio A2P 10DLC is MEDIUM — regulatory details change. |

**Overall confidence:** MEDIUM

All four research agents operated without live web tools (WebSearch, WebFetch, Context7 unavailable during session). The architectural and security patterns are well-established and HIGH confidence. Package versions and Twilio regulatory requirements need pre-implementation verification against official sources.

---

### Gaps to Address

- **Package versions:** All version numbers in STACK.md are based on August 2025 training data. Run `npm outdated` after scaffolding and compare against official changelogs before locking a `package.json`.
- **Twilio 10DLC registration timeline:** Confirm current processing time (was 2-4 weeks as of training cutoff) and any new documentation requirements at project kickoff. This has hard launch implications.
- **Supabase Realtime Broadcast availability:** Verify the Broadcast API is the correct unauthenticated realtime approach before Phase 4 portal planning. If Broadcast has changed, polling is the safe fallback.
- **Competitor feature validation:** The features list was derived from training-data analogues. Before finalizing the roadmap, check live competitors (TaxiTracker, Taxidermy Business Management, Jobber) for any taxidermy-specific feature expectations that weren't captured.
- **Stripe Connect timing:** The v1 recommendation is platform-collects (all payments to MountTrack's Stripe account). If the business model requires shops to receive direct payouts from day one, Stripe Connect must move to Phase 3. Clarify this before Phase 3 planning.

---

## Sources

### Primary (HIGH confidence)
- `.planning/PROJECT.md` — project requirements and context (primary source for all domain decisions)
- Supabase RLS documentation: https://supabase.com/docs/guides/database/postgres/row-level-security
- Supabase SSR documentation: https://supabase.com/docs/guides/auth/server-side/nextjs
- Supabase Storage access control: https://supabase.com/docs/guides/storage/security/access-control
- Stripe Billing documentation: https://stripe.com/docs/billing
- Stripe Payment Intents: https://stripe.com/docs/payments/payment-intents
- Stripe webhook verification: https://docs.stripe.com/webhooks/signatures
- Next.js App Router documentation: https://nextjs.org/docs/app

### Secondary (MEDIUM confidence)
- Trade-shop SaaS pattern analysis: training-data synthesis from Jobber, RepairDesk, ServiceTitan, Shopmonkey, HouseCall Pro feature sets
- No-login portal UX patterns: training-data synthesis from Shopify order tracking, tattoo shop booking tools, print shop portals
- Kanban small-business patterns: training-data synthesis from Trello, monday.com, Linear, purpose-built trade-shop tools
- dnd-kit documentation: https://dndkit.com
- shadcn/ui documentation: https://ui.shadcn.com
- Resend documentation: https://resend.com/docs
- React Email documentation: https://react.email/docs

### Tertiary (LOW confidence, needs validation)
- Taxidermy-specific feature expectations: training-data synthesis from publicly available taxidermy shop discussions and software reviews — limited corpus depth
- Twilio A2P 10DLC requirements: https://www.twilio.com/en-us/guidelines/a2p-10dlc (verify current state — regulatory requirements change)

---

*Research completed: 2026-03-01*
*Ready for roadmap: yes*
