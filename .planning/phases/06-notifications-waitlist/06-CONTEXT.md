# Phase 6: Notifications & Waitlist - Context

**Gathered:** 2026-03-14
**Status:** Ready for planning

<domain>
## Phase Boundary

Every stage change automatically triggers a branded Twilio SMS and Resend email to the customer — showing the shop's identity, no MountTrack branding. Customers can opt out of SMS via STOP keyword (A2P 10DLC compliant). Owner can add pre-intake customers to a waitlist; waitlisted customers immediately receive a branded SMS confirmation. Notification history is persisted to Supabase (feeds JOB-05 communication history). UI for displaying communication history is NOT in this phase.

</domain>

<decisions>
## Implementation Decisions

### Message content & tone
- SMS includes: shop name prefix + stage name + portal link
  - Format: "Buck's Taxidermy: Your mount has moved to [Stage Name]! Track your progress here: [portal link]"
- Shop name prefixed on every SMS (not just first message) — customer always knows who it's from
- Email includes: shop logo + brand color header + stage update message + portal CTA button
- Tone: warm and friendly — e.g. "Great news! Your mount has moved to Tanning."
- Email is HTML-templated (not plain text)

### Notification trigger rules
- Every stage change fires — no exclusions (owner controls which stages exist)
- Bulk moves trigger individual notifications per job (each customer gets their own)
- If customer phone is missing → skip SMS silently (no error to owner)
- If customer email is missing → skip email silently (no error to owner)
- Each sent notification is persisted to a `notifications` table in Supabase (type, channel, stage, job_id, timestamp) — feeds JOB-05 communication history, but the UI for that history is a future phase

### SMS opt-out & compliance
- `sms_opted_out` boolean flag on the `jobs` table (per-job scoped — not global per customer)
- Opt-out triggered via Twilio inbound webhook at `/api/webhooks/twilio` — Twilio POSTs when STOP received, we match phone to job and set flag
- Opt-out is SMS-only — email notifications continue when customer opts out
- Owner sees a badge/indicator on the job detail page when a customer has opted out of SMS

### Waitlist UI & flow
- Dedicated `/waitlist` page with a nav link
- Add entry form: name + phone + animal type (3 fields only — matches WAIT-01)
- Entries displayed as a simple list ordered by date added (name, animal type, phone, date)
- Actions: delete only — owner removes entry manually when they convert it via normal job intake form
- On creation: customer immediately receives branded SMS confirmation ("You're on the waitlist at Buck's Taxidermy! We'll be in touch when we're ready for your [animal type].")

### Claude's Discretion
- Email HTML template design (layout, spacing, typography — use shop brand_color and logo_url)
- Supabase `notifications` table schema design
- Error handling for Twilio/Resend API failures (log and continue, don't block stage move)
- Twilio phone number provisioning instructions (out of scope — document in README/setup)

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `updateJobStage` in `src/actions/jobs.ts`: existing hook point for stage changes — already has special logic for "Ready for Pickup". Add notification dispatch here.
- `bulkMoveJobs` in `src/actions/jobs.ts`: bulk move action — add same notification dispatch here
- `sendPaymentRequest` in `src/actions/payments.ts`: has TODO Phase 6 stub at line 27 — replace console.log with actual Twilio + Resend calls
- `shop_name`, `logo_url`, `brand_color` on shops table: branding data already available for templates
- `customer_phone` on jobs table: phone field exists, may be null
- `/api/webhooks/stripe/route.ts`: existing webhook pattern to follow for Twilio inbound webhook

### Established Patterns
- Server actions in `src/actions/` for all mutations
- Supabase client via `createClient()` from `@/lib/supabase/server`
- Webhook routes under `src/app/api/webhooks/`
- `revalidatePath` for cache invalidation after mutations

### Integration Points
- `updateJobStage` and `bulkMoveJobs` — add notification calls after successful stage update
- `sendPaymentRequest` — replace TODO stub with real Twilio/Resend dispatch
- New `/api/webhooks/twilio` route for opt-out handling
- New `/waitlist` page and nav link in `nav-links.tsx`
- Job detail page — add `sms_opted_out` badge indicator

</code_context>

<specifics>
## Specific Ideas

- SMS format: "[Shop Name]: [warm message with stage]. Track progress: [portal URL]"
- Waitlist SMS: "[Shop Name]: You're on our waitlist! We'll reach out when we're ready for your [animal type]."
- The `notifications` table should log enough to reconstruct a full communication timeline per job (for JOB-05 in a future phase)

</specifics>

<deferred>
## Deferred Ideas

- None — discussion stayed within phase scope

</deferred>

---

*Phase: 06-notifications-waitlist*
*Context gathered: 2026-03-14*
