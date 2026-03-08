import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { CalendarClient } from './calendar-client'
import type { Job } from '@/types/database'

export default async function CalendarPage() {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  const userId = data?.claims?.sub ?? null
  if (!userId) redirect('/login')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: jobs } = await ((supabase.from('jobs') as any)
    .select('id, job_number, customer_name, estimated_completion_date, is_rush')
    .eq('shop_id', userId)
    .order('estimated_completion_date', { ascending: true }) as Promise<{ data: Job[] | null }>)

  const allJobs = jobs ?? []
  const todayStr = new Date().toISOString().slice(0, 10)

  const jobsWithOverdue = allJobs.map(j => ({
    ...j,
    is_overdue: !!j.estimated_completion_date && j.estimated_completion_date < todayStr,
  }))

  return (
    <div className="h-full flex flex-col">
      <div className="px-6 py-4 border-b shrink-0">
        <h1 className="text-2xl font-semibold">Calendar</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {allJobs.length} job{allJobs.length !== 1 ? 's' : ''} — click any event to open the job
        </p>
      </div>
      <div className="flex-1 px-4 py-4 overflow-hidden">
        <CalendarClient jobs={jobsWithOverdue} />
      </div>
    </div>
  )
}
