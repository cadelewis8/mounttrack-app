---
phase: 06-notifications-waitlist
verified: 2026-03-18T00:00:00Z
status: human_needed
score: 18/18 must-haves verified
human_verification:
  - test: "Navigate to /waitlist and verify page loads with empty-state message"
    expected: "Page shows 'No customers on the waitlist yet.' with Add to Waitlist form"
    why_human: "Server Component fetch + routing cannot be verified without running the app"
  - test: "Add a waitlist entry (name, phone, animal type) and confirm it appears in the list"
    expected: "Entry appears with name (bold), animal type, phone, date added. Success message reads 'Customer added to waitlist and SMS confirmation sent.'"
    why_human: "Form submission + DB insert + optimistic list update requires live browser"
  - test: "Delete a waitlist entry and confirm it disappears from the list"
    expected: "Entry removed immediately from list after clicking Delete"
    why_human: "useTransition + revalidatePath behavior requires live browser observation"
  - test: "Verify Waitlist nav link appears between Calendar and Search in the sidebar"
    expected: "Clock icon labeled 'Waitlist' visible in sidebar between Calendar and Search, highlights correctly on /waitlist route"
    why_human: "Visual placement and active-highlight state require browser"
  - test: "Open any job detail with a phone number set. Confirm NO SMS opt-out badge is visible by default"
    expected: "No amber 'SMS opted out' badge shown when job.sms_opted_out is false"
    why_human: "Conditional rendering of a badge requires visual inspection"
  - test: "POST to /api/webhooks/twilio with body From=+15551234567&OptOutType=STOP, then open a job for that phone number"
    expected: "Job detail page shows amber 'SMS opted out' badge below the phone field"
    why_human: "End-to-end webhook path (formData parsing, DB update, badge display) needs live test"
  - test: "Move a job to a new stage on the board (requires Twilio + Resend credentials in .env.local)"
    expected: "Customer would receive branded SMS and email. No error thrown, stage move completes normally."
    why_human: "Live Twilio/Resend delivery requires credentials and sandbox/production accounts"
---

# Phase 6: Notifications & Waitlist Verification Report

**Phase Goal:** SMS/email notifications on stage changes and payment requests, Twilio STOP opt-out handling, waitlist management with SMS confirmation
**Verified:** 2026-03-18
**Status:** human_needed (all automated checks passed)
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | jobs table has sms_opted_out boolean column (NOT NULL DEFAULT false) | VERIFIED | `ALTER TABLE jobs ADD COLUMN sms_opted_out BOOLEAN NOT NULL DEFAULT false` in migration SQL line 5 |
| 2 | notifications table exists with shop_id, job_id (nullable), channel, type, stage_name, sent_at columns + RLS | VERIFIED | Migration SQL lines 9-21: table created with all required columns, `job_id UUID REFERENCES jobs(id) ON DELETE CASCADE` (no NOT NULL = nullable), RLS enabled with `shop_id = auth.uid()` policy |
| 3 | waitlist table exists with shop_id, name, phone, animal_type, created_at columns + RLS | VERIFIED | Migration SQL lines 24-35: all required columns present, RLS enabled |
| 4 | Job TypeScript interface includes sms_opted_out: boolean | VERIFIED | `database.ts` line 55: `sms_opted_out: boolean` in Job interface |
| 5 | Notification and WaitlistEntry TypeScript interfaces exist in database.ts | VERIFIED | `database.ts` lines 88-105: both interfaces exported with correct field types |
| 6 | Database interface extended with notifications and waitlist table definitions | VERIFIED | `database.ts` lines 154-165: notifications and waitlist tables in Database['public']['Tables'] |
| 7 | twilio, resend, @react-email/components, react-email installed | VERIFIED | `package.json`: twilio@^5.13.0, resend@^6.9.3, @react-email/components@^1.0.9, react-email@^5.2.9 |
| 8 | Every stage change (single and bulk) sends branded SMS + email via Twilio/Resend | VERIFIED | `jobs.ts` lines 190-227: updateJobStage fetches stage+job+shop in parallel, calls sendStageNotification in try/catch; lines 248-287: bulkMoveJobs calls sendStageNotification per job via Promise.allSettled |
| 9 | Notification failure never blocks the stage move | VERIFIED | `jobs.ts` lines 210-226: sendStageNotification wrapped in try/catch, stage move returns `{}` regardless; `notifications.ts` sendSms/sendEmail never rethrow |
| 10 | Each sent SMS/email is persisted to the notifications table | VERIFIED | `notifications.ts` lines 143-151, 166-173: persistNotification called after successful send; wrapped in its own try/catch so DB failure also never propagates |
| 11 | sendPaymentRequest sends real Twilio SMS + Resend email (no console.log stub) | VERIFIED | `payments.ts` lines 35-49: calls sendPaymentRequestNotification with full payload; no console.log stub present |
| 12 | STOP reply sets sms_opted_out=true on matching jobs via Twilio webhook | VERIFIED | `twilio/route.ts` lines 6-30: parses formData (not JSON), checks OptOutType === 'STOP', updates jobs table with sms_opted_out=true via service client |
| 13 | SMS and email show shop name, logo, and brand color — no MountTrack branding | VERIFIED | `StageUpdateEmail.tsx`: renders shopName/shopLogoUrl/brandColor from props, footer shows only {shopName}; grep for "MountTrack" in template returns no matches |
| 14 | Owner can navigate to /waitlist via sidebar nav link | VERIFIED | `nav-links.tsx` line 12: `{ href: '/waitlist', label: 'Waitlist', icon: Clock }` present between Calendar and Search |
| 15 | Owner can add a waitlist entry with name, phone, and animal type | VERIFIED | `waitlist-client.tsx` lines 36-89: 3-field form (name, phone, animal_type) with useActionState bound to createWaitlistEntry; `waitlist.ts` lines 9-52: validates all three fields, inserts to DB |
| 16 | Waitlisted customer immediately receives branded SMS confirming they are on list | VERIFIED | `waitlist.ts` lines 40-48: sendWaitlistSms called after successful insert, wrapped in try/catch; `notifications.ts` lines 252-266: sends SMS with `${shopName}: You're on our waitlist!...` body, persists to notifications table with type='waitlist_confirm', job_id=null |
| 17 | Waitlist entries display as a list ordered by date added (name, animal type, phone, date) | VERIFIED | `page.tsx` line 14: `.order('created_at', { ascending: true })`; `waitlist-client.tsx` lines 106-123: renders name, animal_type, phone, formatted date per entry |
| 18 | Job detail page shows a visible badge when customer has opted out of SMS | VERIFIED | `job-detail-client.tsx` lines 186-190: amber badge `"SMS opted out"` rendered conditionally when `job.sms_opted_out === true`, positioned below the phone field |

**Score:** 18/18 truths verified

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `mounttrack/supabase/migrations/20260314000001_phase6_notifications_waitlist.sql` | DB schema: sms_opted_out + notifications table (job_id nullable) + waitlist table | VERIFIED | 36 lines, substantive SQL with correct constraints and RLS |
| `mounttrack/src/types/database.ts` | TypeScript types: Job.sms_opted_out, Notification interface, WaitlistEntry interface, Database extension | VERIFIED | All types present and wired into Database interface |
| `mounttrack/src/emails/StageUpdateEmail.tsx` | React Email HTML template with shop branding, exports StageUpdateEmail | VERIFIED | 64 lines, exports named function, uses shopName/shopLogoUrl/brandColor props, no MountTrack branding |
| `mounttrack/src/lib/notifications.ts` | Centralized notification dispatch: sendStageNotification, sendPaymentRequestNotification, sendWaitlistSms | VERIFIED | 267 lines, all three functions exported, Twilio+Resend singleton clients, persistNotification helper |
| `mounttrack/src/actions/jobs.ts` | updateJobStage and bulkMoveJobs wired to sendStageNotification | VERIFIED | Both functions call sendStageNotification with full payloads; import on line 6 |
| `mounttrack/src/actions/payments.ts` | sendPaymentRequest stub replaced with real Twilio + Resend calls | VERIFIED | 52 lines, calls sendPaymentRequestNotification, no console.log stub |
| `mounttrack/src/app/api/webhooks/twilio/route.ts` | Inbound SMS webhook: parses form-encoded body, sets sms_opted_out on STOP | VERIFIED | 30 lines, uses req.formData(), checks OptOutType='STOP', updates jobs table |
| `mounttrack/src/actions/waitlist.ts` | createWaitlistEntry + deleteWaitlistEntry server actions | VERIFIED | 70 lines, both actions exported, createWaitlistEntry calls sendWaitlistSms |
| `mounttrack/src/app/(app)/waitlist/page.tsx` | Server Component page: fetches waitlist entries + renders WaitlistClient | VERIFIED | 29 lines, authenticates, fetches entries ordered by created_at asc, passes to WaitlistClient |
| `mounttrack/src/app/(app)/waitlist/waitlist-client.tsx` | Client component: add form + entry list with delete | VERIFIED | 128 lines, useActionState for form, useTransition for delete, entry list with empty state |
| `mounttrack/src/components/nav-links.tsx` | Waitlist nav link added to sidebar | VERIFIED | Clock icon, /waitlist href, positioned between Calendar and Search |
| `mounttrack/src/app/(app)/jobs/[id]/job-detail-client.tsx` | sms_opted_out badge rendered when job.sms_opted_out === true | VERIFIED | Amber badge at lines 186-190, below phone field in Customer section |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| notifications table | jobs table | job_id nullable FK ON DELETE CASCADE | VERIFIED | Migration line 12: `job_id UUID REFERENCES jobs(id) ON DELETE CASCADE` — no NOT NULL confirms nullable |
| waitlist table | shops table | shop_id FK + RLS policy | VERIFIED | Migration line 33: `shop_id = auth.uid()` in RLS policy |
| jobs.ts (updateJobStage) | notifications.ts (sendStageNotification) | called after successful DB stage update | VERIFIED | Line 6 import; lines 211-223: called inside try/catch after DB update succeeds |
| notifications.ts | twilio client | twilioClient.messages.create() | VERIFIED | Line 73: `getTwilioClient().messages.create({...})` |
| notifications.ts | resend client | resend.emails.send() | VERIFIED | Line 92: `getResend().emails.send(opts)` |
| twilio/route.ts | jobs table (sms_opted_out) | supabase service client update on STOP | VERIFIED | Lines 21-23: `.update({ sms_opted_out: true }).eq('customer_phone', from)` |
| waitlist/page.tsx | waitlist.ts | createWaitlistEntry server action binding | VERIFIED | `waitlist-client.tsx` line 3: imports createWaitlistEntry; line 17: bound via useActionState |
| waitlist.ts | notifications.ts (sendWaitlistSms) | called after successful waitlist insert | VERIFIED | Line 3 import; lines 41-46: sendWaitlistSms called after successful DB insert |

---

### Requirements Coverage

| Requirement | Source Plans | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| NOTIF-01 | 06-01, 06-02 | Every stage change sends customer a branded SMS via Twilio | SATISFIED | sendStageNotification wired to updateJobStage and bulkMoveJobs; Twilio messages.create() in notifications.ts |
| NOTIF-02 | 06-01, 06-02 | Every stage change sends customer a branded email via Resend | SATISFIED | sendStageNotification sends Resend email with rendered StageUpdateEmail template |
| NOTIF-03 | 06-01, 06-02 | All notifications display shop name and logo — no MountTrack branding | SATISFIED | StageUpdateEmail uses shopName/shopLogoUrl/brandColor props; no "MountTrack" string in template |
| NOTIF-04 | 06-01, 06-02, 06-03 | Customers can opt out via STOP; opt-outs handled and respected (A2P compliant) | SATISFIED | Twilio webhook sets sms_opted_out=true; sendSms skips when sms_opted_out=true; badge shows on job detail |
| WAIT-01 | 06-01, 06-03 | Owner can add a customer to pre-intake waitlist with name, phone, animal type | SATISFIED | /waitlist page with 3-field form and createWaitlistEntry server action |
| WAIT-02 | 06-01, 06-03 | Waitlisted customer automatically receives branded SMS confirming they are on the list | SATISFIED | sendWaitlistSms called on successful insert with branded message body |

All 6 phase requirements (NOTIF-01 through NOTIF-04, WAIT-01, WAIT-02) are satisfied by implementation evidence. No orphaned requirements found — all phase 6 IDs in REQUIREMENTS.md traceability table map to plans that were executed.

---

### Anti-Patterns Found

No blockers or warnings found in phase 6 implementation files.

| File | Pattern | Severity | Notes |
|------|---------|----------|-------|
| All phase files | No TODO/FIXME/PLACEHOLDER patterns | — | Clean |
| payments.ts | No console.log stub remaining | — | Stub correctly replaced |
| notifications.ts | console.error in catch blocks | Info | Expected — error logging for silent failure mode |

---

### Human Verification Required

The following items cannot be verified programmatically. All automated checks passed.

#### 1. Waitlist page loads and displays empty state

**Test:** Navigate to `/waitlist` in the running app (logged in as shop owner)
**Expected:** Page renders with title "Waitlist", subtitle, Add to Waitlist form with 3 fields, and "No customers on the waitlist yet." message in the entry list section
**Why human:** Server Component fetch and Next.js routing require a running app

#### 2. Full waitlist add/display flow

**Test:** On the /waitlist page, enter a customer name, phone number, and animal type then submit the form
**Expected:** Entry appears in the list below the form showing: name (bold), animal type, phone, formatted date added. Success message "Customer added to waitlist and SMS confirmation sent." appears.
**Why human:** useActionState form feedback, DB insert, and list re-render require live browser

#### 3. Waitlist delete flow

**Test:** Click Delete on any waitlist entry
**Expected:** Entry disappears from the list immediately (useTransition + revalidatePath)
**Why human:** Optimistic UI update and server revalidation require live observation

#### 4. Waitlist nav link position and active state

**Test:** Observe the sidebar navigation
**Expected:** "Waitlist" with Clock icon appears between "Calendar" and "Search". When on /waitlist, the link highlights with brand color background.
**Why human:** Visual layout and CSS active-state cannot be verified by grep

#### 5. SMS opt-out badge — default absent

**Test:** Open any job detail page for a job where sms_opted_out is false
**Expected:** No amber badge is visible in the Customer section near the phone field
**Why human:** Conditional rendering requires visual inspection with real data

#### 6. SMS opt-out badge — end-to-end STOP flow

**Test:** POST to `/api/webhooks/twilio` with body `From=+15551234567&OptOutType=STOP` (content-type: application/x-www-form-urlencoded). Then open a job detail page where customer_phone matches that number.
**Expected:** Amber "SMS opted out" badge appears below the phone field in the Customer section
**Why human:** Requires live HTTP request to the webhook endpoint and a DB read/render cycle

#### 7. Stage change notification delivery (optional — requires credentials)

**Test:** With `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`, and `RESEND_API_KEY` configured in `.env.local`, move a job to a new stage on the board
**Expected:** Stage move completes without error; Twilio logs show an outbound SMS; Resend dashboard shows a sent email with shop branding; notification row appears in the notifications table
**Why human:** Live third-party API delivery requires credentials and is a production/staging-level test

---

### Implementation Notes

- The Supabase migration must be applied manually (Supabase CLI or dashboard SQL editor) as `npx supabase db push` requires Docker or an access token — documented in 06-01-SUMMARY.md
- Twilio A2P 10DLC registration (2–4 weeks) is required before production SMS delivery
- `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`, and `RESEND_API_KEY` must be set in `.env.local`
- Twilio webhook URL must be configured in Twilio Console to `https://<domain>/api/webhooks/twilio` (HTTP POST)
- Resend `from` domain `notifications@mounttrack.app` must be verified in the Resend dashboard

---

_Verified: 2026-03-18_
_Verifier: Claude (gsd-verifier)_
