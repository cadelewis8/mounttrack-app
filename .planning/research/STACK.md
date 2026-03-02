# Technology Stack

**Project:** MountTrack
**Researched:** 2026-03-01
**Confidence note:** Read tool and web search tools were unavailable during this research session. All version claims and recommendations are based on training knowledge (cutoff August 2025). Versions marked with * should be verified against official changelogs before locking them in. Architecture patterns are well-established and HIGH confidence; specific version numbers should be confirmed.

---

## Recommended Stack

### Core Framework

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Next.js | 15.x (App Router) | Full-stack web framework | App Router is stable and the established default; Server Components reduce client JS; Server Actions eliminate API boilerplate for owner-side mutations; built-in caching model suits this app's read-heavy dashboard |
| React | 19.x | UI rendering | Ships with Next.js 15; concurrent features improve Kanban drag-and-drop responsiveness |
| TypeScript | 5.x | Type safety | Non-negotiable for a multi-tenant app — RLS policies and Stripe webhook shapes must be typed precisely to avoid data leakage bugs |

### Database / Backend Services

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Supabase | Latest JS SDK (`@supabase/supabase-js` 2.x) | Auth + PostgreSQL + Storage + Realtime | Single managed backend; RLS at DB level means even a broken API route cannot leak cross-tenant data; Storage handles job photos with CDN delivery |
| `@supabase/ssr` | 0.x (latest) | Server-side Supabase client for Next.js | Required for App Router — replaces the deprecated `@supabase/auth-helpers-nextjs`; provides `createServerClient` for Server Components and `createBrowserClient` for Client Components |
| PostgreSQL | Managed by Supabase | Relational data store | Multi-tenant with RLS; JSON columns for flexible stage config per shop; foreign-key integrity between shops, jobs, payments |

### Payments

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Stripe | `stripe` Node SDK 16.x+ | Billing + Payment collection | Two distinct use contexts in this app (see Dual Stripe Pattern below); Stripe Billing handles subscription lifecycle; Payment Intents handle customer portal payments |
| `@stripe/stripe-js` | 4.x | Browser-side Stripe Elements | Used only in customer portal — loads asynchronously, does not block owner dashboard |
| `@stripe/react-stripe-js` | 2.x | React wrapper for Stripe Elements | Embeddable payment form on no-auth customer portal; handles card input, partial amounts |

### Notifications

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Twilio | `twilio` SDK 5.x | SMS notifications | Industry standard; reliable delivery; programmatic send from Server Actions or API routes on stage change; Messaging Services for sender pool |
| Resend | `resend` SDK 3.x+ | Transactional email | Purpose-built for developers; React Email component model matches this stack perfectly; better DX than SendGrid/Mailgun; generous free tier for MVP validation |
| React Email | `@react-email/components` 0.x | Email templates | Renders branded email templates as React components; co-located with app code; renders to HTML string passed to Resend SDK |

### Deployment & Infrastructure

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Vercel | Current | Hosting + Edge Network + CI/CD | First-class Next.js support; zero-config deployment; Edge Middleware for tenant routing; built-in environment variable management; preview deployments per PR |

### UI & Styling

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Tailwind CSS | 4.x | Styling | v4 removes the config file overhead; CSS-first config; mobile-first utility classes align with the mobile-owner requirement; dark mode via `dark:` variant |
| shadcn/ui | Latest (not versioned — copied components) | Component library | Not a dependency — components are copied into the repo; fully customizable; works with Tailwind 4; includes accessible Kanban primitives and form components; avoid the abstraction trap of component libraries with locked APIs |
| `@dnd-kit/core` + `@dnd-kit/sortable` | 6.x | Drag-and-drop Kanban | Accessibility-first; touch-compatible (owner works on phone); works in React 19 without issues; lighter than `react-beautiful-dnd` which is unmaintained |

### State Management

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Zustand | 5.x | Client state (Kanban board, UI state) | Minimal boilerplate; works well alongside Server Components; use only for genuinely client-side ephemeral state (drag state, modal open/close, optimistic UI); do NOT use for server data |
| TanStack Query (`@tanstack/react-query`) | 5.x | Server state caching | For client components that need polling or optimistic updates (job board); avoid in Server Components — fetch directly there; pairs with Supabase Realtime for live job updates |

### Forms & Validation

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| React Hook Form | 7.x | Form state management | Performance-focused; minimal re-renders; works with Server Actions via `useFormState`/`useActionState` |
| Zod | 3.x | Schema validation | Shared schemas between client-side form validation and Server Action input validation; generate TypeScript types from schemas; validate Stripe webhook payloads |

### File Uploads

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Supabase Storage | (built into Supabase SDK) | Photo storage for jobs | Direct upload from client using signed URLs; no intermediary server required; bucket-per-shop or folder-per-shop organization; CDN delivery; RLS policies on Storage buckets mirror DB policies |

### Testing

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Vitest | 2.x | Unit + integration tests | Fast; native TypeScript; compatible with Vite ecosystem; use for RLS policy testing, webhook handler testing, notification template testing |
| Playwright | 1.x | E2E tests | Critical for payment flows and multi-tenant isolation verification; test the customer portal token flow end-to-end |

---

## Dual Stripe Pattern (Critical Design Decision)

This app has two completely separate Stripe contexts. They must never be confused.

### Context 1: Shop Owner Subscription (Stripe Billing)

**Who pays:** The shop owner (MountTrack customer)
**What they pay for:** Monthly SaaS subscription to use MountTrack
**Stripe product:** Subscription via `stripe.subscriptions.create`, `stripe.checkout.sessions.create` with `mode: 'subscription'`
**Stripe Customer:** One Stripe Customer per shop, stored as `stripe_customer_id` on the `shops` table
**Webhook events to handle:**
- `customer.subscription.created` — activate shop account
- `customer.subscription.updated` — plan changes
- `customer.subscription.deleted` — deactivate/grace period
- `invoice.payment_failed` — alert owner, pause features
- `invoice.payment_succeeded` — confirm billing cycle

**Pattern:** Use Stripe Billing Portal (`stripe.billingPortal.sessions.create`) for subscription management — do not build your own subscription management UI.

### Context 2: Customer Payment for Mount Job (Payment Intents)

**Who pays:** The end customer (taxidermy client)
**What they pay for:** Their mount job balance (full or partial)
**Stripe product:** Payment Intent via `stripe.paymentIntents.create` with `amount` set to the remaining balance or a partial amount specified by the customer
**Stripe Account:** Payments go to the shop owner's connected account OR to MountTrack's Stripe account with `application_fee_amount` (Stripe Connect if revenue sharing; direct charge if not)
**No Stripe Customer created** for the end customer (they have no login, no account)
**Webhook events to handle:**
- `payment_intent.succeeded` — update `payments` table, recalculate outstanding balance
- `payment_intent.payment_failed` — surface error to customer on portal

**Key implementation detail:** The Payment Intent is created server-side (Server Action or API route) and the `client_secret` is passed to the customer portal page. Stripe Elements on the portal completes the payment. Never expose the Stripe secret key to the browser.

### Stripe Connect Decision

For v1: Use a single MountTrack Stripe account and track which shop the payment belongs to in your own database. This is simpler. Stripe Connect (splitting funds to shops) is a v2+ feature — only needed if MountTrack takes a cut of customer payments or if shops need payouts.

---

## Multi-Tenancy with Supabase RLS

### Core Pattern

Every table that contains tenant-scoped data has a `shop_id` column (UUID, foreign key to `shops.id`). RLS policies enforce that authenticated users can only touch rows where `shop_id` matches their session's shop.

### Auth Flow

1. Owner signs up via Supabase Auth — creates an auth user
2. On first login after signup, a `shops` row is created and a `shop_members` row links `auth.uid()` to `shop_id`
3. All subsequent requests include the session JWT — Supabase extracts `auth.uid()` to evaluate RLS

### RLS Policy Pattern

```sql
-- Enable RLS on all tenant tables
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

-- Owner can SELECT their shop's jobs
CREATE POLICY "shop members can read jobs"
ON jobs FOR SELECT
USING (
  shop_id IN (
    SELECT shop_id FROM shop_members
    WHERE user_id = auth.uid()
  )
);

-- Owner can INSERT jobs into their shop
CREATE POLICY "shop members can insert jobs"
ON jobs FOR INSERT
WITH CHECK (
  shop_id IN (
    SELECT shop_id FROM shop_members
    WHERE user_id = auth.uid()
  )
);

-- Same pattern for UPDATE and DELETE
```

### Customer Portal Access (No-Auth Pattern)

Customer portal uses a `token` (UUID v4, generated at job creation, stored on the `jobs` table). The token is embedded in the portal URL: `/portal/[token]`.

Portal Server Component reads the job by token using the **Supabase service role client** (bypasses RLS) — this is acceptable because:
1. The route handler validates the token exists before returning any data
2. Only non-sensitive job data is returned (no other customer's data, no financial data beyond this job's balance)
3. The service role client is only used server-side, never in the browser

```typescript
// Server component — customer portal
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // never expose this to browser
  { auth: { persistSession: false } }
);

const { data: job } = await supabaseAdmin
  .from('jobs')
  .select('id, job_number, stage, estimated_completion, photos, balance_due, shop:shops(name, logo_url, brand_color)')
  .eq('portal_token', params.token)
  .single();
```

Do NOT add the token to any RLS policy — the service role approach is the right pattern for public-but-token-gated access.

### Supabase Storage RLS

Storage buckets for job photos should be private, with signed URLs for customer portal display:

```sql
-- Storage policy: shop members can upload to their shop's folder
CREATE POLICY "shop members can upload photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'job-photos' AND
  (storage.foldername(name))[1] IN (
    SELECT shop_id::text FROM shop_members
    WHERE user_id = auth.uid()
  )
);
```

For customer portal photo display: generate short-lived signed URLs server-side and pass them to the client component.

---

## What NOT to Use

| Category | Avoid | Why | Use Instead |
|----------|-------|-----|-------------|
| Auth library | `@supabase/auth-helpers-nextjs` | Deprecated; App Router incompatible | `@supabase/ssr` |
| Component library | MUI / Chakra UI / Ant Design | Too heavy; fights with Tailwind; hard to customize for brand colors | shadcn/ui (copy-paste model) |
| Drag-and-drop | `react-beautiful-dnd` | Unmaintained since 2023; not touch-friendly | `@dnd-kit/core` + `@dnd-kit/sortable` |
| State management | Redux / Jotai for server data | Overengineered; duplicates server state | TanStack Query for server data, Zustand for UI state |
| ORM | Prisma / Drizzle | Supabase has its own type-safe client; adding an ORM duplicates the abstraction and loses RLS benefits if used incorrectly | Supabase JS SDK + generated types |
| Email | Nodemailer / SendGrid | Nodemailer is self-managed SMTP; SendGrid DX is poor | Resend + React Email |
| File upload | `multer` / custom presigned S3 | Supabase Storage already included; adds infrastructure complexity | Supabase Storage SDK |
| SMS | AWS SNS | More complex setup, worse developer DX | Twilio |
| Realtime | Socket.io / Pusher | Supabase Realtime is built in; adding another WebSocket provider creates two connections | Supabase Realtime Postgres Changes |
| Payments (DIY) | Manual bank transfer tracking | No fraud protection, no compliance | Stripe (already decided) |
| CSS | CSS Modules / Styled Components | Fragmented with Tailwind; mixing paradigms creates maintenance debt | Tailwind CSS exclusively |
| Routing | React Router | Not compatible with Next.js App Router | Next.js App Router natively |

---

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Framework | Next.js 15 App Router | Remix / SvelteKit | Stack is already decided; App Router is mature and Vercel-native |
| Database | Supabase | PlanetScale / Neon / Firebase | Stack is already decided; Supabase uniquely combines auth + RLS + storage + realtime in one service |
| Styling | Tailwind CSS v4 | Tailwind v3 | v4 is the current release; v3 is in maintenance mode; v4's CSS-first config reduces tooling complexity |
| Drag-and-drop | @dnd-kit | react-beautiful-dnd | @dnd-kit is maintained, accessible, and touch-compatible; react-beautiful-dnd is archived |
| Email rendering | React Email | MJML / raw HTML | React Email is co-located TypeScript, type-safe, and renders to the same HTML as MJML |
| Kanban UI base | shadcn/ui | Radix UI primitives directly | shadcn/ui is already assembled from Radix primitives; no reason to rebuild that layer |

---

## Key Version Summary (Verify Before Locking)

| Package | Expected Version* | Notes |
|---------|-------------------|-------|
| `next` | 15.x | Verify: https://github.com/vercel/next.js/releases |
| `react` | 19.x | Verify: https://github.com/facebook/react/releases |
| `typescript` | 5.x | Verify: https://www.typescriptlang.org/docs/handbook/release-notes/overview.html |
| `@supabase/supabase-js` | 2.x | Verify: https://github.com/supabase/supabase-js/releases |
| `@supabase/ssr` | 0.x | Verify: https://github.com/supabase/ssr/releases |
| `stripe` | 16.x+ | Verify: https://github.com/stripe/stripe-node/releases |
| `@stripe/stripe-js` | 4.x | Verify: https://github.com/stripe/stripe-js/releases |
| `@stripe/react-stripe-js` | 2.x | Verify: https://github.com/stripe/react-stripe-js/releases |
| `twilio` | 5.x | Verify: https://github.com/twilio/twilio-node/releases |
| `resend` | 3.x+ | Verify: https://github.com/resend/resend-node/releases |
| `react-email` | 3.x+ | Verify: https://github.com/resend/react-email/releases |
| `tailwindcss` | 4.x | Verify: https://github.com/tailwindlabs/tailwindcss/releases |
| `@dnd-kit/core` | 6.x | Verify: https://github.com/clauderic/dnd-kit/releases |
| `zustand` | 5.x | Verify: https://github.com/pmndrs/zustand/releases |
| `@tanstack/react-query` | 5.x | Verify: https://github.com/TanStack/query/releases |
| `react-hook-form` | 7.x | Verify: https://github.com/react-hook-form/react-hook-form/releases |
| `zod` | 3.x | Verify: https://github.com/colinhacks/zod/releases |
| `vitest` | 2.x | Verify: https://github.com/vitest-dev/vitest/releases |
| `playwright` | 1.x | Verify: https://github.com/microsoft/playwright/releases |

*Versions are based on training knowledge through August 2025. This research session was conducted 2026-03-01 with web research tools unavailable. Verify all versions against official releases before use.

---

## Installation

```bash
# Core framework
npm install next react react-dom typescript

# Supabase
npm install @supabase/supabase-js @supabase/ssr

# Stripe
npm install stripe @stripe/stripe-js @stripe/react-stripe-js

# Notifications
npm install twilio resend @react-email/components

# UI + Styling
npm install tailwindcss @tailwindcss/vite
npx shadcn@latest init

# Drag-and-drop
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities

# State + data fetching
npm install zustand @tanstack/react-query

# Forms + validation
npm install react-hook-form zod @hookform/resolvers

# Dev dependencies
npm install -D vitest @vitejs/plugin-react playwright @playwright/test
npm install -D @types/react @types/node
```

---

## Supabase Type Generation

Generate TypeScript types from the database schema — do this from day one:

```bash
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/types/database.types.ts
```

Add to `package.json` scripts:
```json
{
  "scripts": {
    "db:types": "supabase gen types typescript --project-id YOUR_PROJECT_ID > src/types/database.types.ts"
  }
}
```

Run after every migration. Never hand-write database types.

---

## Environment Variables

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=      # Server-side only. NEVER prefix with NEXT_PUBLIC_

# Stripe — Shop subscriptions
STRIPE_SECRET_KEY=              # Server-side only
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=          # For validating webhook signatures

# Twilio
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_MESSAGING_SERVICE_SID=   # Use Messaging Service, not a single number

# Resend
RESEND_API_KEY=

# App
NEXT_PUBLIC_APP_URL=            # Used for portal link generation: https://app.mounttrack.com
```

**Critical:** `SUPABASE_SERVICE_ROLE_KEY` and `STRIPE_SECRET_KEY` must never be prefixed with `NEXT_PUBLIC_`. Any variable prefixed `NEXT_PUBLIC_` is embedded in the client bundle and visible to all users.

---

## Sources

- **Confidence: MEDIUM** — Stack pattern knowledge based on training data through August 2025. Web research tools were unavailable during this session; all recommendations should be cross-checked against official documentation before implementation.
- Next.js App Router documentation: https://nextjs.org/docs/app
- Supabase SSR documentation: https://supabase.com/docs/guides/auth/server-side/nextjs
- Supabase RLS documentation: https://supabase.com/docs/guides/auth/row-level-security
- Stripe Billing documentation: https://stripe.com/docs/billing
- Stripe Payment Intents: https://stripe.com/docs/payments/payment-intents
- Twilio SMS documentation: https://www.twilio.com/docs/sms
- Resend documentation: https://resend.com/docs
- React Email documentation: https://react.email/docs
- dnd-kit documentation: https://dndkit.com
- shadcn/ui documentation: https://ui.shadcn.com
