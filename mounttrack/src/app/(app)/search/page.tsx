import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Search as SearchIcon, CalendarDays, Zap } from 'lucide-react'
import type { Job, Stage } from '@/types/database'

type JobWithStage = Job & { stages: { name: string } | null }

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string
    stage?: string
    rush?: string
    overdue?: string
    from?: string
    to?: string
  }>
}) {
  const params = await searchParams
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  const userId = data?.claims?.sub ?? null
  if (!userId) redirect('/login')

  // Fetch all stages for the filter dropdown
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: stages } = await ((supabase.from('stages') as any)
    .select('id, name, position')
    .eq('shop_id', userId)
    .order('position', { ascending: true })
  ) as { data: Stage[] | null }

  const allStages = stages ?? []

  // Only run a search if at least one filter/query is active
  const hasQuery = !!(params.q || params.stage || params.rush || params.overdue || params.from || params.to)
  let jobs: JobWithStage[] = []

  if (hasQuery) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query = (supabase.from('jobs') as any)
      .select('id, job_number, customer_name, animal_type, mount_style, estimated_completion_date, stage_id, is_rush, created_at, stages(name)')
      .eq('shop_id', userId)
      .order('created_at', { ascending: false })

    // Text search — OR across customer_name, animal_type; job_number uses eq (numeric column)
    if (params.q) {
      const term = `%${params.q}%`
      const jobNum = parseInt(params.q, 10)
      if (!isNaN(jobNum)) {
        query = query.or(`customer_name.ilike.${term},animal_type.ilike.${term},job_number.eq.${jobNum}`)
      } else {
        query = query.or(`customer_name.ilike.${term},animal_type.ilike.${term}`)
      }
    }

    // Stage filter
    if (params.stage) query = query.eq('stage_id', params.stage)

    // Rush filter
    if (params.rush === 'true') query = query.eq('is_rush', true)

    // Overdue filter — estimated_completion_date < today
    if (params.overdue === 'true') {
      const today = new Date().toISOString().slice(0, 10)
      query = query.lt('estimated_completion_date', today)
    }

    // Date range filter on estimated_completion_date
    if (params.from) query = query.gte('estimated_completion_date', params.from)
    if (params.to) query = query.lte('estimated_completion_date', params.to)

    const { data: results } = await query as { data: JobWithStage[] | null }
    jobs = results ?? []
  }

  // Compute overdue at app layer for display
  const todayStr = new Date().toISOString().slice(0, 10)
  const jobsWithOverdue = jobs.map(j => ({
    ...j,
    is_overdue: !!j.estimated_completion_date && j.estimated_completion_date < todayStr,
  }))

  function fmtDate(iso: string) {
    const [y, m, d] = iso.split('-')
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
    return `${months[parseInt(m)-1]} ${parseInt(d)}, ${y}`
  }

  const inputCls = 'h-9 rounded-md border bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--brand)]'
  const selectCls = 'h-9 rounded-md border bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--brand)]'

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold">Search Jobs</h1>
          <p className="text-sm text-muted-foreground mt-1">Search all jobs — active and past</p>
        </div>

        {/* Search form — GET method preserves URL params */}
        <form method="GET" className="space-y-4">

          {/* Text query */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <input
                name="q"
                type="text"
                defaultValue={params.q ?? ''}
                placeholder="Customer name, animal type, or job #..."
                className={`${inputCls} w-full pl-9`}
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 rounded-md bg-[var(--brand)] text-white text-sm font-medium hover:opacity-90 transition-opacity"
            >
              Search
            </button>
          </div>

          {/* Filters row */}
          <div className="flex flex-wrap gap-3 items-end">

            {/* Stage filter */}
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground">Stage</label>
              <select name="stage" defaultValue={params.stage ?? ''} className={selectCls}>
                <option value="">All stages</option>
                {allStages.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            {/* Rush filter */}
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground">Rush</label>
              <select name="rush" defaultValue={params.rush ?? ''} className={selectCls}>
                <option value="">Any</option>
                <option value="true">Rush only</option>
              </select>
            </div>

            {/* Overdue filter */}
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground">Overdue</label>
              <select name="overdue" defaultValue={params.overdue ?? ''} className={selectCls}>
                <option value="">Any</option>
                <option value="true">Overdue only</option>
              </select>
            </div>

            {/* Date range */}
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground">Due from</label>
              <input name="from" type="date" defaultValue={params.from ?? ''} className={inputCls} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground">Due to</label>
              <input name="to" type="date" defaultValue={params.to ?? ''} className={inputCls} />
            </div>

            {/* Clear filters */}
            {hasQuery && (
              <Link
                href="/search"
                className="h-9 flex items-center px-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Clear
              </Link>
            )}

          </div>
        </form>

        {/* Results */}
        {hasQuery && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {jobsWithOverdue.length} result{jobsWithOverdue.length !== 1 ? 's' : ''}
            </p>

            {jobsWithOverdue.length === 0 ? (
              <p className="text-muted-foreground text-sm">No jobs match your search.</p>
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
                      <div className="text-xs text-muted-foreground truncate">
                        {job.animal_type} — {job.mount_style}
                      </div>
                    </div>

                    {/* Stage */}
                    <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground shrink-0">
                      {job.stages?.name ?? 'No Stage'}
                    </span>

                    {/* Badges */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      {job.is_rush && (
                        <span className="flex items-center gap-0.5 text-xs px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 font-medium">
                          <Zap className="h-3 w-3" />
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
        )}

        {/* Empty state — no search submitted yet */}
        {!hasQuery && (
          <div className="text-center py-12 text-muted-foreground text-sm">
            Enter a search term or apply filters above to find jobs.
          </div>
        )}

      </div>
    </div>
  )
}
