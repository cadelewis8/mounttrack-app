'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import type { Stage } from '@/types/database'

type StageState = { error: string } | undefined

// Create a new stage — appended at the end (highest position + 1)
export async function createStage(_prevState: StageState, formData: FormData): Promise<StageState> {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  const userId = data?.claims?.sub ?? null
  if (!userId) redirect('/login')

  const name = (formData.get('name') as string)?.trim()
  if (!name) return { error: 'Stage name is required' }
  if (name.length > 50) return { error: 'Stage name must be 50 characters or less' }

  // Find current max position
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existing } = await (supabase.from('stages') as any)
    .select('position')
    .eq('shop_id', userId)
    .order('position', { ascending: false })
    .limit(1)
    .single() as { data: Pick<Stage, 'position'> | null }

  const nextPosition = existing ? existing.position + 1 : 0

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from('stages') as any)
    .insert({ shop_id: userId, name, position: nextPosition }) as { error: { message: string } | null }

  if (error) return { error: error.message }

  revalidatePath('/settings/stages')
  revalidatePath('/board')
}

// Rename an existing stage
export async function updateStage(_prevState: StageState, formData: FormData): Promise<StageState> {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  const userId = data?.claims?.sub ?? null
  if (!userId) redirect('/login')

  const stageId = formData.get('stage_id') as string
  const name = (formData.get('name') as string)?.trim()
  if (!stageId) return { error: 'Stage ID is required' }
  if (!name) return { error: 'Stage name cannot be empty' }
  if (name.length > 50) return { error: 'Stage name must be 50 characters or less' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from('stages') as any)
    .update({ name })
    .eq('id', stageId)
    .eq('shop_id', userId) as { error: { message: string } | null }

  if (error) return { error: error.message }

  revalidatePath('/settings/stages')
  revalidatePath('/board')
}

// Delete a stage — blocked if any jobs are in that stage, or if it's the last stage
export async function deleteStage(stageId: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  const userId = data?.claims?.sub ?? null
  if (!userId) return { error: 'Not authenticated' }

  // Check this is not the last stage
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { count: stageCount } = await (supabase.from('stages') as any)
    .select('id', { count: 'exact', head: true })
    .eq('shop_id', userId) as { count: number | null }

  if ((stageCount ?? 0) <= 1) {
    return { error: 'Cannot delete the last stage' }
  }

  // Check no jobs exist in this stage
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { count: jobCount } = await (supabase.from('jobs') as any)
    .select('id', { count: 'exact', head: true })
    .eq('stage_id', stageId)
    .eq('shop_id', userId) as { count: number | null }

  if ((jobCount ?? 0) > 0) {
    return { error: 'Move all jobs out of this stage first' }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from('stages') as any)
    .delete()
    .eq('id', stageId)
    .eq('shop_id', userId) as { error: { message: string } | null }

  if (error) return { error: error.message }

  revalidatePath('/settings/stages')
  revalidatePath('/board')
  return {}
}

// Reorder stages after drag-and-drop
// orderedIds is the new order of all stage IDs from top to bottom
export async function reorderStages(orderedIds: string[]): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  const userId = data?.claims?.sub ?? null
  if (!userId) return { error: 'Not authenticated' }

  // Update position for each stage in the new order
  const updates = orderedIds.map((id, index) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase.from('stages') as any)
      .update({ position: index })
      .eq('id', id)
      .eq('shop_id', userId)
  )

  const results = await Promise.all(updates)
  const firstError = results.find((r) => r.error)?.error
  if (firstError) return { error: firstError.message }

  revalidatePath('/settings/stages')
  revalidatePath('/board')
  return {}
}

const DEFAULT_STAGES = ['Skinning', 'Fleshing', 'Tanning', 'Mounting', 'Finishing', 'Ready for Pickup']

export async function seedDefaultStages(): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  const userId = data?.claims?.sub ?? null
  if (!userId) return { error: 'Not authenticated' }

  const rows = DEFAULT_STAGES.map((name, index) => ({ shop_id: userId, name, position: index }))
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from('stages') as any).insert(rows) as { error: { message: string } | null }

  if (error) return { error: error.message }

  revalidatePath('/settings/stages')
  revalidatePath('/board')
  return {}
}
