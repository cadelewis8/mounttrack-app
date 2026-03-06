import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { KanbanBoard } from '@/components/kanban-board'
import type { Stage, Job } from '@/types/database'

export default async function BoardPage() {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  const userId = data?.claims?.sub ?? null
  if (!userId) redirect('/login')

  // Stages ordered by position
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: stages } = await (supabase.from('stages') as any)
    .select('id, name, position')
    .eq('shop_id', userId)
    .order('position', { ascending: true }) as { data: Stage[] | null }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: jobs } = await (supabase.from('jobs') as any)
    .select('id, job_number, stage_id, customer_name, animal_type, mount_style, estimated_completion_date, is_rush')
    .eq('shop_id', userId)
    .order('created_at', { ascending: true }) as { data: Job[] | null }

  const stageList = stages ?? []
  // Compute is_overdue server-side (server clock, same authority as SQL now())
  const todayStr = new Date().toISOString().slice(0, 10)
  const jobList = (jobs ?? []).map(job => ({
    ...job,
    is_overdue: !!job.estimated_completion_date && job.estimated_completion_date < todayStr,
  }))

  // Group jobs by stage_id -> Record<stageId, Job[]>
  const jobsByStage: Record<string, Job[]> = {}
  for (const stage of stageList) {
    jobsByStage[stage.id] = []
  }
  for (const job of jobList) {
    if (job.stage_id && jobsByStage[job.stage_id]) {
      jobsByStage[job.stage_id].push(job)
    }
  }

  return (
    <div className="h-full flex flex-col">
      <div className="px-6 py-4 border-b flex items-center justify-between">
        <h1 className="text-xl font-semibold">Board</h1>
      </div>
      <div className="flex-1 overflow-hidden">
        {stageList.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <p>No stages configured. Add stages in Settings &gt; Stages.</p>
          </div>
        ) : (
          <KanbanBoard stages={stageList} initialJobsByStage={jobsByStage} />
        )}
      </div>
    </div>
  )
}
