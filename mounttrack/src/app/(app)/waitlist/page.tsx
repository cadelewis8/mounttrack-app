import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { WaitlistEntry } from '@/types/database'
import { WaitlistClient } from './waitlist-client'

export default async function WaitlistPage() {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  const userId = data?.claims?.sub ?? null
  if (!userId) redirect('/login')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: entries } = await (supabase.from('waitlist') as any)
    .select('*')
    .eq('shop_id', userId)
    .order('created_at', { ascending: true }) as { data: WaitlistEntry[] | null }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Waitlist</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Track customers waiting for an opening before their animal is ready for drop-off.
        </p>
      </div>
      <WaitlistClient initialEntries={entries ?? []} />
    </div>
  )
}
