# Phase 1: Foundation - Research

**Researched:** 2026-03-02
**Domain:** Next.js 16 App Router + Supabase Auth/RLS/Storage + Stripe Billing + Dark Mode
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Onboarding Flow**
- 3-step wizard: signup → shop setup → subscribe (in that order)
- Dashboard is fully blocked until all 3 wizard steps are complete — no partial access
- Step indicator at the top of each wizard screen (1 → 2 → 3) with back/next buttons
- If owner abandons mid-wizard, resume from the step they left off on next login (save progress per step)

**Subscription Gate**
- Hard lockout when subscription lapses or payment fails — blocked page with a clear "renew subscription" prompt
- No grace period at the app level (Stripe's built-in payment retry logic is sufficient)
- No free trial — subscription required to complete onboarding and access the dashboard
- Billing management (cancel, update card, view invoices) handled entirely via Stripe's hosted customer portal — no custom cancellation UI
- When resubscription succeeds: instant access restored, all shop data preserved

**Shop Setup**
- During onboarding wizard (step 2): only shop name is required to proceed — address, contact details, logo, and brand color are optional and can be completed later
- After onboarding: shop details are editable from a dedicated **Settings** page in the main nav
- Settings page is tabbed: **Shop** (name, address, contact) | **Branding** (logo, color) | **Subscription** (manage via Stripe portal) | **Stages** (added in Phase 2)
- First login after completing the wizard: show a welcome screen with a checklist (e.g., add logo, set brand color, create first job) — not dropped straight into an empty board

**Brand Color & Logo**
- Brand color: free color picker (any hex value) — color wheel UI + hex input field
- Brand color applied as accent only in the owner dashboard: buttons, active nav items, focus rings, highlights
- Before logo is uploaded: show shop name as text in the header/sidebar where the logo would appear
- Logo upload: accepts PNG, JPG, SVG — max 2MB — displayed square-cropped in the UI

### Claude's Discretion
- Exact dark/light mode implementation (CSS variables, next-themes, or similar)
- Specific layout and spacing of the wizard steps
- Error state and loading state designs throughout
- Exact Supabase RLS policy patterns (standard shop_id = auth.uid() pattern expected)

### Deferred Ideas (OUT OF SCOPE)
- None — discussion stayed within phase scope
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| AUTH-01 | Owner can create a shop account with email and password | Supabase `signUpWithPassword` + PKCE email confirmation flow |
| AUTH-02 | Owner can log in and stay logged in across browser sessions | Supabase cookie-based SSR auth (`@supabase/ssr`) with `proxy.ts` token refresh |
| AUTH-03 | Owner can reset password via email link | Supabase `resetPasswordForEmail` + `verifyOtp` + `updateUser` PKCE flow |
| SHOP-01 | Owner can set shop name, address, and contact details | Supabase `shops` table with RLS policy (`shop_id = auth.uid()`) |
| SHOP-02 | Owner can upload a shop logo used throughout the app | Supabase Storage bucket `logos/` with RLS INSERT/SELECT/UPDATE policies |
| SHOP-03 | Owner can set a custom brand color applied to the app UI | `react-colorful` `HexColorPicker` + `HexColorInput`, stored on `shops.brand_color` |
| SHOP-04 | Owner can subscribe to MountTrack via Stripe Billing | Stripe Checkout Session `mode: 'subscription'` + webhook handler + `stripe_customer_id` on shop record |
| SHOP-05 | Owner dashboard supports dark mode and light mode with a manual toggle | `next-themes` `ThemeProvider` with `attribute="class"` + CSS variables + `shadcn/ui` dark variant |
</phase_requirements>

---

## Summary

Phase 1 establishes the complete foundation: authentication, multi-tenant data isolation, shop configuration, logo upload, brand color, Stripe subscription billing, and dark/light mode. The stack is fully locked by CONTEXT.md — Next.js 16 App Router, Supabase (auth + database + storage), Stripe Billing, deployed to Vercel.

**Critical Next.js 16 discovery:** `middleware.ts` has been renamed to `proxy.ts` in Next.js 16 (released October 2025, stable as of early 2026). The export function name changes from `default` or `middleware` to `proxy` (or default). The logic is identical but the file and function naming must be updated. All Supabase SSR examples referencing `middleware.ts` must be adapted to `proxy.ts`.

The multi-tenancy model stores `shop_id` (equal to the owner's Supabase `auth.uid()`) on every table. RLS policies enforce `shop_id = (select auth.uid())` for SELECT/INSERT/UPDATE/DELETE. This is the simplest valid pattern for a single-owner-per-shop SaaS. The onboarding wizard step is tracked in the `shops` table as an `onboarding_step` integer (0 = not started, 1 = shop setup done, 2 = subscribed/complete), checked on every authenticated request via `proxy.ts`.

**Primary recommendation:** Initialize with `create-next-app@latest` (gives Next.js 16 + Turbopack), add `shadcn@latest init` for the component library, configure Supabase SSR auth with `proxy.ts`, establish RLS policies before any data work, and add Stripe subscription checkout + webhook endpoint before the wizard allows step 3 completion.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| next | 16.x (latest) | App Router, routing, SSR, Server Actions | Official Vercel framework; proxy.ts for auth gates; Server Actions eliminate API routes |
| react / react-dom | 19.2 | UI runtime | Bundled with Next.js 16; React Compiler support |
| @supabase/supabase-js | 2.80.x | Supabase client (auth, db, storage) | Official client; 2.80+ requires Node 20 |
| @supabase/ssr | latest | Cookie-based SSR auth for Next.js | Required for proxy.ts token refresh; replaces deprecated auth-helpers |
| stripe | 19.x | Stripe Node.js SDK | Current major version; API version 2026-02-25.clover |
| @stripe/stripe-js | latest | Stripe.js browser client | Required for Checkout redirect |
| next-themes | latest | Dark/light mode switching | Zero-flash theme switching; `suppressHydrationWarning` pattern |
| tailwindcss | 4.x | Utility-first CSS | Default in create-next-app; v4 uses CSS-native `@theme` (no config file needed) |
| react-colorful | latest | Brand color picker | Tiny (1.9 KB); provides `HexColorPicker` + `HexColorInput`; tree-shakable |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| shadcn/ui | latest CLI | Copy-paste component primitives | Buttons, tabs, dialogs, inputs, dropdowns throughout wizard and settings |
| @radix-ui/* | auto via shadcn | Accessible headless primitives | Underlying shadcn; do not install separately |
| typescript | 5.x | Type safety | Included in create-next-app; required by Next.js 16 |
| zod | 3.x | Schema validation | Form validation in Server Actions (wizard steps, settings forms) |
| react-hook-form | 7.x | Form state management | Wizard step forms, settings forms |
| @hookform/resolvers | latest | Zod + react-hook-form bridge | Pass zod schema as `resolver` to `useForm` |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| react-colorful | `@uiw/react-color` | uiw is heavier (40+ KB); react-colorful is 1.9 KB — prefer for bundle size |
| next-themes | Manual CSS class toggle | next-themes handles SSR flash prevention, localStorage persistence, system preference — don't hand-roll |
| shadcn/ui | Headless UI or MUI | shadcn copies source into project — full control, no version lock; right choice for this stack |
| Supabase Storage | Cloudinary or S3 | Supabase Storage is built-in with RLS; no additional service for v1 |
| Stripe Checkout (hosted) | Stripe Elements (embedded) | Hosted Checkout is sufficient for subscription signup; reduces PCI scope |

**Installation:**
```bash
# Bootstrap project
npx create-next-app@latest mounttrack --typescript --tailwind --eslint --app --src-dir

# Supabase
npm install @supabase/supabase-js @supabase/ssr

# Stripe
npm install stripe @stripe/stripe-js

# Theming
npm install next-themes

# Color picker
npm install react-colorful

# Form handling
npm install react-hook-form @hookform/resolvers zod

# shadcn/ui (run interactively — choose "New York" style, CSS variables)
npx shadcn@latest init
```

---

## Architecture Patterns

### Recommended Project Structure

```
src/
├── app/
│   ├── (auth)/                  # Auth route group — no layout chrome
│   │   ├── signup/page.tsx
│   │   ├── login/page.tsx
│   │   ├── forgot-password/page.tsx
│   │   ├── update-password/page.tsx
│   │   └── auth/confirm/route.ts  # PKCE token exchange
│   ├── (onboarding)/             # Wizard route group — minimal chrome
│   │   ├── onboarding/
│   │   │   ├── step-1/page.tsx  # Shop name (required) + optional details
│   │   │   └── step-2/page.tsx  # Stripe subscription
│   │   └── layout.tsx           # Wizard shell (step indicator)
│   ├── (app)/                   # Main app — full dashboard chrome
│   │   ├── dashboard/page.tsx   # Welcome checklist after first login
│   │   ├── settings/
│   │   │   ├── shop/page.tsx
│   │   │   ├── branding/page.tsx
│   │   │   └── subscription/page.tsx
│   │   └── layout.tsx           # Sidebar, nav, theme toggle
│   ├── api/
│   │   ├── webhooks/stripe/route.ts  # Stripe webhook handler
│   │   └── stripe/portal/route.ts   # Stripe Customer Portal redirect
│   └── layout.tsx               # Root layout: ThemeProvider, fonts
├── lib/
│   ├── supabase/
│   │   ├── client.ts            # Browser client (createBrowserClient)
│   │   ├── server.ts            # Server client (createServerClient)
│   │   └── proxy.ts             # updateSession for proxy.ts token refresh
│   ├── stripe/
│   │   └── client.ts            # Stripe server client singleton
│   └── utils.ts                 # cn() helper from shadcn
├── components/
│   ├── ui/                      # shadcn copied components
│   ├── brand-color-picker.tsx   # react-colorful wrapper
│   ├── logo-upload.tsx          # Supabase Storage upload with preview
│   ├── theme-toggle.tsx         # Dark/light toggle button
│   └── subscription-gate.tsx   # Blocked page when subscription lapses
├── actions/
│   ├── auth.ts                  # signUp, signIn, signOut Server Actions
│   ├── shop.ts                  # updateShop, uploadLogo Server Actions
│   └── billing.ts               # createCheckoutSession, createPortalSession
├── proxy.ts                     # Route protection (auth + onboarding + subscription)
└── types/
    └── database.ts              # Supabase generated types (supabase gen types)
```

### Pattern 1: Cookie-Based Supabase Auth with proxy.ts

**What:** Supabase SSR uses HTTP-only cookies for session management. The `proxy.ts` file (Next.js 16's replacement for `middleware.ts`) refreshes expired tokens on every request and enforces auth/onboarding/subscription gates.

**When to use:** Every authenticated route. Must run before any Server Component reads user data.

**Example:**
```typescript
// src/lib/supabase/proxy.ts
// Source: https://supabase.com/docs/guides/auth/server-side/nextjs
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Always use getClaims() not getSession() in server code
  const { data: { user } } = await supabase.auth.getClaims()

  // Redirect unauthenticated users to login
  if (!user && !request.nextUrl.pathname.startsWith('/login')
      && !request.nextUrl.pathname.startsWith('/signup')) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

// src/proxy.ts
// Source: https://nextjs.org/docs/app/getting-started/proxy
import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/proxy'

export async function proxy(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

### Pattern 2: Onboarding Step Gate in proxy.ts

**What:** After auth check, query the `shops` table to determine the owner's onboarding progress. Redirect to the correct wizard step or block the dashboard if not complete.

**When to use:** The proxy.ts `updateSession` function, after confirming the user is authenticated.

```typescript
// Extend updateSession with onboarding + subscription gate
// After confirming user exists:

// Fetch shop record (use service role key to bypass RLS in proxy)
const { data: shop } = await supabase
  .from('shops')
  .select('onboarding_step, subscription_status')
  .eq('id', user.id)
  .single()

const pathname = request.nextUrl.pathname
const isDashboard = pathname.startsWith('/dashboard') || pathname.startsWith('/settings')
const isOnboarding = pathname.startsWith('/onboarding')

if (!shop) {
  // New user — redirect to onboarding step 1
  if (!isOnboarding) return NextResponse.redirect(new URL('/onboarding/step-1', request.url))
} else if (shop.onboarding_step < 2) {
  // Wizard incomplete — redirect to appropriate step
  const step = shop.onboarding_step === 0 ? 'step-1' : 'step-2'
  if (!isOnboarding) return NextResponse.redirect(new URL(`/onboarding/${step}`, request.url))
} else if (shop.subscription_status !== 'active') {
  // Subscription lapsed — block dashboard with renewal page
  if (isDashboard && !pathname.startsWith('/settings/subscription')) {
    return NextResponse.redirect(new URL('/settings/subscription', request.url))
  }
}
```

### Pattern 3: Supabase RLS Multi-Tenant Isolation

**What:** Every table has a `shop_id UUID` column referencing the `shops` table. All four CRUD policies enforce `shop_id = (select auth.uid())`. The `(select ...)` wrapper caches the result per statement for performance.

**When to use:** Every table that stores shop-scoped data (all tables in this phase and beyond).

```sql
-- Source: https://supabase.com/docs/guides/database/postgres/row-level-security

-- Enable RLS
ALTER TABLE shops ENABLE ROW LEVEL SECURITY;

-- SELECT: owner sees only their shop
CREATE POLICY "shop_select" ON shops
FOR SELECT TO authenticated
USING (id = (SELECT auth.uid()));

-- INSERT: owner can only insert their own shop
CREATE POLICY "shop_insert" ON shops
FOR INSERT TO authenticated
WITH CHECK (id = (SELECT auth.uid()));

-- UPDATE: owner can only update their own shop
CREATE POLICY "shop_update" ON shops
FOR UPDATE TO authenticated
USING (id = (SELECT auth.uid()))
WITH CHECK (id = (SELECT auth.uid()));

-- Index for performance (critical)
CREATE INDEX shops_id_idx ON shops (id);

-- For other tenant-scoped tables (e.g., jobs in Phase 2):
-- shop_id column references shops(id)
-- Policy: shop_id = (SELECT auth.uid())
```

### Pattern 4: Stripe Subscription Checkout + Webhook Flow

**What:** Server Action creates a Checkout Session with `mode: 'subscription'`. Stripe webhook updates `subscription_status` and `stripe_customer_id` on the shop record. `proxy.ts` checks `subscription_status` on each request.

**When to use:** Wizard step 2 (subscribe) + ongoing subscription lifecycle.

```typescript
// src/actions/billing.ts
// Source: https://docs.stripe.com/billing/subscriptions/build-subscriptions
'use server'
import { stripe } from '@/lib/stripe/client'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function createSubscriptionCheckout() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getClaims()
  if (!user) throw new Error('Not authenticated')

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: process.env.STRIPE_PRICE_ID!, quantity: 1 }],
    success_url: `${process.env.NEXT_PUBLIC_URL}/onboarding/complete?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_URL}/onboarding/step-2`,
    customer_email: user.email,
    metadata: { shop_id: user.id },  // CRITICAL: links webhook to shop record
    subscription_data: {
      metadata: { shop_id: user.id },
    },
  })

  redirect(session.url!)
}

// src/app/api/webhooks/stripe/route.ts
import { stripe } from '@/lib/stripe/client'
import { createServiceClient } from '@/lib/supabase/service'  // service role key
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')!

  let event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = createServiceClient()

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object
      const shopId = session.metadata?.shop_id
      if (!shopId) break
      const subscription = await stripe.subscriptions.retrieve(session.subscription as string)
      await supabase.from('shops').update({
        stripe_customer_id: session.customer as string,
        stripe_subscription_id: subscription.id,
        subscription_status: subscription.status,
        onboarding_step: 2,  // Mark wizard complete
      }).eq('id', shopId)
      break
    }
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted': {
      const subscription = event.data.object
      const shopId = subscription.metadata?.shop_id
      if (!shopId) break
      await supabase.from('shops').update({
        subscription_status: subscription.status,
      }).eq('id', shopId)
      break
    }
    case 'invoice.paid': {
      const invoice = event.data.object
      // Subscription renewed — status already 'active' from subscription.updated
      // Optionally update billing period end
      break
    }
    case 'invoice.payment_failed': {
      // Stripe retries automatically — subscription.updated will fire with 'past_due'
      break
    }
  }

  return NextResponse.json({ received: true })
}
```

### Pattern 5: Storage RLS for Logo Upload

**What:** Supabase Storage bucket `logos` with INSERT/SELECT/UPDATE policies scoped to `auth.uid()` folder path. Logo stored at `logos/{user_id}/logo.{ext}`.

```sql
-- Source: https://supabase.com/docs/guides/storage/security/access-control

-- INSERT: owner uploads to their own folder
CREATE POLICY "logos_insert" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'logos' AND
  (storage.foldername(name))[1] = (SELECT auth.uid()::text)
);

-- SELECT: owner reads their own logo
CREATE POLICY "logos_select" ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'logos' AND
  (storage.foldername(name))[1] = (SELECT auth.uid()::text)
);

-- UPDATE: owner can overwrite their logo
CREATE POLICY "logos_update" ON storage.objects
FOR UPDATE TO authenticated
USING (
  bucket_id = 'logos' AND
  (storage.foldername(name))[1] = (SELECT auth.uid()::text)
);

-- DELETE: owner can remove their logo
CREATE POLICY "logos_delete" ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'logos' AND
  (storage.foldername(name))[1] = (SELECT auth.uid()::text)
);
```

### Pattern 6: Dark Mode with next-themes + CSS Variables

**What:** `ThemeProvider` wraps the root layout with `attribute="class"`. CSS variables define color tokens for both modes. `shadcn/ui` components use `dark:` variants automatically. Tailwind v4 uses `@theme` inline — no `tailwind.config.ts` needed.

```tsx
// src/app/layout.tsx
// Source: https://github.com/pacocoursey/next-themes
import { ThemeProvider } from 'next-themes'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
```

```css
/* src/app/globals.css — Tailwind v4 + CSS variables */
@import "tailwindcss";

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-brand: var(--brand);
}

:root {
  --background: #ffffff;
  --foreground: #0a0a0a;
  --brand: #6d28d9;  /* default; overridden by shop brand_color at runtime */
}

.dark {
  --background: #0a0a0a;
  --foreground: #fafafa;
  --brand: #8b5cf6;
}
```

**Brand color as CSS variable at runtime:**
```tsx
// In the (app) layout — inject brand color from shop record
<div style={{ '--brand': shop.brand_color } as React.CSSProperties}>
  {children}
</div>
```

### Pattern 7: Password Reset (PKCE Flow)

**What:** Supabase uses PKCE for secure server-side password resets. The email link points to `/auth/confirm` which exchanges the token hash for a session, then redirects to the update-password page.

```typescript
// Step 1: Send reset email (Server Action)
await supabase.auth.resetPasswordForEmail(email, {
  redirectTo: `${process.env.NEXT_PUBLIC_URL}/update-password`,
})

// Step 2: /auth/confirm route handler — exchanges token
// src/app/auth/confirm/route.ts
import { createClient } from '@/lib/supabase/server'
import { type EmailOtpType } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const next = searchParams.get('next') ?? '/'

  if (token_hash && type) {
    const supabase = await createClient()
    const { error } = await supabase.auth.verifyOtp({ type, token_hash })
    if (!error) return NextResponse.redirect(new URL(next, request.url))
  }

  return NextResponse.redirect(new URL('/login?error=invalid_token', request.url))
}

// Step 3: Update password (Server Action on update-password page)
await supabase.auth.updateUser({ password: newPassword })
```

### Anti-Patterns to Avoid

- **Using `getSession()` in server code:** Supabase now requires `getClaims()` (validates JWT against public keys). `getSession()` in server code does not revalidate the token — security vulnerability.
- **Using `middleware.ts` in Next.js 16:** Renamed to `proxy.ts`. The `middleware.ts` filename is deprecated in Next.js 16 and will be removed in a future version. Use `proxy.ts` from day one.
- **Complex authorization logic in proxy.ts:** The proxy is for optimistic checks (redirect if no session cookie). Full authorization (subscription status, onboarding step) should be light queries — but proxy.ts runs Node.js runtime in Next.js 16, so Supabase queries are fine.
- **Not using `(select auth.uid())` wrapper in RLS:** Without the `select` wrapper, `auth.uid()` is called once per row instead of once per statement — 94% performance penalty at scale.
- **Storing `onboarding_step` in `user_metadata`:** Use the `shops` table instead. `user_metadata` is harder to query from proxy.ts and creates coupling between auth and business data.
- **Missing `WITH CHECK` on INSERT/UPDATE policies:** `USING` alone controls which rows are visible; `WITH CHECK` is required to prevent cross-tenant writes.
- **Not verifying Stripe webhook signatures:** Always call `stripe.webhooks.constructEvent()` before processing any webhook event.
- **Single Stripe webhook event for provisioning:** Listen to both `checkout.session.completed` AND `customer.subscription.updated`/`deleted` — relying on only one event misses renewal failures and cancellations.
- **Omitting `suppressHydrationWarning` on `<html>`:** next-themes modifies the `html` element's class on mount — without this attribute, React will warn about hydration mismatch on every page load.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Theme switching with flash prevention | Custom cookie + class toggle | `next-themes` | Flash prevention, localStorage sync, system pref detection, SSR mismatch handling — all solved |
| Color picker UI | Custom canvas/SVG color wheel | `react-colorful` `HexColorPicker` + `HexColorInput` | Accessibility, touch support, keyboard navigation, correct color space math |
| Password reset flow | Custom token generation + email | Supabase `resetPasswordForEmail` PKCE | Token expiry, rate limiting, email delivery, PKCE security |
| Subscription lifecycle | Custom recurring billing | Stripe Billing | Retry logic, proration, tax, dunning, portal, invoices — years of edge cases |
| Multi-tenant row isolation | Application-level tenant filtering | Supabase RLS | DB-level enforcement; application filtering can be bypassed by bugs; RLS cannot |
| File upload with progress | Custom multipart upload | Supabase Storage SDK `upload()` | Resumable uploads, RLS enforcement, CDN delivery, signed URLs |
| Session token refresh | Manual JWT refresh logic | `@supabase/ssr` with `proxy.ts` | Handles race conditions, token rotation, cookie scoping across SSR/CSR |
| UI component primitives | Custom modal, dropdown, tabs | `shadcn/ui` (copies source) + `@radix-ui` | WAI-ARIA compliance, focus management, keyboard navigation — not trivial to implement |

**Key insight:** Every item in this list has subtle edge cases that take weeks to get right. The whole point of this stack is to compose these solved problems — the value is in the application logic (taxidermy job flow), not reinventing auth plumbing.

---

## Common Pitfalls

### Pitfall 1: Deprecated `middleware.ts` in Next.js 16

**What goes wrong:** Every Supabase SSR tutorial uses `middleware.ts` and `export default function middleware()`. In Next.js 16, the file must be named `proxy.ts` and export `proxy` (or use default export). Using the old name gives a deprecation warning and will break in future versions.
**Why it happens:** Next.js 16 was released October 2025 — most tutorials predate this.
**How to avoid:** Create `src/proxy.ts` (not `middleware.ts`). Export `proxy` function. Logic is identical.
**Warning signs:** Deprecation warning in dev console: "middleware.ts is deprecated, rename to proxy.ts"

### Pitfall 2: `getSession()` vs `getClaims()` in Server Code

**What goes wrong:** Using `supabase.auth.getSession()` inside Server Components or proxy.ts does not validate the JWT. An attacker can forge a session cookie.
**Why it happens:** `getSession()` reads from cookie directly without server-side validation. `getClaims()` validates the JWT signature against Supabase's public keys.
**How to avoid:** Always use `await supabase.auth.getClaims()` in `proxy.ts` and Server Components. Only use `getSession()` in client-side code.
**Warning signs:** Auth working but no actual JWT validation occurring.

### Pitfall 3: Stripe Webhook Path Excluded from Auth Gate

**What goes wrong:** `proxy.ts` redirects unauthenticated requests to `/login`. The Stripe webhook endpoint at `/api/webhooks/stripe` is unauthenticated (Stripe calls it) — if the matcher doesn't exclude `/api/` routes, all webhooks get redirected to the login page.
**Why it happens:** Broad matcher config catches all routes including API routes.
**How to avoid:** Either exclude `/api/` from the matcher, or handle it in the proxy logic by checking if the path starts with `/api/webhooks/` and returning `NextResponse.next()` immediately.
**Warning signs:** Stripe webhook deliveries failing with 302 redirects in the Stripe dashboard.

### Pitfall 4: Missing `shop_id` Metadata on Stripe Objects

**What goes wrong:** When `checkout.session.completed` fires, the shop_id is not available to the webhook handler — can't update the correct shop record.
**Why it happens:** Forgetting to include `metadata: { shop_id: user.id }` in the checkout session creation.
**How to avoid:** Always include `metadata: { shop_id: user.id }` in both `session.create()` and `subscription_data.metadata`. Store `stripe_subscription_id` on the shop record immediately on `checkout.session.completed`.
**Warning signs:** Webhook events arriving but no shop records updating.

### Pitfall 5: No RLS on Storage Bucket

**What goes wrong:** Supabase Storage buckets are private by default but require explicit RLS policies on `storage.objects` to allow any operations. Without them, all upload attempts return 403.
**Why it happens:** RLS on `storage.objects` is separate from bucket visibility settings — easy to miss.
**How to avoid:** Create INSERT + SELECT + UPDATE + DELETE policies on `storage.objects` with `bucket_id = 'logos'` condition before any upload code runs.
**Warning signs:** 403 errors on `supabase.storage.from('logos').upload(...)` even for authenticated users.

### Pitfall 6: `onboarding_step` Not Atomically Updated on Webhook

**What goes wrong:** Race condition where the success redirect from Stripe completes before the webhook fires and updates `onboarding_step` to 2. The proxy.ts sees `onboarding_step = 1` and redirects back to the wizard.
**Why it happens:** Stripe webhooks are async — the checkout success redirect happens first.
**How to avoid:** On the checkout success page (hit after Stripe redirect), poll or check `subscription_status` directly from Stripe before redirecting to the dashboard. Alternatively, let the webhook fire and use a loading/pending state on the success page that polls the shop record.
**Warning signs:** Users stuck in redirect loop after successful payment.

### Pitfall 7: Tailwind v4 CSS Variable Naming

**What goes wrong:** Tailwind v4 uses OKLCH colors by default and renames CSS variables. `shadcn/ui` components initialized with Tailwind v4 use `@theme inline` instead of `tailwind.config.ts`. Mixing v3 and v4 patterns causes classes to not apply.
**Why it happens:** shadcn/ui upgraded to support Tailwind v4 in 2025 — documentation and examples still show v3 patterns.
**How to avoid:** Run `npx shadcn@latest init` after project creation — it detects Tailwind v4 and configures correctly. Don't manually copy CSS variables from v3 examples.
**Warning signs:** shadcn components rendering without color/spacing despite correct class names.

### Pitfall 8: next-themes ThemeProvider Must Be a Client Component

**What goes wrong:** `ThemeProvider` from next-themes is a Client Component but must wrap the entire `<body>` in the root layout (a Server Component). Putting it directly in the Server Component layout without a wrapper causes errors.
**Why it happens:** The root `layout.tsx` is a Server Component by default in Next.js App Router.
**How to avoid:** Create `src/components/providers.tsx` with `'use client'` and import `ThemeProvider` there. Import `<Providers>` in the root layout instead.
**Warning signs:** "You're importing a component that needs `useState`" error in root layout.

---

## Code Examples

### Supabase Browser Client

```typescript
// src/lib/supabase/client.ts
// Source: https://supabase.com/docs/guides/auth/server-side/creating-a-client
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  )
}
```

### Supabase Server Client

```typescript
// src/lib/supabase/server.ts
// Source: https://supabase.com/docs/guides/auth/server-side/creating-a-client
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Server Component — cookies set in proxy.ts
          }
        },
      },
    }
  )
}
```

### Stripe Server Client

```typescript
// src/lib/stripe/client.ts
import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-02-25.clover',
  typescript: true,
})
```

### Sign Up Server Action

```typescript
// src/actions/auth.ts
'use server'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function signUp(formData: FormData) {
  const supabase = await createClient()
  const { error } = await supabase.auth.signUp({
    email: formData.get('email') as string,
    password: formData.get('password') as string,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_URL}/auth/confirm`,
    },
  })
  if (error) return { error: error.message }
  redirect('/check-email')
}
```

### Brand Color Picker Component

```tsx
// src/components/brand-color-picker.tsx
// Source: https://github.com/omgovich/react-colorful
'use client'
import { HexColorPicker, HexColorInput } from 'react-colorful'
import { useState } from 'react'

interface BrandColorPickerProps {
  value: string
  onChange: (color: string) => void
}

export function BrandColorPicker({ value, onChange }: BrandColorPickerProps) {
  return (
    <div className="flex flex-col gap-3">
      <HexColorPicker color={value} onChange={onChange} />
      <div className="flex items-center gap-2">
        <div
          className="h-8 w-8 rounded border"
          style={{ backgroundColor: value }}
        />
        <HexColorInput
          color={value}
          onChange={onChange}
          prefixed
          className="w-28 rounded border px-2 py-1 font-mono text-sm"
        />
      </div>
    </div>
  )
}
```

### Logo Upload with Supabase Storage

```typescript
// src/actions/shop.ts
'use server'
import { createClient } from '@/lib/supabase/server'

export async function uploadLogo(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getClaims()
  if (!user) throw new Error('Not authenticated')

  const file = formData.get('logo') as File

  // Validate: max 2MB, accept PNG/JPG/SVG
  if (file.size > 2 * 1024 * 1024) return { error: 'File must be under 2MB' }
  const allowed = ['image/png', 'image/jpeg', 'image/svg+xml']
  if (!allowed.includes(file.type)) return { error: 'Only PNG, JPG, SVG allowed' }

  const ext = file.name.split('.').pop()
  const path = `${user.id}/logo.${ext}`

  const { error } = await supabase.storage
    .from('logos')
    .upload(path, file, { upsert: true })

  if (error) return { error: error.message }

  const { data: { publicUrl } } = supabase.storage.from('logos').getPublicUrl(path)

  await supabase.from('shops').update({ logo_url: publicUrl }).eq('id', user.id)
  return { success: true, url: publicUrl }
}
```

### Shops Database Schema

```sql
-- Core shops table — establishes multi-tenant foundation
CREATE TABLE shops (
  -- id equals auth.uid() — one shop per owner account
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Shop identity
  name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,

  -- Branding
  logo_url TEXT,
  brand_color TEXT DEFAULT '#6d28d9',

  -- Stripe billing
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  subscription_status TEXT DEFAULT 'inactive',
  -- subscription_status values: 'inactive' | 'active' | 'past_due' | 'canceled' | 'unpaid'

  -- Onboarding wizard progress
  -- 0 = just signed up, 1 = shop setup done, 2 = subscribed (wizard complete)
  onboarding_step INTEGER DEFAULT 0,

  -- Welcome checklist tracking
  welcome_dismissed BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE shops ENABLE ROW LEVEL SECURITY;

-- Policies (all use auth.uid() matching id directly since id = auth.uid())
CREATE POLICY "shop_select" ON shops FOR SELECT TO authenticated
  USING (id = (SELECT auth.uid()));

CREATE POLICY "shop_insert" ON shops FOR INSERT TO authenticated
  WITH CHECK (id = (SELECT auth.uid()));

CREATE POLICY "shop_update" ON shops FOR UPDATE TO authenticated
  USING (id = (SELECT auth.uid()))
  WITH CHECK (id = (SELECT auth.uid()));

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER shops_updated_at
  BEFORE UPDATE ON shops
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `middleware.ts` + `export default function middleware()` | `proxy.ts` + `export function proxy()` | Next.js 16 (Oct 2025) | File and function rename required; logic unchanged |
| `supabase.auth.getSession()` in server code | `supabase.auth.getClaims()` | Supabase SSR 2024+ | Security: `getClaims()` validates JWT server-side; `getSession()` does not |
| `@supabase/auth-helpers-nextjs` | `@supabase/ssr` | 2023–2024 | auth-helpers deprecated; `@supabase/ssr` is the current package |
| Tailwind `tailwind.config.ts` with `theme.extend` | `@theme inline` in CSS with Tailwind v4 | Tailwind v4 (2025) | No config file needed; CSS-native variables |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase 2025 key rename | Both work currently; new projects should use new name |
| Stripe API version `2024-xx-xx` | `2026-02-25.clover` | Stripe ongoing | Match stripe npm package version; set in Stripe client constructor |
| `revalidateTag(tag)` (1 arg) | `revalidateTag(tag, 'max')` | Next.js 16 | Single-arg form deprecated; second arg (cacheLife profile) now required |

**Deprecated/outdated:**
- `@supabase/auth-helpers-nextjs`: Deprecated — use `@supabase/ssr` exclusively
- `middleware.ts` filename in Next.js 16: Deprecated — rename to `proxy.ts`
- `supabase.auth.getSession()` in server code: Insecure — use `getClaims()` instead
- Stripe `experimental.dynamicIO` config flag: Renamed to `cacheComponents` in Next.js 16
- `next lint` command: Removed from Next.js 16 — use `eslint` directly

---

## Open Questions

1. **Supabase `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` vs `NEXT_PUBLIC_SUPABASE_ANON_KEY`**
   - What we know: Supabase documentation now uses `PUBLISHABLE_KEY` but both work
   - What's unclear: Whether older `ANON_KEY` will be deprecated or just renamed in dashboard
   - Recommendation: Use `PUBLISHABLE_KEY` for new projects (matches current docs); ensure env var name consistency across Vercel and local `.env.local`

2. **Stripe webhook: idempotency when `checkout.session.completed` retries**
   - What we know: Stripe retries webhooks — duplicate events will arrive
   - What's unclear: Whether `upsert` on the shops table is sufficient or if event ID deduplication is needed
   - Recommendation: Use `stripe_subscription_id` as idempotency key — `upsert` on the shops table will safely handle duplicates since the data being written is the same

3. **Logo bucket visibility: public vs private**
   - What we know: Private bucket requires signed URLs (expire); public bucket gives permanent URLs
   - What's unclear: Whether the logo URL needs to be embedded in customer-facing portal (Phase 4) — if so, signed URLs would expire
   - Recommendation: Make the `logos` bucket **public** (no signed URL needed, logo is not sensitive) — consistent with how shop logos work across products. Note: RLS on `storage.objects` still controls who can *upload/modify*, not who can *read* from a public bucket.

4. **`onboarding_step` race condition on Stripe success redirect**
   - What we know: Success redirect arrives before webhook in most cases
   - What's unclear: Best UX for the transition (instant vs polling)
   - Recommendation: On the `/onboarding/complete` page, show a "Activating your subscription..." state and poll the shop record every 2 seconds until `subscription_status = 'active'`. 5-second timeout with fallback message.

---

## Sources

### Primary (HIGH confidence)
- [Supabase SSR Next.js Setup](https://supabase.com/docs/guides/auth/server-side/nextjs) — middleware/proxy setup, getClaims(), cookie patterns
- [Supabase RLS Docs](https://supabase.com/docs/guides/database/postgres/row-level-security) — multi-tenant policy patterns, performance optimization
- [Supabase Storage Access Control](https://supabase.com/docs/guides/storage/security/access-control) — storage.objects RLS policies, storage.foldername()
- [Supabase Password Auth](https://supabase.com/docs/guides/auth/passwords) — PKCE flow, resetPasswordForEmail, verifyOtp
- [Stripe Subscription Webhooks](https://docs.stripe.com/billing/subscriptions/webhooks) — webhook events, subscription lifecycle
- [Stripe Build Subscriptions](https://docs.stripe.com/billing/subscriptions/build-subscriptions) — checkout session, webhook handling
- [Next.js 16 Release](https://nextjs.org/blog/next-16) — proxy.ts (was middleware.ts), breaking changes, version info
- [Next.js Proxy Docs](https://nextjs.org/docs/app/getting-started/proxy) — proxy.ts API, matcher config
- [next-themes GitHub](https://github.com/pacocoursey/next-themes) — ThemeProvider config, suppressHydrationWarning, CSS variables
- [shadcn/ui Next.js Install](https://ui.shadcn.com/docs/installation/next) — setup commands, component installation

### Secondary (MEDIUM confidence)
- [Pedro Alonso — Stripe + Next.js 15 Complete Guide](https://www.pedroalonso.net/blog/stripe-nextjs-complete-guide-2025/) — checkout session flow, webhook handlers, customer portal — verified against Stripe official docs
- [Antstack Multi-Tenant RLS](https://www.antstack.com/blog/multi-tenant-applications-with-rls-on-supabase-postgress/) — tenant_id RLS patterns — consistent with Supabase docs
- [react-colorful npm](https://www.npmjs.com/package/react-colorful) — package size, HexColorPicker API, TypeScript support

### Tertiary (LOW confidence)
- Community onboarding wizard patterns — no single authoritative source; derived from general Supabase + Next.js patterns

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all versions verified against official sources (Next.js 16, @supabase/supabase-js 2.80.x, stripe 19.x, react-colorful)
- Architecture: HIGH — patterns derived from official Supabase SSR docs, Next.js 16 proxy.ts docs, Stripe subscription docs
- Pitfalls: HIGH — all pitfalls verified against official sources or official changelogs (especially proxy.ts rename, getClaims vs getSession)
- Dark mode: HIGH — next-themes GitHub + Tailwind v4 + shadcn/ui all verified

**Research date:** 2026-03-02
**Valid until:** 2026-04-01 (30 days — stack is stable but Supabase and Stripe update frequently)
