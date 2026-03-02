# Phase 1: Foundation - Context

**Gathered:** 2026-03-02
**Status:** Ready for planning

<domain>
## Phase Boundary

A shop owner can create an account, configure their shop identity, and have an active paid subscription — with a security model that enforces complete tenant isolation at the database level. This phase covers auth, onboarding wizard, shop settings, Stripe subscription billing, and Supabase RLS. No job management, no customer portal, no notifications.

</domain>

<decisions>
## Implementation Decisions

### Onboarding Flow
- 3-step wizard: signup → shop setup → subscribe (in that order)
- Dashboard is fully blocked until all 3 wizard steps are complete — no partial access
- Step indicator at the top of each wizard screen (1 → 2 → 3) with back/next buttons
- If owner abandons mid-wizard, resume from the step they left off on next login (save progress per step)

### Subscription Gate
- Hard lockout when subscription lapses or payment fails — blocked page with a clear "renew subscription" prompt
- No grace period at the app level (Stripe's built-in payment retry logic is sufficient)
- No free trial — subscription required to complete onboarding and access the dashboard
- Billing management (cancel, update card, view invoices) handled entirely via Stripe's hosted customer portal — no custom cancellation UI
- When resubscription succeeds: instant access restored, all shop data preserved

### Shop Setup
- During onboarding wizard (step 2): only shop name is required to proceed — address, contact details, logo, and brand color are optional and can be completed later
- After onboarding: shop details are editable from a dedicated **Settings** page in the main nav
- Settings page is tabbed: **Shop** (name, address, contact) | **Branding** (logo, color) | **Subscription** (manage via Stripe portal) | **Stages** (added in Phase 2)
- First login after completing the wizard: show a welcome screen with a checklist (e.g., add logo, set brand color, create first job) — not dropped straight into an empty board

### Brand Color & Logo
- Brand color: free color picker (any hex value) — color wheel UI + hex input field
- Brand color applied as accent only in the owner dashboard: buttons, active nav items, focus rings, highlights
- Before logo is uploaded: show shop name as text in the header/sidebar where the logo would appear
- Logo upload: accepts PNG, JPG, SVG — max 2MB — displayed square-cropped in the UI

### Claude's Discretion
- Exact dark/light mode implementation (CSS variables, next-themes, or similar)
- Specific layout and spacing of the wizard steps
- Error state and loading state designs throughout
- Exact Supabase RLS policy patterns (standard shop_id = auth.uid() pattern expected)

</decisions>

<specifics>
## Specific Ideas

- Owner should feel like they're "getting something" before the credit card comes out — that's why shop setup comes before subscribe in the wizard
- After subscribing, land on a welcome checklist screen (not blank board) so there's a clear next action
- Stripe customer portal handles all billing self-service — don't build custom subscription management UI

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- None yet — this is the first phase; greenfield codebase

### Established Patterns
- Stack is locked: Next.js (App Router), Supabase (auth + DB + storage), Stripe Billing, Vercel
- Multi-tenancy via Supabase RLS — every table gets `shop_id` referencing the shops table; policies enforce `shop_id = auth.uid()` or equivalent
- Dark/light mode required from day one — implement with CSS variables so it applies globally from this phase forward

### Integration Points
- Supabase Auth is the identity layer — shop owner account = Supabase user
- Stripe customer ID stored on the shop record — links Supabase user to Stripe billing
- Stripe webhook → update subscription status on shop record → app checks status on each request

</code_context>

<deferred>
## Deferred Ideas

- None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-foundation*
*Context gathered: 2026-03-02*
