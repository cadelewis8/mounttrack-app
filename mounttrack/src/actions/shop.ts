'use server'
import { createClient } from '@/lib/supabase/server'
import type { Shop } from '@/types/database'
import { redirect } from 'next/navigation'

type ShopState = { error: string } | undefined

export async function updateShopDetails(_prevState: ShopState, formData: FormData): Promise<ShopState> {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  const userId = data?.claims?.sub ?? null
  if (!userId) redirect('/login')

  const shopName = (formData.get('shop_name') as string)?.trim()
  if (!shopName) return { error: 'Shop name is required' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from('shops') as any).update({
    shop_name: shopName,
    address: (formData.get('address') as string) || null,
    city: (formData.get('city') as string) || null,
    state: (formData.get('state') as string) || null,
    zip: (formData.get('zip') as string) || null,
    phone: (formData.get('phone') as string) || null,
    email: (formData.get('email') as string) || null,
  }).eq('id', userId)

  if (error) return { error: error.message }

  redirect('/settings/shop?saved=true')
}

export async function updateBrandColor(_prevState: ShopState, formData: FormData): Promise<ShopState> {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  const userId = data?.claims?.sub ?? null
  if (!userId) redirect('/login')

  const brandColor = formData.get('brand_color') as string
  // Basic hex validation
  if (!/^#[0-9A-Fa-f]{6}$/.test(brandColor)) {
    return { error: 'Invalid color format — must be a hex color like #6d28d9' }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from('shops') as any)
    .update({ brand_color: brandColor })
    .eq('id', userId)

  if (error) return { error: error.message }

  redirect('/settings/branding?saved=true')
}

export async function uploadLogo(
  _prevState: ShopState,
  formData: FormData
): Promise<ShopState> {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  const userId = data?.claims?.sub ?? null
  if (!userId) throw new Error('Not authenticated')

  const file = formData.get('logo') as File
  if (!file || file.size === 0) return { error: 'No file selected' }

  if (file.size > 2 * 1024 * 1024) return { error: 'File must be under 2MB' }

  const allowed = ['image/png', 'image/jpeg', 'image/svg+xml']
  if (!allowed.includes(file.type)) return { error: 'Only PNG, JPG, and SVG files are allowed' }

  const ext = file.type === 'image/svg+xml' ? 'svg' : file.type === 'image/png' ? 'png' : 'jpg'
  const path = `${userId}/logo.${ext}`

  const { error: uploadError } = await supabase.storage
    .from('logos')
    .upload(path, file, { upsert: true })

  if (uploadError) return { error: uploadError.message }

  const { data: { publicUrl } } = supabase.storage.from('logos').getPublicUrl(path)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: updateError } = await (supabase.from('shops') as any)
    .update({ logo_url: publicUrl } as Partial<Shop>)
    .eq('id', userId)

  if (updateError) return { error: updateError.message }

  redirect('/settings/branding?saved=true')
}

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
