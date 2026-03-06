import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SettingsTabs } from '@/components/settings-tabs'
import { StageManager } from '@/components/stage-manager'
import type { Stage } from '@/types/database'

export default async function StagesSettingsPage() {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  const userId = data?.claims?.sub ?? null
  if (!userId) redirect('/login')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: stages } = await (supabase.from('stages') as any)
    .select('*')
    .eq('shop_id', userId)
    .order('position', { ascending: true }) as { data: Stage[] | null }

  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-2xl font-semibold mb-6">Settings</h1>
      <SettingsTabs active="stages" />
      <div className="mt-6">
        <StageManager initialStages={stages ?? []} />
      </div>
    </div>
  )
}
