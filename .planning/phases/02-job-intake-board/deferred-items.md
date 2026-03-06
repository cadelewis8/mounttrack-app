# Deferred Items — Phase 02: Job Intake Board

## Pre-existing TypeScript Error (out of scope for 02-01)

**File:** `mounttrack/.next/dev/types/validator.ts(171,31)`
**Error:** `TS2344: Type 'typeof import("...src/app/api/stripe/portal/route")' does not satisfy the constraint 'RouteHandlerConfig<"/api/stripe/portal">'`
**Root cause:** The Stripe portal route `GET` handler returns `Promise<BillingState>` instead of `Promise<Response>` — a Phase 1 issue.
**Impact:** Build/tsc reports one error from the auto-generated Next.js validator. Does not affect runtime behavior.
**Action:** Should be fixed in a future plan (update portal route to return `NextResponse.json(state)` instead of `state` directly).
