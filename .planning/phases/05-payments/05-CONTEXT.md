# Phase 5: Payments - Context

**Gathered:** 2026-03-12
**Status:** Ready for planning

<domain>
## Phase Boundary

Stripe payment collection on the customer portal (full or partial balance), automated payment links when a job reaches "Ready for Pickup", owner-triggered payment requests from the job detail page, and owner-facing payment/balance visibility on both the job detail page and the dashboard.

</domain>

<decisions>
## Implementation Decisions

### Portal payment section
- Only visible when the customer has a remaining balance — hidden when fully paid
- Shows full breakdown: quoted price, deposit paid, any prior Stripe payments, and remaining balance
- Positioned below the stage timeline (timeline stays the hero element)
- After a successful payment: show an explicit success confirmation message before returning to normal portal view

### Partial payment UX
- Free-form amount entry — customer types any dollar amount up to the remaining balance
- Minimum partial payment: $50 (floor to prevent micro-payments)
- Inline validation error if amount exceeds remaining balance: "Amount cannot exceed remaining balance of $X"
- Portal shows customer's payment history: deposit paid + any prior Stripe payments made (with dates)

### Stripe checkout style
- Redirect to Stripe-hosted Checkout — no embedded Payment Element
- Customer enters their desired amount on the portal first; Checkout is pre-filled with that specific amount
- After successful payment, Stripe redirects back to `/portal/[token]?payment=success` where the portal shows a confirmation message

### Owner payment view (job detail)
- Dedicated payments section inline on the job detail page (not a separate tab)
- Shows: Quoted price, Deposit recorded at intake, all Stripe payments (amount + date), Outstanding balance
- Stripe payments only — no manual cash/check payment entry in this phase

### Owner dashboard outstanding balance (PAY-06)
- Prominent stat card at the top of the dashboard, consistent with existing job count stat cards
- Displays total outstanding balance across all active jobs

### Manual payment request (PAY-04)
- Owner can trigger a payment request SMS/email from a button on the job detail page at any time
- Same payment link format as the automated "Ready for Pickup" trigger

### Claude's Discretion
- Exact stat card styling and placement order on the dashboard
- Success confirmation message copy and design
- Stripe Checkout session configuration details (currency, metadata, etc.)
- Database schema for storing payment records
- Webhook handling for Stripe payment confirmation

</decisions>

<specifics>
## Specific Ideas

- The portal payment flow: customer sees breakdown → enters amount → clicks pay → redirected to Stripe Checkout → returns to portal with "Payment received" confirmation
- No MountTrack branding on the Stripe Checkout page — use the shop's name and logo via Stripe account branding

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `PortalHeader` component: branded header with shop logo/colors — already on portal, no changes needed
- `PortalAutoRefresh`: live refresh via `router.refresh()` — can trigger after payment success to show updated balance
- `billing-portal-button.tsx`: Stripe portal button pattern (for owner's subscription) — reference for how Stripe redirect flows are wired
- `Job` type: already has `quoted_price` and `deposit_amount` fields — foundation for balance calculation

### Established Patterns
- Portal page (`/portal/[token]`): server component, service-role Supabase client, no auth required — payment section extends this same pattern
- Brand color via CSS variable `--brand` on the portal root div — payment CTA button should use `var(--brand)`
- `max-w-lg` single-column layout on portal — payment section fits as another card in this column

### Integration Points
- Portal page needs a new payments card component below `StageTimeline`
- Job detail page (`/app/(app)/jobs/[id]/job-detail-client.tsx`) needs a new payments inline section
- Dashboard (`/app/(app)/dashboard/`) needs a new outstanding balance stat card
- New Stripe Checkout session API route needed (e.g. `/api/create-payment-session`)
- New Stripe webhook handler needed for `checkout.session.completed` events
- New `payments` table needed in Supabase to store payment records

</code_context>

<deferred>
## Deferred Ideas

- Manual cash/check payment recording — future reporting phase
- Automated reminder SMS if job has been "Ready for Pickup" for N days without payment — v2 (AUTO-01 in requirements)
- PDF receipt emailed after final payment — Phase 7 (DOC-01)

</deferred>

---

*Phase: 05-payments*
*Context gathered: 2026-03-12*
