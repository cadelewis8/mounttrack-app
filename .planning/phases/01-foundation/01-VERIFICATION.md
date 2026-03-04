---
phase: 01-foundation
verified: 2026-03-04T00:00:00Z
status: human_needed
score: 13/13 automated must-haves verified
human_verification:
  - test: "Complete signup-to-dashboard flow end-to-end"
    expected: "Sign up with email -> confirmation email arrives -> click link -> land on /onboarding/step-1 -> enter shop name -> proceed to /onboarding/step-2 -> click 'Subscribe and pay' -> Stripe Checkout appears -> pay with test card -> brief spinner at /onboarding/complete -> redirect to /dashboard with welcome checklist"
    why_human: "Requires live Supabase project, Stripe credentials, and real email delivery — cannot verify without running services"
  - test: "Password reset flow end-to-end"
    expected: "Enter email on /forgot-password -> click 'Send reset link' -> confirmation screen shown -> reset email arrives -> click link -> land on /update-password -> enter new password -> redirect to /login with 'Password updated successfully' message"
    why_human: "Requires live Supabase PKCE token exchange and email delivery"
  - test: "Brand color live preview in branding settings"
    expected: "Open /settings/branding, drag the color wheel or change hex input, buttons and accent colors update in real time before saving"
    why_human: "Requires visual inspection of CSS variable injection and react-colorful picker interaction"
  - test: "Logo upload appears in sidebar"
    expected: "Upload a PNG/JPG/SVG under 2MB on /settings/branding, page reloads, logo appears in the sidebar replacing the shop name text"
    why_human: "Requires live Supabase Storage bucket and next/image with remotePatterns configured"
  - test: "Dark/light mode toggle persists across sessions"
    expected: "Click the moon/sun icon in the sidebar, theme switches, refresh the page, theme remains the same"
    why_human: "Requires browser session state inspection; cannot verify programmatically"
  - test: "Subscription gate blocks dashboard after lapse"
    expected: "Manually set subscription_status to 'canceled' in Supabase, visit /dashboard, get redirected to /settings/subscription which shows the 'Subscription inactive' blocked page with 'Renew subscription' button"
    why_human: "Requires live database mutation and proxy gate verification in browser"
  - test: "Stripe Customer Portal opens from subscription settings"
    expected: "On /settings/subscription with an active subscription, click 'Open billing portal', redirected to Stripe's hosted billing portal"
    why_human: "Requires live Stripe Customer Portal activation and redirect"
  - test: "RLS tenant isolation in database"
    expected: "Two separate shop owner accounts cannot read each other's shop records — verified by attempting a cross-user query in Supabase SQL Editor or confirming RLS is enabled with correct policies"
    why_human: "SQL verification requires access to the Supabase dashboard; policies are in migration SQL but migration must actually be run"
---

# Phase 1: Foundation Verification Report

**Phase Goal:** A shop owner can create an account, configure their shop, and have an active paid subscription — with a security model that enforces complete tenant isolation at the database level.
**Verified:** 2026-03-04
**Status:** human_needed
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Visiting any non-auth route while unauthenticated redirects to /login | VERIFIED | `src/lib/supabase/proxy.ts` lines 41-47: `if (!userId) { if (!isAuthRoute) redirect('/login') }` |
| 2 | Visiting /login while authenticated redirects to /dashboard | VERIFIED | `src/lib/supabase/proxy.ts` lines 51-53: `if (userId && isAuthRoute && !pathname.startsWith('/auth/')) redirect('/dashboard')` |
| 3 | Owner can sign up with email/password; receives confirmation email | VERIFIED | `src/actions/auth.ts` signUp: calls `supabase.auth.signUp` with `emailRedirectTo` pointing to `/auth/confirm?next=/onboarding/step-1`; page redirects to `/check-email` |
| 4 | Owner can log in with valid credentials and is redirected appropriately | VERIFIED | `src/actions/auth.ts` signIn: calls `signInWithPassword`, redirects to `/dashboard`; proxy.ts gate then directs to correct location |
| 5 | Invalid credentials show a clear inline error message | VERIFIED | `src/app/(auth)/login/page.tsx` line 23-26: `{state?.error && <p className="text-sm text-red-500...">{state.error}</p>}` |
| 6 | Owner can request a password reset email | VERIFIED | `src/actions/auth.ts` forgotPassword: calls `resetPasswordForEmail` with `redirectTo` pointing to `/auth/confirm?next=/update-password`; prevents email enumeration |
| 7 | Owner can set a new password via the reset email link | VERIFIED | `src/app/auth/confirm/route.ts`: PKCE GET handler calls `verifyOtp` then redirects to `next` param; `src/actions/auth.ts` updatePassword: validates and calls `updateUser` |
| 8 | shops table exists with RLS enforcing per-user isolation | VERIFIED | `supabase/migrations/0001_initial_schema.sql`: shops table with `ALTER TABLE shops ENABLE ROW LEVEL SECURITY` and four policies using `(SELECT auth.uid())` wrapper |
| 9 | All server Supabase code uses getClaims() not getSession() | VERIFIED | grep confirms getClaims() used in: proxy.ts, all pages in (app)/, all server actions. Zero getSession() calls in server code (only in a comment warning against it) |
| 10 | After step 1, owner is redirected to step 2; after step 2, Stripe Checkout; webhook sets onboarding_step=2 + subscription_status=active | VERIFIED | `saveShopSetup` redirects to `/onboarding/step-2`; `createSubscriptionCheckout` creates session and `redirect(session.url!)`; webhook handler sets `onboarding_step: 2` and `subscription_status` on `checkout.session.completed` |
| 11 | If owner abandons mid-wizard, proxy.ts resumes them at the correct step | VERIFIED | proxy.ts lines 66-81: checks `onboarding_step`, redirects to `step-1` (step=0) or `step-2` (step=1) if not onboarding route |
| 12 | A lapsed subscription blocks dashboard and shows renewal UI | VERIFIED | proxy.ts line 77-81: `subscription_status !== 'active'` redirects to `/settings/subscription`; that page renders `<SubscriptionGate />` which shows "Subscription inactive" with portal button |
| 13 | Owner can configure shop details, logo, brand color, and dark/light mode | VERIFIED | Settings pages at `/settings/shop`, `/settings/branding`, `/settings/subscription` exist; `uploadLogo` action wired to Supabase Storage; `updateBrandColor` + BrandingForm with live CSS variable preview; ThemeToggle wired to next-themes |

**Score:** 13/13 truths pass automated verification

---

## Required Artifacts

| Artifact | Provides | Status | Details |
|----------|----------|--------|---------|
| `src/proxy.ts` | Route protection — auth/onboarding/subscription gate | VERIFIED | Exports `proxy` and `config`; imports `updateSession`; matcher excludes `/api/webhooks/` |
| `src/lib/supabase/proxy.ts` | updateSession with gate logic | VERIFIED | Full gate logic: auth, onboarding step, subscription status; uses `getClaims().claims.sub` |
| `src/lib/supabase/server.ts` | Server-side Supabase client | VERIFIED | SSR client with cookie auth via `@supabase/ssr` |
| `src/lib/supabase/client.ts` | Browser-side Supabase client | VERIFIED | `createBrowserClient` from `@supabase/ssr` |
| `src/lib/supabase/service.ts` | Service role client bypassing RLS | VERIFIED | Used only in webhook handler |
| `supabase/migrations/0001_initial_schema.sql` | shops table + RLS + storage policies | VERIFIED | Contains `CREATE TABLE shops`, `ENABLE ROW LEVEL SECURITY`, 3 shop policies, 4 storage policies |
| `src/types/database.ts` | TypeScript types for Supabase tables | VERIFIED | Exports `Database`, `Shop`, `SubscriptionStatus` with `Views` and `Functions` for supabase-js compatibility |
| `src/actions/auth.ts` | signUp, signIn, signOut, forgotPassword, updatePassword | VERIFIED | All 5 actions exported; correct React 19 `(prevState, formData)` signature |
| `src/app/auth/confirm/route.ts` | PKCE token exchange | VERIFIED | GET handler calls `verifyOtp` then redirects to `next` param; outside `(auth)` group |
| `src/app/(auth)/login/page.tsx` | Login form | VERIFIED | Wired to `signIn`; shows inline errors; Suspense wrapper; message query param |
| `src/app/(auth)/signup/page.tsx` | Signup form | VERIFIED | Wired to `signUp`; shows inline errors |
| `src/app/(auth)/forgot-password/page.tsx` | Password reset request | VERIFIED | Wired to `forgotPassword`; shows sent confirmation state |
| `src/app/(auth)/update-password/page.tsx` | New password entry | VERIFIED | Wired to `updatePassword`; confirm field validation |
| `src/actions/shop.ts` | saveShopSetup, updateShopDetails, updateBrandColor, uploadLogo | VERIFIED | All 4 actions exported; uses `getClaims().claims.sub` pattern |
| `src/actions/billing.ts` | createSubscriptionCheckout, createPortalSession | VERIFIED | Both exported; shop_id in session.metadata AND subscription_data.metadata |
| `src/app/api/webhooks/stripe/route.ts` | Stripe webhook handler | VERIFIED | Signature verification before processing; handles checkout.session.completed, subscription.updated/deleted; uses service role client |
| `src/app/(onboarding)/onboarding/step-1/page.tsx` | Wizard step 1 | VERIFIED | Wired to `saveShopSetup`; StepIndicator showing "Step 1 of 2" |
| `src/app/(onboarding)/onboarding/step-2/page.tsx` | Wizard step 2 | VERIFIED | Wired to `createSubscriptionCheckout`; StepIndicator showing "Step 2 of 2" |
| `src/components/step-indicator.tsx` | Shared step indicator | VERIFIED | Shared component imported by both step pages |
| `src/app/(app)/layout.tsx` | Dashboard shell | VERIFIED | Brand color injected as `style={{ '--brand': shop.brand_color }}`; sidebar shows logo or shop name; ThemeToggle; signOut |
| `src/app/(app)/dashboard/page.tsx` | Welcome checklist | VERIFIED | Shows checklist of setup steps; not a placeholder |
| `src/app/(app)/settings/branding/page.tsx` | Branding settings | VERIFIED | Logo upload + brand color sections; wired to LogoUpload and BrandingForm |
| `src/components/brand-color-picker.tsx` | Color picker | VERIFIED | HexColorPicker + HexColorInput from react-colorful |
| `src/components/logo-upload.tsx` | Logo upload | VERIFIED | Wired to `uploadLogo`; auto-submits on file select; 2MB/type validation |
| `src/components/theme-toggle.tsx` | Dark/light mode toggle | VERIFIED | `mounted` state guards against hydration mismatch; wired to next-themes |
| `src/components/subscription-gate.tsx` | Lapsed subscription blocked UI | VERIFIED | Wired to `createPortalSession`; shows "Subscription inactive" with Renew button |

---

## Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `src/proxy.ts` | `src/lib/supabase/proxy.ts` | `updateSession` import | WIRED | Line 2: `import { updateSession } from '@/lib/supabase/proxy'`; line 5: `return await updateSession(request)` |
| `src/proxy.ts` | shops table `onboarding_step` | Supabase query in `updateSession` | WIRED | proxy.ts lines 57-61: queries shops with `.select('onboarding_step, subscription_status')`; gate logic on lines 66-81 |
| `supabase/migrations/0001_initial_schema.sql` | RLS policies | `auth.uid()` | WIRED | 3 shop policies all use `id = (SELECT auth.uid())`; confirmed SELECT/INSERT/UPDATE coverage |
| `src/app/(auth)/signup/page.tsx` | `src/actions/auth.ts` signUp | form action | WIRED | Line 3: `import { signUp }` ; line 7: `useActionState(signUp, undefined)` |
| `src/app/(auth)/login/page.tsx` | `src/actions/auth.ts` signIn | form action | WIRED | Line 2: `import { signIn }`; line 9: `useActionState(signIn, undefined)` |
| Supabase email link | `src/app/auth/confirm/route.ts` | `/auth/confirm` in signUp redirectTo | WIRED | signUp action sets `emailRedirectTo: '.../auth/confirm?next=/onboarding/step-1'` |
| `src/app/auth/confirm/route.ts` | `/update-password` | redirect after `verifyOtp` | WIRED | Route reads `next` query param and redirects; forgotPassword sets `?next=/update-password` |
| `src/app/(onboarding)/onboarding/step-2/page.tsx` | `createSubscriptionCheckout` | form action | WIRED | Line 2: `import { createSubscriptionCheckout }`; line 7: `useActionState(createSubscriptionCheckout, ...)` |
| Stripe Checkout success | `/onboarding/complete` | `success_url` in checkout session | WIRED | billing.ts line 26: `success_url: '.../onboarding/complete?session_id={CHECKOUT_SESSION_ID}'` |
| Stripe webhook | `src/app/api/webhooks/stripe/route.ts` | `STRIPE_WEBHOOK_SECRET` verification | WIRED | Route calls `stripe.webhooks.constructEvent(body, sig, STRIPE_WEBHOOK_SECRET!)` |
| `src/app/api/webhooks/stripe/route.ts` | shops table | service client update | WIRED | Sets `subscription_status`, `onboarding_step: 2`, `stripe_customer_id` on `checkout.session.completed` |
| `src/app/(app)/layout.tsx` | `shop.brand_color` | `--brand` CSS variable | WIRED | Line 26: `style={{ '--brand': shop.brand_color } as React.CSSProperties}` |
| `src/components/logo-upload.tsx` | Supabase Storage logos bucket | `uploadLogo` server action | WIRED | uploadLogo calls `supabase.storage.from('logos').upload(path, file, { upsert: true })` |
| `src/app/(app)/settings/subscription/page.tsx` | Stripe Customer Portal | `createPortalSession` via `BillingPortalButton` | WIRED | Page renders `<BillingPortalButton />` which uses `useActionState(createPortalSession, undefined)` |
| proxy.ts subscription gate | `/settings/subscription` showing SubscriptionGate | redirect when not active | WIRED | proxy.ts line 79: redirects to `/settings/subscription`; that page checks `subscription_status === 'active'` and renders `<SubscriptionGate />` if not |

---

## Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|---------|
| AUTH-01 | 01-01, 01-02 | Owner can create account with email and password | SATISFIED | `signUp` action + signup page + Supabase `signUp()` call |
| AUTH-02 | 01-01, 01-02 | Owner can log in and stay logged in across browser sessions | SATISFIED | `signIn` action uses `signInWithPassword`; session persisted via SSR cookie auth in `src/lib/supabase/server.ts` |
| AUTH-03 | 01-02 | Owner can reset password via email link | SATISFIED | `forgotPassword` + `updatePassword` actions; PKCE confirm route; update-password page |
| SHOP-01 | 01-03, 01-04 | Owner can set shop name, address, and contact details | SATISFIED | `saveShopSetup` (onboarding) + `updateShopDetails` (settings); all fields present |
| SHOP-02 | 01-04 | Owner can upload a shop logo | SATISFIED | `uploadLogo` action + LogoUpload component; Supabase Storage with per-user path; 2MB/type validation |
| SHOP-03 | 01-04 | Owner can set a custom brand color | SATISFIED | `updateBrandColor` action + BrandColorPicker + BrandingForm with live preview; CSS variable injection in layout |
| SHOP-04 | 01-03 | Owner can subscribe via Stripe Billing | SATISFIED | `createSubscriptionCheckout` + Stripe Checkout session; webhook provisions access; `createPortalSession` for management |
| SHOP-05 | 01-04 | Dashboard supports dark/light mode with manual toggle | SATISFIED | ThemeToggle component wired to next-themes; hydration-safe mount pattern; Providers wrap root layout with ThemeProvider |

All 8 requirements from plans (AUTH-01, AUTH-02, AUTH-03, SHOP-01, SHOP-02, SHOP-03, SHOP-04, SHOP-05) are SATISFIED in code.

Note on REQUIREMENTS.md traceability table: The table lists AUTH-03, SHOP-02, SHOP-03, SHOP-05 as "Pending" status. These are stale — all four are fully implemented. The table was not updated after plan execution.

---

## Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `src/app/(onboarding)/onboarding/step-1/page.tsx` | 33 | `placeholder="e.g. Big Buck Taxidermy"` | Info | HTML input placeholder attribute — not a code stub, correct UX usage |
| `src/components/logo-upload.tsx` | 17 | `{/* Current logo or placeholder */}` | Info | JSX comment describing conditional UI — not a code stub |

No blockers or warnings found. The two "placeholder" matches are legitimate UI patterns (HTML placeholder attribute and a descriptive comment), not stub implementations.

Security note: `getSession()` appears once in the entire codebase in a comment explicitly warning developers NOT to use it (`// Never use getSession() in server code`). Zero actual `getSession()` API calls exist in any server-side code path.

---

## Human Verification Required

The automated checks confirm that all code paths are correctly implemented and wired. However, the following require live services to verify end-to-end:

### 1. Signup to Dashboard Flow

**Test:** With `.env.local` configured and migration SQL run, sign up with a test email. Check that the confirmation email arrives, click the link, complete the wizard (shop name at step-1, test card at step-2), and confirm the welcome checklist appears at /dashboard.
**Expected:** Smooth flow from signup to dashboard; "Setting up your account..." spinner at /onboarding/complete resolves within a few seconds.
**Why human:** Requires live Supabase project, Stripe credentials in test mode, and functioning email delivery.

### 2. Password Reset Flow

**Test:** From /forgot-password, submit a registered email. Confirm the reset email arrives, click the link, land on /update-password, set a new password, get redirected to /login with the success message banner.
**Expected:** Full PKCE round-trip works; no "invalid_token" error.
**Why human:** Requires live Supabase and email delivery.

### 3. Brand Color Live Preview

**Test:** Open /settings/branding. Drag the color wheel or type a hex value. Verify buttons and accents update in real time before clicking Save.
**Expected:** CSS `--brand` variable updates immediately as the picker changes; Save persists the color and the sidebar accent updates on next load.
**Why human:** Visual behavior requires browser interaction.

### 4. Logo Upload in Sidebar

**Test:** Upload a PNG file under 2MB on /settings/branding. Verify the page reloads showing the logo in the 96x96 preview, and the sidebar replaces the shop name text with the logo image.
**Expected:** Logo visible in both the branding preview and the sidebar within the same session.
**Why human:** Requires live Supabase Storage bucket; next/image remotePatterns must be configured correctly.

### 5. Dark/Light Mode Persistence

**Test:** Click the moon/sun icon in the sidebar. Verify the theme switches. Refresh the page. Verify the theme remains the same.
**Expected:** next-themes persists the theme in localStorage/cookie across refresh.
**Why human:** Requires browser session inspection.

### 6. Subscription Gate Enforcement

**Test:** In Supabase, set a shop's `subscription_status` to `'canceled'`. Navigate to /dashboard in the browser. Verify redirect to /settings/subscription showing "Subscription inactive" with the "Renew subscription" button.
**Expected:** Gate works in production, not just in code.
**Why human:** Requires live database mutation and proxy behavior verification.

### 7. Stripe Customer Portal

**Test:** With an active test subscription, click "Open billing portal" on /settings/subscription. Verify redirect to Stripe's hosted portal.
**Expected:** Portal opens showing subscription management options for the test customer.
**Why human:** Requires Stripe Customer Portal to be activated in Stripe Dashboard settings.

### 8. RLS Tenant Isolation

**Test:** Using two separate browser sessions with two different accounts, verify Account A cannot read or write Account B's shop record. Confirm in Supabase SQL Editor that RLS is enabled on the shops table with the correct policies applied.
**Expected:** Cross-tenant queries return empty results or are blocked.
**Why human:** Migration SQL is ready to run but must actually be applied to a Supabase project; database-level policies cannot be verified without a running Supabase instance.

---

## Summary

All 13 observable truths are VERIFIED in code. Every artifact from all four plans exists, is substantive (not a stub), and is correctly wired to the components that depend on it. The `getClaims()` security pattern is applied consistently across all 13 server-side call sites with zero regressions to `getSession()`. The RLS migration SQL is complete with correct `(SELECT auth.uid())` wrapper on all three shop policies and all four storage policies.

The phase goal — "A shop owner can create an account, configure their shop, and have an active paid subscription with tenant isolation at the database level" — is fully implemented in code. The 8 items above require human testing with live services to confirm end-to-end correctness.

The REQUIREMENTS.md traceability table should be updated: AUTH-03, SHOP-02, SHOP-03, and SHOP-05 are listed as "Pending" but are in fact complete.

---

_Verified: 2026-03-04_
_Verifier: Claude (gsd-verifier)_
