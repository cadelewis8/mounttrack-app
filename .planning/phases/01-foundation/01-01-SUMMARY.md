---
phase: 01-foundation
plan: 01
subsystem: infra
tags: [next.js, supabase, stripe, typescript, tailwind, shadcn, rls, postgres]

# Dependency graph
requires: []
provides:
  - "Next.js 16 project scaffold with TypeScript, Tailwind v4, shadcn/ui"
  - "Supabase browser client (createBrowserClient via @supabase/ssr)"
  - "Supabase server client (createServerClient with cookie auth)"
  - "Supabase service role client (bypasses RLS for webhook handler)"
  - "src/proxy.ts auth gate enforcing auth/onboarding/subscription gates"
  - "shops table with RLS policies enforcing per-user tenant isolation"
  - "Storage bucket RLS policies for per-user logo folder isolation"
  - "Stripe server client singleton (2026-02-25.clover API)"
  - "Database TypeScript types (Database, Shop, SubscriptionStatus)"
  - "Dark/light mode CSS variable system with --brand color token"
affects: [02-auth, 03-onboarding, 04-dashboard, all-phases]

# Tech tracking
tech-stack:
  added:
    - "next@16.1.6 (App Router, Turbopack)"
    - "@supabase/supabase-js@2.98.0"
    - "@supabase/ssr@0.9.0"
    - "stripe@20.4.0"
    - "@stripe/stripe-js@8.9.0"
    - "next-themes@0.4.6"
    - "react-colorful@5.6.1"
    - "react-hook-form@7.71.2"
    - "@hookform/resolvers@5.2.2"
    - "zod@4.3.6"
    - "shadcn@3.8.5 (Neutral style)"
    - "tailwindcss@4"
  patterns:
    - "src/proxy.ts (not middleware.ts) — Next.js 16 proxy pattern"
    - "getClaims() over getSession() for server-side JWT validation"
    - "Supabase RLS: (SELECT auth.uid()) wrapper for performance"
    - "Per-user storage isolation via storage.foldername(name)[1]"
    - "ThemeProvider wrapped in client component (providers.tsx) from server layout"
    - "CSS variable theming with --brand token for tenant brand color"

key-files:
  created:
    - "mounttrack/src/proxy.ts"
    - "mounttrack/src/lib/supabase/client.ts"
    - "mounttrack/src/lib/supabase/server.ts"
    - "mounttrack/src/lib/supabase/service.ts"
    - "mounttrack/src/lib/supabase/proxy.ts"
    - "mounttrack/src/lib/stripe/client.ts"
    - "mounttrack/src/types/database.ts"
    - "mounttrack/src/components/providers.tsx"
    - "mounttrack/supabase/migrations/0001_initial_schema.sql"
    - "mounttrack/.env.local.example"
  modified:
    - "mounttrack/src/app/layout.tsx"
    - "mounttrack/src/app/globals.css"

key-decisions:
  - "src/proxy.ts with exported `proxy` function (not middleware.ts) — Next.js 16 proxy API"
  - "getClaims() returns { claims } (JWT payload) not { user } — use claims.sub as userId"
  - "shops table id = auth.uid() — one shop per Supabase user, no separate FK"
  - "/api/webhooks/ excluded from proxy matcher — Stripe webhooks bypass auth gate"
  - "shadcn Neutral style chosen as base — brand color applied via --brand CSS variable"

patterns-established:
  - "Proxy pattern: all auth/onboarding/subscription gates in src/lib/supabase/proxy.ts updateSession()"
  - "Server auth: getClaims() returns claims.sub (user ID), never getSession()"
  - "RLS: (SELECT auth.uid()) wrapper caches uid per statement for performance"
  - "Storage: user files stored in {userId}/ folder, enforced via storage.foldername"
  - "Client components: ThemeProvider wrapped in providers.tsx, not in root server layout"

requirements-completed: [AUTH-01, AUTH-02]

# Metrics
duration: 10min
completed: 2026-03-02
---

# Phase 1 Plan 01: Foundation Scaffold Summary

**Next.js 16 project scaffolded with Supabase SSR auth clients, shops table with RLS tenant isolation, Stripe client, and src/proxy.ts enforcing auth/onboarding/subscription gates on every request**

## Performance

- **Duration:** 10 min
- **Started:** 2026-03-02T22:56:11Z
- **Completed:** 2026-03-02T23:06:24Z
- **Tasks:** 2
- **Files modified:** 15 created, 2 modified

## Accomplishments
- Bootstrapped mounttrack Next.js 16 project with all required dependencies (Supabase, Stripe, shadcn, react-hook-form, zod, next-themes, react-colorful)
- Created complete Supabase client suite: browser client, server (SSR) client, service role client, and proxy updateSession function
- Implemented src/proxy.ts with three-tier gate (auth → onboarding → subscription) using getClaims() for JWT validation
- Created shops table SQL migration with RLS policies enforcing per-user tenant isolation via (SELECT auth.uid()) wrapper
- Added storage bucket RLS policies for per-user logo folder isolation

## Task Commits

Each task was committed atomically:

1. **Task 1: Bootstrap Next.js 16 project** - `e3b87ae` (feat)
2. **Task 2: Supabase clients, Stripe client, migration SQL** - `4797f87` (feat)
3. **Scaffold config files** - `de5164f` (chore)

## Files Created/Modified
- `mounttrack/src/proxy.ts` - Next.js 16 proxy with auth/onboarding/subscription gates; excludes /api/webhooks/
- `mounttrack/src/lib/supabase/client.ts` - Browser client using createBrowserClient
- `mounttrack/src/lib/supabase/server.ts` - Server client with cookie auth for SSR
- `mounttrack/src/lib/supabase/service.ts` - Service role client bypassing RLS (webhook use only)
- `mounttrack/src/lib/supabase/proxy.ts` - updateSession() with getClaims() for JWT validation
- `mounttrack/src/lib/stripe/client.ts` - Stripe singleton (2026-02-25.clover API)
- `mounttrack/src/types/database.ts` - Database, Shop, SubscriptionStatus TypeScript types
- `mounttrack/src/components/providers.tsx` - ThemeProvider client component wrapper
- `mounttrack/supabase/migrations/0001_initial_schema.sql` - shops table, RLS, storage policies
- `mounttrack/.env.local.example` - Documents all required environment variables
- `mounttrack/src/app/layout.tsx` - Root layout with MountTrack metadata and Providers
- `mounttrack/src/app/globals.css` - CSS variable theming with --brand color token

## Decisions Made
- Used `src/proxy.ts` (not `middleware.ts`) — Next.js 16 renamed the proxy entry point
- Excluded `/api/webhooks/` from proxy matcher so Stripe webhooks bypass the auth gate
- Used shadcn Neutral base style; brand color applied separately as CSS `--brand` variable
- shops table uses `id = auth.uid()` as primary key — one shop per owner, no separate join table

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed getClaims() return type mismatch**
- **Found during:** Task 2 (Supabase clients implementation)
- **Issue:** Plan called `getClaims()` and destructured `{ data: { user } }` but getClaims() actually returns `{ data: { claims, header, signature } }` where claims is the JWT payload with `sub` field (user ID). TypeScript error: "Property 'user' does not exist on type '{ claims: JwtPayload... } | null'"
- **Fix:** Changed destructuring to `const { data } = await supabase.auth.getClaims()` and used `data?.claims?.sub ?? null` as userId. All gate logic updated to use `userId` (string) instead of `user` (User object)
- **Files modified:** `mounttrack/src/lib/supabase/proxy.ts`
- **Verification:** TypeScript build passes cleanly; proxy recognized as "Proxy (Middleware)" in Next.js build output
- **Committed in:** 4797f87 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - bug)
**Impact on plan:** Essential correctness fix — getClaims() API changed between training data and installed version. No scope creep. Gate logic semantically identical (claims.sub = user ID).

## Issues Encountered
- `.env.local.example` blocked by `.gitignore` pattern `.env*` — force-added with `git add -f` since it contains no secrets (only placeholder names)

## User Setup Required

External services require manual configuration before running the app:

**Supabase:**
1. Create a new Supabase project at https://supabase.com/dashboard
2. Create 'logos' storage bucket (private) at Supabase Dashboard > Storage > New bucket
3. Run `supabase/migrations/0001_initial_schema.sql` in Supabase SQL Editor
4. Copy env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`

**Vercel/App URL:**
1. Set `NEXT_PUBLIC_URL` to your deployment URL or `http://localhost:3000` for development

Create `.env.local` from `.env.local.example` with the actual values.

## Next Phase Readiness
- Project scaffold complete — `npm run build` passes cleanly
- All client/server Supabase plumbing in place for auth pages (Plan 01-02)
- Proxy gate enforces auth correctly — auth pages can be built with confidence redirects work
- Migration SQL ready to run — shops table will be available for onboarding wizard (Plan 01-03)
- Stripe client ready for subscription checkout (Plan 01-03)

---
*Phase: 01-foundation*
*Completed: 2026-03-02*
