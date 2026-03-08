import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { CalendarDays } from 'lucide-react'
import type { Job } from '@/types/database'

type JobWithStage = Job & { stages: { name: string } | null }

export default async function QueuePage() {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  const userId = data?.claims?.sub ?? null
  if (!userId) redirect('/login')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: jobs } = await ((supabase.from('jobs') as any)
    .select('id, job_number, customer_name, animal_type, mount_style, estimated_completion_date, stage_id, is_rush, stages(name)')
    .eq('shop_id', userId)
    .order('estimated_completion_date', { ascending: true }) as Promise<{ data: JobWithStage[] | null }>)

  const allJobs = jobs ?? []
  const todayStr = new Date().toISOString().slice(0, 10)

  // Compute overdue at app layer
  const jobsWithOverdue = allJobs.map(j => ({
    ...j,
    is_overdue: !!j.estimated_completion_date && j.estimated_completion_date < todayStr,
  }))

  // Per-stage counts
  const stageCounts = jobsWithOverdue.reduce<Record<string, number>>((acc, j) => {
    const name = j.stages?.name ?? 'No Stage'
    acc[name] = (acc[name] ?? 0) + 1
    return acc
  }, {})

  // Format date for display
  function fmtDate(iso: string) {
    const [y, m, d] = iso.split('-')
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
    return `${months[parseInt(m)-1]} ${parseInt(d)}, ${y}`
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold">Queue</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {allJobs.length} active job{allJobs.length !== 1 ? 's' : ''} ordered by estimated completion date
          </p>
        </div>

        {/* Stage counts summary */}
        {Object.keys(stageCounts).length > 0 && (
          <div className="flex flex-wrap gap-2">
            {Object.entries(stageCounts).map(([name, count]) => (
              <span key={name} className="text-xs px-2.5 py-1 rounded-full bg-muted text-muted-foreground font-medium">
                {name}: {count}
              </span>
            ))}
          </div>
        )}

        {/* Job list */}
        {jobsWithOverdue.length === 0 ? (
          <p className="text-muted-foreground text-sm">No active jobs.</p>
        ) : (
          <div className="divide-y rounded-xl border overflow-hidden bg-card">
            {jobsWithOverdue.map((job) => (
              <Link
                key={job.id}
                href={`/jobs/${job.id}`}
                className="flex items-center gap-4 px-4 py-3 hover:bg-muted/40 transition-colors"
              >
                {/* Job number */}
                <span className="text-sm font-mono text-muted-foreground w-12 shrink-0">
                  #{String(job.job_number).padStart(4, '0')}
                </span>

                {/* Customer + animal */}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{job.customer_name}</div>
                  <div className="text-xs text-muted-foreground truncate">{job.animal_type} — {job.mount_style}</div>
                </div>

                {/* Stage */}
                <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground shrink-0">
                  {job.stages?.name ?? 'No Stage'}
                </span>

                {/* Badges */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {job.is_rush && (
                    <span className="text-xs px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 font-medium">
                      Rush
                    </span>
                  )}
                  {job.is_overdue && (
                    <span className="text-xs px-1.5 py-0.5 rounded bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400 font-medium">
                      Overdue
                    </span>
                  )}
                </div>

                {/* Due date */}
                <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                  <CalendarDays className="h-3.5 w-3.5" />
                  {fmtDate(job.estimated_completion_date)}
                </div>
              </Link>
            ))}
          </div>
        )}

      </div>
    </div>
  )
}
