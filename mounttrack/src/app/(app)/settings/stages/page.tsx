import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SettingsTabs } from '@/components/settings-tabs'
import { StageManager } from '@/components/stage-manager'
import type { Stage } from '@/types/database'

const DEFAULT_STAGES = ['Skinning', 'Fleshing', 'Tanning', 'Mounting', 'Finishing', 'Ready for Pickup']

export default async function StagesSettingsPage() {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  const userId = data?.claims?.sub ?? null
  if (!userId) redirect('/login')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let { data: stages } = await (supabase.from('stages') as any)
    .select('*')
    .eq('shop_id', userId)
    .order('position', { ascending: true }) as { data: Stage[] | null }

  // Auto-seed default stages for new shops that have none yet
  if (!stages || stages.length === 0) {
    const rows = DEFAULT_STAGES.map((name, index) => ({ shop_id: userId, name, position: index }))
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('stages') as any).insert(rows)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: seeded } = await (supabase.from('stages') as any)
      .select('*')
      .eq('shop_id', userId)
      .order('position', { ascending: true }) as { data: Stage[] | null }
    stages = seeded
  }

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
