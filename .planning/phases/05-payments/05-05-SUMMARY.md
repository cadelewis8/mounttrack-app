---
phase: 05-payments
plan: "05"
subsystem: payments-owner-ui
tags: [payments, job-detail, server-action, owner-ui]
dependency_graph:
  requires: [05-01, 05-02]
  provides: [owner-payment-visibility, manual-payment-request-trigger]
  affects: [job-detail-sidebar]
tech_stack:
  added: []
  patterns: [server-action-from-client-component, supabase-as-any-workaround, inline-component-in-client-file]
key_files:
  created:
    - mounttrack/src/actions/payments.ts
  modified:
    - mounttrack/src/app/(app)/jobs/[id]/page.tsx
    - mounttrack/src/app/(app)/jobs/[id]/job-detail-client.tsx
decisions:
  - "PaymentsSection defined inline in job-detail-client.tsx alongside existing SideCard/Section/Field helpers — no separate file needed"
  - "Send Payment Request button disabled when outstanding <= 0 — prevents sending request when balance is already cleared"
  - "useState (named import) used for PaymentsSection state — consistent with existing client file pattern"
metrics:
  duration: "2 min"
  completed_date: "2026-03-13"
  tasks: 2
  files: 3
---

# Phase 05 Plan 05: Owner Payment Visibility and Manual Request Trigger Summary

Owner-facing Payments SideCard on job detail page showing quoted/deposit/Stripe-payments/outstanding breakdown, with sendPaymentRequest server action stub (console.log + TODO Phase 6).

## Tasks Completed

| Task | Description | Commit | Files |
|------|-------------|--------|-------|
| 1 | Create sendPaymentRequest server action | e84d0f2 | mounttrack/src/actions/payments.ts |
| 2 | Add PaymentsSection to job detail page and client | a3f2833 | page.tsx, job-detail-client.tsx |

## What Was Built

**PAY-04 — sendPaymentRequest server action** (`mounttrack/src/actions/payments.ts`):
- Verifies job ownership via `shop_id` match (RLS + explicit filter)
- Builds portal URL from `NEXT_PUBLIC_URL` + `job.portal_token`
- Logs portal URL to console with TODO Phase 6 comment for Twilio + Resend delivery

**PAY-05 — PaymentsSection component** (inline in `job-detail-client.tsx`):
- Balance formula: `quoted_price − (deposit_amount ?? 0) − SUM(payments.amount_cents) / 100`
- Shows each Stripe payment with formatted date
- Outstanding clamped at 0 via `Math.max(outstanding, 0)`
- "Send Payment Request" button disabled when `outstanding <= 0`
- Feedback states: "Sending...", "Payment request sent.", or error message

**Extended page.tsx**:
- Queries `payments` table after existing photo URL generation
- Orders by `paid_at` ascending
- Passes `jobPayments ?? []` to `JobDetailClient`

## Deviations from Plan

None — plan executed exactly as written.

## Verification

- [x] `mounttrack/src/actions/payments.ts` exists with `sendPaymentRequest` export
- [x] `sendPaymentRequest` verifies job ownership before logging portal URL
- [x] Job detail server page queries `payments` table for the job
- [x] `JobDetailClientProps` includes `jobPayments: { amount_cents: number; paid_at: string }[]`
- [x] Job detail client renders a "Payments" SideCard below "Customer Portal Link"
- [x] Payments SideCard shows breakdown: quoted, deposit, each Stripe payment with date, outstanding balance
- [x] "Send Payment Request" button calls `sendPaymentRequest` server action
- [x] `npx tsc --noEmit` passes with no new errors (pre-existing portal route error unrelated)

## Self-Check: PASSED

- payments.ts: FOUND
- page.tsx: FOUND
- job-detail-client.tsx: FOUND
- Commit e84d0f2: FOUND
- Commit a3f2833: FOUND
