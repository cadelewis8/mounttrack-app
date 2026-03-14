---
phase: 05-payments
plan: "04"
subsystem: customer-portal
tags:
  - payments
  - portal
  - stripe
  - ui
dependency_graph:
  requires:
    - 05-01  # payments table schema + Payment type
    - 05-02  # /api/create-payment-session endpoint
  provides:
    - customer-facing payment UI on portal
    - PaymentCard component (breakdown, input, Stripe redirect)
    - portal page extended with payments query and success banner
  affects:
    - mounttrack/src/app/portal/[token]/page.tsx
    - mounttrack/src/components/portal/payment-card.tsx
tech_stack:
  added: []
  patterns:
    - Controlled input with useState for single-field payment form (no react-hook-form)
    - Success banner rendered independently of PaymentCard — visible even after full payment clears balance
    - supabase.from('payments') as any with explicit return type — GenericSchema workaround
key_files:
  created:
    - mounttrack/src/components/portal/payment-card.tsx
  modified:
    - mounttrack/src/app/portal/[token]/page.tsx
decisions:
  - PaymentCard has no paymentSuccess prop — success banner is page-level JSX so it remains visible after full payment zeroes remainingCents and hides the card
  - Amount input uses native number type with step/min/max HTML attributes plus inline useState validation — avoids adding react-hook-form dependency for a one-field form
  - remainingCents computed server-side from DB data (quoted_price, deposit_amount, sum of payments rows) — client never supplies financial totals
metrics:
  duration: "2 min"
  completed_date: "2026-03-13"
  tasks: 2
  files_modified: 2
---

# Phase 5 Plan 04: Customer Portal Payment UI Summary

Customer-facing Stripe payment card with breakdown display, partial amount input, and success banner — extending the portal server page with a payments DB query and PaymentCard rendering.

## What Was Built

**PaymentCard client component** (`payment-card.tsx`): displays quoted price, deposit deduction, each prior Stripe payment with formatted date as a deduction, and bold remaining balance. Below the breakdown, a controlled number input accepts any amount from $50 to the remaining balance with inline validation errors. Clicking "Pay Now" POSTs `{ portalToken, amountCents }` to `/api/create-payment-session` and redirects `window.location.href` to the returned Stripe Checkout URL. Button is disabled during the redirect.

**Extended portal page** (`portal/[token]/page.tsx`): accepts `searchParams` to detect `?payment=success`, queries the `payments` table ordered by `paid_at`, computes `remainingCents = quotedCents - depositCents - totalStripePaymentsCents`, renders a standalone green success banner when `paymentSuccess` is true (independent of remaining balance), and renders `<PaymentCard>` only when `remainingCents > 0`.

## Tasks Completed

| Task | Description | Commit |
|------|-------------|--------|
| 1 | Create PaymentCard client component | eb20d8e |
| 2 | Extend portal page with payments query and PaymentCard | 9b2b7db |

## Deviations from Plan

None — plan executed exactly as written.

## Verification

- `payment-card.tsx` exists and exports `PaymentCard`
- `PaymentCard` has no `paymentSuccess` prop
- Success banner is a standalone `{paymentSuccess && <div...>}` block, NOT nested inside `{remainingCents > 0 && ...}`
- `<PaymentCard>` rendered only inside `{remainingCents > 0 && ...}` with no `paymentSuccess` prop passed
- Amount input validates min $50 and max remaining with inline messages
- Pay button posts to `/api/create-payment-session` and redirects to returned URL
- `npx tsc --noEmit` passes with no new errors (one pre-existing unrelated error in stripe/portal route)

## Self-Check: PASSED

- `mounttrack/src/components/portal/payment-card.tsx` — FOUND
- `mounttrack/src/app/portal/[token]/page.tsx` — FOUND (modified)
- Commit eb20d8e — feat(05-04): create PaymentCard client component
- Commit 9b2b7db — feat(05-04): extend portal page with payments query and PaymentCard
