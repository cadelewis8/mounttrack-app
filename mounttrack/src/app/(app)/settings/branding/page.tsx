// Server Component — fetches shop data
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { LogoUpload } from '@/components/logo-upload'
import { SettingsTabs } from '@/components/settings-tabs'
import { BrandingForm } from '@/components/branding-form'
import type { Shop } from '@/types/database'

export default async function SettingsBrandingPage() {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  const userId = data?.claims?.sub ?? null
  if (!userId) redirect('/login')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: shop } = await (supabase.from('shops') as any)
    .select('shop_name, logo_url, brand_color')
    .eq('id', userId)
    .single() as { data: Pick<Shop, 'shop_name' | 'logo_url' | 'brand_color'> | null }

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>
      <SettingsTabs active="branding" />

      <div className="mt-6 space-y-10">
        {/* Logo section */}
        <div>
          <h2 className="text-base font-semibold mb-1">Shop logo</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Shown in the sidebar and in all customer communications. Displayed square-cropped.
          </p>
          <LogoUpload
            currentLogoUrl={shop?.logo_url ?? null}
            shopName={shop?.shop_name ?? ''}
          />
        </div>

        {/* Brand color section */}
        <div>
          <h2 className="text-base font-semibold mb-1">Brand color</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Applied as the accent color throughout your dashboard and the customer portal.
          </p>
          <BrandingForm currentColor={shop?.brand_color ?? '#6d28d9'} />
        </div>
      </div>
    </div>
  )
}
