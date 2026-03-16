---
phase: 06-notifications-waitlist
plan: "02"
subsystem: api
tags: [twilio, resend, react-email, notifications, sms, email, webhooks, supabase]

# Dependency graph
requires:
  - phase: 06-notifications-waitlist/06-01
    provides: notifications table, sms_opted_out column, TypeScript types, twilio/resend/react-email packages

provides:
  - StageUpdateEmail React Email template with shop branding (no MountTrack branding)
  - notifications.ts helper: sendStageNotification, sendPaymentRequestNotification, sendWaitlistSms
  - updateJobStage wired to sendStageNotification after every stage move
  - bulkMoveJobs wired to sendStageNotification per job via Promise.allSettled
  - sendPaymentRequest sends real Twilio SMS + Resend email (console.log stub replaced)
  - Twilio inbound webhook at /api/webhooks/twilio sets sms_opted_out on STOP

affects:
  - 06-03 (waitlist management uses sendWaitlistSms from notifications.ts)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Notification dispatch wrapped in try/catch — errors logged but never propagate to caller"
    - "fire-and-await pattern: await notification call but wrap in try/catch so stage move always succeeds"
    - "Promise.allSettled for bulk notification fan-out — partial failure never blocks the bulk move"
    - "Twilio webhook returns 200 always — non-2xx causes Twilio retries"
    - "Service client used in notifications.ts for DB inserts — module called from server actions with their own auth client"

key-files:
  created:
    - mounttrack/src/emails/StageUpdateEmail.tsx
    - mounttrack/src/lib/notifications.ts
    - mounttrack/src/app/api/webhooks/twilio/route.ts
  modified:
    - mounttrack/src/actions/jobs.ts
    - mounttrack/src/actions/payments.ts

key-decisions:
  - "await sendStageNotification() wrapped in try/catch (not void fire-and-forget) — errors logged but stage move never blocked"
  - "V1 Twilio webhook updates sms_opted_out by customer_phone without shop_id scope — one Twilio account per shop, no cross-shop risk; limitation documented"
  - "sendPaymentRequestNotification reuses StageUpdateEmail template with stageName='Ready for Pickup' — avoids a separate email template"
  - "render() from @react-email/components used for HTML generation — confirmed exported from package"

patterns-established:
  - "Notification helper module uses singleton Twilio/Resend clients at module level"
  - "All notification functions: SMS skips if null phone or sms_opted_out=true, email skips if null email"
  - "Each sent notification persisted to notifications table via createServiceClient in try/catch"
  - "Webhook routes under /api/webhooks/ use export const runtime = 'nodejs' and createServiceClient"

requirements-completed:
  - NOTIF-01
  - NOTIF-02
  - NOTIF-03
  - NOTIF-04

# Metrics
duration: 10min
completed: 2026-03-16
---

# Phase 6 Plan 02: Notifications & Waitlist Core Infrastructure Summary

**Twilio SMS + Resend email notifications on every stage move — branded per shop with opt-out recording via Twilio STOP webhook**

## Performance

- **Duration:** 10 min
- **Started:** 2026-03-16T15:17:24Z
- **Completed:** 2026-03-16T15:27:00Z
- **Tasks:** 3
- **Files modified:** 5 (3 created, 2 modified)

## Accomplishments

- StageUpdateEmail template built with shop logo/brand color, customer CTA button, no MountTrack branding anywhere
- notifications.ts centralized helper with three exported functions — all errors caught internally, never propagate
- Stage moves (single and bulk) now dispatch branded SMS + email to customers; payment request stub replaced with real delivery
- Twilio STOP webhook handler sets sms_opted_out=true on all matching jobs

## Task Commits

Each task was committed atomically:

1. **Task 1: StageUpdateEmail template + notifications.ts helper** - `f57c38c` (feat)
2. **Task 2: Wire updateJobStage, bulkMoveJobs, sendPaymentRequest** - `6ab1275` (feat)
3. **Task 3: Twilio inbound webhook — STOP opt-out handler** - `8d4c263` (feat)

## Files Created/Modified

- `mounttrack/src/emails/StageUpdateEmail.tsx` - React Email template: branded header (logo or shop name), white body with stage name + CTA button, footer with shop name only
- `mounttrack/src/lib/notifications.ts` - Centralized notification dispatch: Twilio + Resend singleton clients, three exported functions, notifications table persistence
- `mounttrack/src/app/api/webhooks/twilio/route.ts` - Inbound SMS webhook: parses formData, handles STOP by setting sms_opted_out=true, returns 200 always
- `mounttrack/src/actions/jobs.ts` - updateJobStage extended to fetch job+stage+shop in parallel and call sendStageNotification; bulkMoveJobs extended with notification fan-out via Promise.allSettled
- `mounttrack/src/actions/payments.ts` - sendPaymentRequest extended to fetch phone/email/sms_opted_out + shop branding; console.log stub replaced with sendPaymentRequestNotification

## Decisions Made

- `await sendStageNotification()` is wrapped in `try/catch` rather than `void` (fire-and-forget) — this awaits delivery but catches all errors so the stage move always succeeds and returns quickly
- V1 Twilio webhook scopes STOP opt-out by `customer_phone` only (no `shop_id` filter) — acceptable because v1 is one Twilio account per deployment; limitation is documented in code comment
- `sendPaymentRequestNotification` reuses `StageUpdateEmail` with `stageName='Ready for Pickup'` rather than a separate payment-specific template — reduces template maintenance
- `render()` imported from `@react-email/components` (confirmed exported from package) rather than from `react-email` package

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- Pre-existing TypeScript error in `.next/dev/types/validator.ts` (generated cache artifact from stripe/portal route) — confirmed pre-existing from 06-01, does not affect source compilation

## User Setup Required

The following environment variables must be added to `.env.local` and production environment before notifications will send:

```
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_PHONE_NUMBER=+1xxxxxxxxxx
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxx
```

The Twilio webhook URL must be configured in the Twilio Console:
- Go to Phone Numbers > Active Numbers > select your number
- Under Messaging > A MESSAGE COMES IN: set webhook URL to `https://your-domain.com/api/webhooks/twilio`
- Method: HTTP POST

The Resend `from` domain `notifications@mounttrack.app` must be verified in the Resend dashboard.

## Next Phase Readiness

- notifications.ts exports `sendWaitlistSms` — ready for Plan 03 (waitlist management UI)
- All NOTIF requirements (01-04) fulfilled
- Blocker: Twilio A2P 10DLC registration (2-4 weeks) must be initiated for production SMS delivery

---
*Phase: 06-notifications-waitlist*
*Completed: 2026-03-16*
