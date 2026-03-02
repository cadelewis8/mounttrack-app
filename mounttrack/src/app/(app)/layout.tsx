import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ThemeToggle } from '@/components/theme-toggle'
import { signOut } from '@/actions/auth'
import Image from 'next/image'
import Link from 'next/link'
import type { Shop } from '@/types/database'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  const userId = data?.claims?.sub ?? null
  if (!userId) redirect('/login')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: shop } = await (supabase.from('shops') as any)
    .select('shop_name, logo_url, brand_color, subscription_status')
    .eq('id', userId)
    .single() as { data: Pick<Shop, 'shop_name' | 'logo_url' | 'brand_color' | 'subscription_status'> | null }

  if (!shop) redirect('/onboarding/step-1')

  return (
    <div
      className="flex h-screen bg-background"
      style={{ '--brand': shop.brand_color } as React.CSSProperties}
    >
      {/* Sidebar */}
      <aside className="w-60 border-r flex flex-col">
        {/* Logo / Shop Name */}
        <div className="p-4 border-b">
          {shop.logo_url ? (
            <div className="flex items-center gap-3">
              <Image
                src={shop.logo_url}
                alt={`${shop.shop_name} logo`}
                width={36}
                height={36}
                className="rounded object-cover"
              />
              <span className="font-semibold text-sm truncate">{shop.shop_name}</span>
            </div>
          ) : (
            <span className="font-semibold text-sm truncate block">{shop.shop_name}</span>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 px-3 py-2 rounded-md text-sm hover:bg-muted transition-colors"
          >
            Dashboard
          </Link>
          <Link
            href="/settings/shop"
            className="flex items-center gap-2 px-3 py-2 rounded-md text-sm hover:bg-muted transition-colors"
          >
            Settings
          </Link>
        </nav>

        {/* Footer */}
        <div className="p-3 border-t flex items-center justify-between">
          <ThemeToggle />
          <form action={signOut}>
            <button type="submit" className="text-xs text-muted-foreground hover:text-foreground">
              Sign out
            </button>
          </form>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}
