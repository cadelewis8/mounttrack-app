import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SettingsTabs } from '@/components/settings-tabs'
import { ShopSettingsForm } from '@/components/shop-settings-form'
import type { Shop } from '@/types/database'

export default async function SettingsShopPage() {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  const userId = data?.claims?.sub ?? null
  if (!userId) redirect('/login')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: shop } = await (supabase.from('shops') as any)
    .select('shop_name, address, city, state, zip, phone, email')
    .eq('id', userId)
    .single() as { data: Pick<Shop, 'shop_name' | 'address' | 'city' | 'state' | 'zip' | 'phone' | 'email'> | null }

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>
      <SettingsTabs active="shop" />

      <ShopSettingsForm
        shopName={shop?.shop_name ?? ''}
        address={shop?.address ?? ''}
        city={shop?.city ?? ''}
        state={shop?.state ?? ''}
        zip={shop?.zip ?? ''}
        phone={shop?.phone ?? ''}
        email={shop?.email ?? ''}
      />
    </div>
  )
}
