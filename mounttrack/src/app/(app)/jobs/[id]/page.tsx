import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { JobDetailClient } from './job-detail-client'
import type { Job, Stage } from '@/types/database'

export default async function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  const userId = data?.claims?.sub ?? null
  if (!userId) redirect('/login')

  const [jobRes, stagesRes] = await Promise.all([
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase.from('jobs') as any)
      .select('*')
      .eq('id', id)
      .eq('shop_id', userId)
      .single() as Promise<{ data: Job | null }>,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase.from('stages') as any)
      .select('id, name, position')
      .eq('shop_id', userId)
      .order('position', { ascending: true }) as Promise<{ data: Stage[] | null }>,
  ])

  if (!jobRes.data) notFound()

  const job = jobRes.data
  const stages = stagesRes.data ?? []
  const todayStr = new Date().toISOString().slice(0, 10)
  const isOverdue = !!job.estimated_completion_date && job.estimated_completion_date < todayStr

  // Generate signed photo URLs (1 hour expiry)
  let photoUrls: { path: string; url: string }[] = []
  if (job.photo_paths?.length) {
    const results = await Promise.all(
      job.photo_paths.map(async (path: string) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: urlData } = await (supabase.storage as any)
          .from('job-photos')
          .createSignedUrl(path, 3600)
        return urlData?.signedUrl ? { path, url: urlData.signedUrl as string } : null
      })
    )
    photoUrls = results.filter((r): r is { path: string; url: string } => r !== null)
  }

  // Fetch Stripe payments for this job (owner view)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: jobPayments } = await (supabase.from('payments') as any)
    .select('amount_cents, paid_at')
    .eq('job_id', job.id)
    .order('paid_at', { ascending: true }) as { data: { amount_cents: number; paid_at: string }[] | null }

  return (
    <JobDetailClient
      job={{ ...job, is_overdue: isOverdue }}
      stages={stages}
      photoUrls={photoUrls}
      jobPayments={jobPayments ?? []}
    />
  )
}
