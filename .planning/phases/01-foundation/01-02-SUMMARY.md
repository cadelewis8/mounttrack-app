---
phase: 01-foundation
plan: 02
subsystem: auth
tags: [next.js, supabase, auth, server-actions, react-19, pkce]

# Dependency graph
requires:
  - "01-01 (Next.js scaffold, Supabase server client, proxy gate)"
provides:
  - "signUp, signIn, signOut, forgotPassword, updatePassword Server Actions"
  - "PKCE token exchange route at /auth/confirm (outside auth route group)"
  - "Auth pages: /signup, /login, /forgot-password, /update-password"
  - "Post-signup page at /check-email"
affects:
  - "03-onboarding (signUp redirects to /onboarding/step-1 after email confirm)"
  - "All protected pages (signIn feeds proxy gate redirect logic)"

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "useActionState (React 19) with (prevState, formData) two-parameter Server Action signature"
    - "PKCE token exchange: /auth/confirm route outside (auth) group — no auth gate on email links"
    - "useSearchParams wrapped in Suspense — required by Next.js App Router"
    - "Email enumeration prevention in forgotPassword — same response regardless of account existence"

key-files:
  created:
    - "mounttrack/src/actions/auth.ts"
    - "mounttrack/src/app/(auth)/layout.tsx"
    - "mounttrack/src/app/(auth)/signup/page.tsx"
    - "mounttrack/src/app/(auth)/login/page.tsx"
    - "mounttrack/src/app/(auth)/forgot-password/page.tsx"
    - "mounttrack/src/app/(auth)/update-password/page.tsx"
    - "mounttrack/src/app/auth/confirm/route.ts"
    - "mounttrack/src/app/check-email/page.tsx"
  modified: []

key-decisions:
  - "Server Actions use (prevState, formData) two-parameter signature — required by useActionState in React 19"
  - "/auth/confirm route placed at src/app/auth/confirm/ (outside (auth) group) — email links must bypass the auth gate"
  - "forgotPassword always redirects with same response regardless of whether email exists — prevents enumeration"

# Metrics
duration: 2min
completed: 2026-03-02
---

# Phase 1 Plan 02: Auth Pages and Server Actions Summary

**Email/password auth flow built with five Server Actions, four auth pages using React 19 useActionState, and PKCE token exchange route for Supabase email confirmation and password reset links**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-02T23:09:23Z
- **Completed:** 2026-03-02T23:11:38Z
- **Tasks:** 2
- **Files modified:** 8 created

## Accomplishments

- Created all five auth Server Actions (signUp, signIn, signOut, forgotPassword, updatePassword) with correct (prevState, formData) React 19 signature
- Built four auth pages under (auth) route group sharing a centered layout — signup, login, forgot-password, update-password
- Implemented /auth/confirm PKCE token exchange route outside the (auth) group so Supabase email links are not blocked by the auth gate
- Added /check-email page shown after signup while awaiting email confirmation
- All pages use useActionState (React 19 pattern), useSearchParams wrapped in Suspense, and inline error display
- signUp correctly points emailRedirectTo to /auth/confirm?next=/onboarding/step-1
- forgotPassword prevents email enumeration — same redirect regardless of account existence

## Task Commits

Each task was committed atomically:

1. **Task 1: Auth Server Actions** - `27a0d5e` (feat) — initial auth.ts
2. **Task 2: Auth pages and PKCE confirm route** - `a188c30` (feat) — all pages + auth.ts signature fix

## Files Created/Modified

- `mounttrack/src/actions/auth.ts` - Five Server Actions: signUp, signIn, signOut, forgotPassword, updatePassword
- `mounttrack/src/app/(auth)/layout.tsx` - Centered auth layout with MountTrack header
- `mounttrack/src/app/(auth)/signup/page.tsx` - Signup form with useActionState
- `mounttrack/src/app/(auth)/login/page.tsx` - Login form with message query param support and Suspense
- `mounttrack/src/app/(auth)/forgot-password/page.tsx` - Reset request with sent=true confirmation state
- `mounttrack/src/app/(auth)/update-password/page.tsx` - New password form with confirm field validation
- `mounttrack/src/app/auth/confirm/route.ts` - PKCE GET handler: verifyOtp then redirect to next param
- `mounttrack/src/app/check-email/page.tsx` - Post-signup confirmation page

## Decisions Made

- Server Actions use `(prevState, formData)` two-parameter signature — required by `useActionState` in React 19
- `/auth/confirm` placed outside `(auth)` route group — Supabase email links must not be intercepted by the auth redirect gate
- `forgotPassword` always redirects to `/forgot-password?sent=true` regardless of error — prevents email enumeration

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed Server Action signature for React 19 useActionState**
- **Found during:** Task 2 (auth pages implementation, TypeScript verification)
- **Issue:** Plan showed Server Actions with `(formData: FormData)` single-parameter signature. TypeScript error TS2769 — `useActionState` in React 19 requires actions with `(prevState: S, payload: unknown)` two-parameter signature. The first argument passed by `useActionState` is the previous state, not `formData`.
- **Fix:** Updated all four stateful actions to `(_prevState: AuthState, formData: FormData)`. Added `type AuthState = { error: string } | undefined` for type safety. `signOut` remains unchanged (no state, not used with useActionState).
- **Files modified:** `mounttrack/src/actions/auth.ts`
- **Commit:** a188c30

---

**Total deviations:** 1 auto-fixed (Rule 1 - bug)
**Impact on plan:** Essential correctness fix — React 19 useActionState API requires two-parameter action signature. No scope creep. All functional behavior identical to plan.

## Self-Check: PASSED

Files verified:
- FOUND: mounttrack/src/actions/auth.ts
- FOUND: mounttrack/src/app/(auth)/layout.tsx
- FOUND: mounttrack/src/app/(auth)/signup/page.tsx
- FOUND: mounttrack/src/app/(auth)/login/page.tsx
- FOUND: mounttrack/src/app/(auth)/forgot-password/page.tsx
- FOUND: mounttrack/src/app/(auth)/update-password/page.tsx
- FOUND: mounttrack/src/app/auth/confirm/route.ts
- FOUND: mounttrack/src/app/check-email/page.tsx

Commits verified:
- FOUND: 27a0d5e (Task 1)
- FOUND: a188c30 (Task 2)

TypeScript: 0 errors

## Next Phase Readiness

- Auth flow is complete — signup, login, password reset all wired end-to-end
- /auth/confirm PKCE route correctly handles both email confirmation (next=/onboarding/step-1) and password reset (next=/update-password)
- proxy.ts gate from Plan 01-01 will correctly redirect authenticated users away from auth pages
- Ready for Plan 01-03: onboarding wizard (shops table + Stripe subscription checkout)
