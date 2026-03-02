'use server'
import { createClient } from '@/lib/supabase/server'
import type { Shop } from '@/types/database'
import { redirect } from 'next/navigation'

type ShopState = { error: string } | undefined

export async function saveShopSetup(_prevState: ShopState, formData: FormData): Promise<ShopState> {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  const userId = data?.claims?.sub ?? null
  if (!userId) redirect('/login')

  const shopName = (formData.get('shop_name') as string)?.trim()
  if (!shopName) {
    return { error: 'Shop name is required' }
  }

  const shopData: Partial<Shop> & { id: string; shop_name: string; onboarding_step: number } = {
    id: userId,
    shop_name: shopName,
    address: (formData.get('address') as string) || null,
    city: (formData.get('city') as string) || null,
    state: (formData.get('state') as string) || null,
    zip: (formData.get('zip') as string) || null,
    phone: (formData.get('phone') as string) || null,
    email: (formData.get('email') as string) || null,
    onboarding_step: 1,
  }

  // upsert: creates if not exists, updates if exists
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from('shops') as any).upsert(shopData, { onConflict: 'id' })

  if (error) return { error: error.message }

  redirect('/onboarding/step-2')
}
