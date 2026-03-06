'use server'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { Stage } from '@/types/database'

type JobState = { error: string } | undefined

// Called server-side to generate signed upload URLs for each photo
// Returns one signed URL per file — client uploads directly to Supabase Storage
export async function getPhotoUploadUrls(
  jobId: string,
  fileNames: string[]
): Promise<{ signedUrls: { path: string; token: string; signedUrl: string }[]; error?: string }> {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  const userId = data?.claims?.sub ?? null
  if (!userId) return { signedUrls: [], error: 'Not authenticated' }

  const results = await Promise.all(
    fileNames.map(async (name) => {
      const safeName = name.replace(/[^a-zA-Z0-9._-]/g, '_')
      const path = `${userId}/${jobId}/${Date.now()}-${safeName}`
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: urlData, error } = await (supabase.storage as any)
        .from('job-photos')
        .createSignedUploadUrl(path)
      if (error) return null
      return { path, ...urlData } as { path: string; token: string; signedUrl: string }
    })
  )
  return { signedUrls: results.filter((r): r is { path: string; token: string; signedUrl: string } => r !== null) }
}

// Main job creation server action
// photoPaths is a JSON stringified string[] of already-uploaded storage paths
export async function createJob(_prevState: JobState, formData: FormData): Promise<JobState> {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  const userId = data?.claims?.sub ?? null
  if (!userId) redirect('/login')

  // Get atomic sequential job number
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: jobNum, error: seqError } = await (supabase as any).rpc('get_next_job_number', {
    p_shop_id: userId,
  }) as { data: number | null; error: { message: string } | null }
  if (seqError) return { error: 'Failed to assign job number: ' + seqError.message }

  // Get first stage for this shop (ordered by position) to place new job there
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: firstStage } = await (supabase.from('stages') as any)
    .select('id')
    .eq('shop_id', userId)
    .order('position', { ascending: true })
    .limit(1)
    .single() as { data: Pick<Stage, 'id'> | null }

  const photoPaths = (() => {
    try {
      return JSON.parse((formData.get('photo_paths') as string) || '[]') as string[]
    } catch {
      return [] as string[]
    }
  })()

  const animalType = formData.get('animal_type') as string
  const animalCustom = formData.get('animal_type_custom') as string
  const mountStyle = formData.get('mount_style') as string
  const mountCustom = formData.get('mount_style_custom') as string
  const referral = formData.get('referral_source') as string
  const referralCustom = formData.get('referral_source_custom') as string

  const jobData = {
    shop_id: userId,
    job_number: jobNum as number,
    stage_id: firstStage?.id ?? null,
    customer_name: ((formData.get('customer_name') as string) || '').trim(),
    customer_phone: (formData.get('customer_phone') as string) || null,
    customer_email: (formData.get('customer_email') as string) || null,
    animal_type: animalType === 'Other' ? (animalCustom || 'Other') : animalType,
    mount_style: mountStyle === 'Other' ? (mountCustom || 'Other') : mountStyle,
    quoted_price: parseFloat(formData.get('quoted_price') as string) || 0,
    deposit_amount: formData.get('deposit_amount') ? parseFloat(formData.get('deposit_amount') as string) : null,
    estimated_completion_date: formData.get('estimated_completion_date') as string,
    referral_source: referral === 'Other' ? (referralCustom || null) : (referral || null),
    is_rush: formData.get('is_rush') === 'true',
    social_media_consent: formData.get('social_media_consent') === 'true',
    photo_paths: photoPaths,
  }

  // Validate required fields
  if (!jobData.customer_name) return { error: 'Customer name is required' }
  if (!jobData.animal_type) return { error: 'Animal type is required' }
  if (!jobData.mount_style) return { error: 'Mount style is required' }
  if (!jobData.quoted_price || jobData.quoted_price <= 0) return { error: 'Quoted price must be a positive number' }
  if (!jobData.estimated_completion_date) return { error: 'Estimated completion date is required' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from('jobs') as any).insert(jobData) as { error: { message: string } | null }

  if (error) return { error: error.message }
}

// Rush toggle — called from Kanban card quick-toggle
export async function toggleJobRush(jobId: string, isRush: boolean): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  const userId = data?.claims?.sub ?? null
  if (!userId) return { error: 'Not authenticated' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from('jobs') as any)
    .update({ is_rush: isRush })
    .eq('id', jobId)
    .eq('shop_id', userId) as { error: { message: string } | null }

  if (error) return { error: error.message }
  return {}
}

// Stage update — called from Kanban drag-end
export async function updateJobStage(jobId: string, stageId: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  const userId = data?.claims?.sub ?? null
  if (!userId) return { error: 'Not authenticated' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from('jobs') as any)
    .update({ stage_id: stageId })
    .eq('id', jobId)
    .eq('shop_id', userId) as { error: { message: string } | null }

  if (error) return { error: error.message }
  return {}
}

// Bulk stage move — called from board bulk-select toolbar
export async function bulkMoveJobs(jobIds: string[], stageId: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  const userId = data?.claims?.sub ?? null
  if (!userId) return { error: 'Not authenticated' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from('jobs') as any)
    .update({ stage_id: stageId })
    .in('id', jobIds)
    .eq('shop_id', userId) as { error: { message: string } | null }

  if (error) return { error: error.message }
  return {}
}
