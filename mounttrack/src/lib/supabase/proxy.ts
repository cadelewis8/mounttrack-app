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

  // IMPORTANT: Always use getClaims() in server code — validates JWT signature.
  // Never use getSession() in server code — does not revalidate the token.
  // getClaims() returns { claims } (JWT payload) where claims.sub = user ID.
  const { data } = await supabase.auth.getClaims()
  const userId = data?.claims?.sub ?? null

  const pathname = request.nextUrl.pathname

  // Unauthenticated user — redirect to login (except auth routes)
  const isAuthRoute = pathname.startsWith('/login') ||
    pathname.startsWith('/signup') ||
    pathname.startsWith('/forgot-password') ||
    pathname.startsWith('/update-password') ||
    pathname.startsWith('/auth/')

  // Public routes: no login required, authenticated users pass through unchanged
  const isPublicRoute = pathname.startsWith('/portal/') ||
    pathname.startsWith('/api/create-payment-session')

  if (!userId) {
    if (!isAuthRoute && !isPublicRoute) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }
    return supabaseResponse
  }

  // Authenticated user on auth page — redirect to dashboard
  if (userId && isAuthRoute && !pathname.startsWith('/auth/')) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Fetch shop to check onboarding + subscription state
  // Use the same client (anon key) — RLS allows user to read their own shop
  const { data: shop } = await supabase
    .from('shops')
    .select('onboarding_step, subscription_status')
    .eq('id', userId)
    .single()

  const isDashboardRoute = pathname.startsWith('/dashboard') || pathname.startsWith('/settings')
  const isOnboardingRoute = pathname.startsWith('/onboarding')

  if (!shop) {
    // No shop record yet — redirect to onboarding step 1
    if (!isOnboardingRoute) {
      return NextResponse.redirect(new URL('/onboarding/step-1', request.url))
    }
  } else if (shop.onboarding_step < 2) {
    // Wizard incomplete — redirect to the correct step
    const step = shop.onboarding_step === 0 ? 'step-1' : 'step-2'
    if (!isOnboardingRoute) {
      return NextResponse.redirect(new URL(`/onboarding/${step}`, request.url))
    }
  } else if (shop.subscription_status !== 'active') {
    // Subscription lapsed — block dashboard; allow settings/subscription
    if (isDashboardRoute && !pathname.startsWith('/settings/subscription')) {
      return NextResponse.redirect(new URL('/settings/subscription', request.url))
    }
  }

  return supabaseResponse
}
