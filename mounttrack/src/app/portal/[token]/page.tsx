import { notFound } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/service'
import { StageTimeline } from '@/components/portal/stage-timeline'
import { PortalHeader } from '@/components/portal/portal-header'
import { PortalAutoRefresh } from '@/components/portal/portal-auto-refresh'
import type { Job, Shop, Stage } from '@/types/database'

type PortalJob = Omit<Job, 'is_overdue'> & { shops: Shop }

async function getSignedPhotoUrls(
  supabase: ReturnType<typeof createServiceClient>,
  photoPaths: string[]
): Promise<string[]> {
  if (!photoPaths.length) return []
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.storage as any)
    .from('job-photos')
    .createSignedUrls(photoPaths, 604800) as { data: { signedUrl: string }[] | null; error: unknown }
  if (error || !data) return []
  return data.map((item) => item.signedUrl)
}

export default async function PortalPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const supabase = createServiceClient()

  // Look up job by portal_token — service role bypasses RLS, no auth session needed
  // Return 404 for any failure — uniform response gives no oracle to attackers
  const { data: job } = await (supabase.from('jobs') as any)
    .select('*, shops(*)')
    .eq('portal_token', token)
    .single() as { data: PortalJob | null }

  if (!job) notFound()

  // Fetch all stages for this shop (ordered for timeline display)
  const { data: stages } = await (supabase.from('stages') as any)
    .select('id, name, position')
    .eq('shop_id', job.shop_id)
    .order('position', { ascending: true }) as { data: Stage[] | null }

  // Fetch photos grouped by stage from job_photos table
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: jobPhotos } = await (supabase.from('job_photos') as any)
    .select('id, stage_id, path')
    .eq('job_id', job.id)
    .order('uploaded_at', { ascending: true }) as { data: { id: string; stage_id: string | null; path: string }[] | null }

  // Batch-sign all photo paths in one request, then re-map back to stages
  const allPaths = (jobPhotos ?? []).map((p) => p.path)
  const allSignedUrls = await getSignedPhotoUrls(supabase, allPaths)

  // Build Record<stage_id, signedUrl[]> — photos with no stage go under '__no_stage__'
  const stagePhotos: Record<string, string[]> = {}
  ;(jobPhotos ?? []).forEach((photo, i) => {
    const key = photo.stage_id ?? '__no_stage__'
    if (!stagePhotos[key]) stagePhotos[key] = []
    stagePhotos[key].push(allSignedUrls[i])
  })

  const shop = job.shops

  // Format estimated completion date for display
  const formattedDate = job.estimated_completion_date
    ? new Date(job.estimated_completion_date + 'T00:00:00').toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : null

  return (
    <div
      className="min-h-screen bg-gray-50"
      style={{ '--brand': shop.brand_color } as React.CSSProperties}
    >
      <PortalAutoRefresh />
      <PortalHeader shop={shop} />

      <main className="mx-auto max-w-lg px-4 py-8 space-y-8">
        {/* Job identity */}
        <div>
          <p className="text-sm text-gray-500">Job #{job.job_number}</p>
          <h1 className="mt-1 text-xl font-bold text-gray-900">{job.customer_name}</h1>
          <p className="text-sm text-gray-600">{job.animal_type} — {job.mount_style}</p>
        </div>

        {/* Estimated completion */}
        {formattedDate && (
          <div className="rounded-lg border border-gray-200 bg-white px-4 py-3">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
              Estimated Completion
            </p>
            <p className="mt-1 text-base font-semibold text-gray-900">{formattedDate}</p>
          </div>
        )}

        {/* Stage timeline with per-stage photos */}
        <div className="rounded-lg border border-gray-200 bg-white px-4 py-4">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-400">
            Progress
          </h2>
          <StageTimeline
            stages={stages ?? []}
            currentStageId={job.stage_id}
            stagePhotos={stagePhotos}
          />
        </div>
      </main>

      {/* Minimal footer — shop name only, no MountTrack branding */}
      <footer className="mt-8 pb-8 text-center">
        <p className="text-xs text-gray-400">{shop.shop_name}</p>
      </footer>
    </div>
  )
}
