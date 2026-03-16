'use server'
import { createClient } from '@/lib/supabase/server'
import { sendWaitlistSms } from '@/lib/notifications'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

type WaitlistState = { error: string } | { success: true } | undefined

export async function createWaitlistEntry(_prevState: WaitlistState, formData: FormData): Promise<WaitlistState> {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  const userId = data?.claims?.sub ?? null
  if (!userId) redirect('/login')

  const name = (formData.get('name') as string || '').trim()
  const phone = (formData.get('phone') as string || '').trim()
  const animalType = (formData.get('animal_type') as string || '').trim()

  if (!name) return { error: 'Name is required' }
  if (!phone) return { error: 'Phone number is required' }
  if (!animalType) return { error: 'Animal type is required' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from('waitlist') as any).insert({
    shop_id: userId,
    name,
    phone,
    animal_type: animalType,
  }) as { error: { message: string } | null }

  if (error) return { error: error.message }

  // Fetch shop branding for SMS
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: shop } = await (supabase.from('shops') as any)
    .select('shop_name')
    .eq('id', userId)
    .single() as { data: { shop_name: string } | null }

  try {
    await sendWaitlistSms({
      customerPhone: phone,
      shopName: shop?.shop_name ?? '',
      animalType,
      shopId: userId,
    })
  } catch (err) {
    console.error('[createWaitlistEntry] SMS error:', err)
  }

  revalidatePath('/waitlist')
  return { success: true }
}

export async function deleteWaitlistEntry(entryId: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  const userId = data?.claims?.sub ?? null
  if (!userId) return { error: 'Not authenticated' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from('waitlist') as any)
    .delete()
    .eq('id', entryId)
    .eq('shop_id', userId) as { error: { message: string } | null }

  if (error) return { error: error.message }
  revalidatePath('/waitlist')
  return {}
}
