'use client'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useState, useTransition } from 'react'
import { Zap, Trash2, ExternalLink } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toggleJobRush, deleteJob } from '@/actions/jobs'
import type { Job } from '@/types/database'

interface JobCardProps {
  job: Job
  isOverlay?: boolean
  isSelected?: boolean
  onToggleSelect?: (jobId: string) => void
  onDelete?: (jobId: string) => void
}

export function JobCard({ job, isOverlay, isSelected, onToggleSelect, onDelete }: JobCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: job.id })

  const router = useRouter()
  const [isRush, setIsRush] = useState(job.is_rush)
  const [, startTransition] = useTransition()

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0 : 1,  // Hide original while DragOverlay shows ghost
  }

  const accentColor = job.is_overdue && isRush
    ? 'linear-gradient(to bottom, #dc2626 50%, #fbbf24 50%)'
    : job.is_overdue
    ? '#dc2626'
    : isRush
    ? '#fbbf24'
    : null

  function handleRushToggle(e: React.MouseEvent) {
    e.stopPropagation()
    const next = !isRush
    setIsRush(next)
    startTransition(async () => {
      await toggleJobRush(job.id, next)
    })
  }

  function handleDelete(e: React.MouseEvent) {
    e.stopPropagation()
    if (!confirm(`Delete job #${String(job.job_number).padStart(4, '0')} for ${job.customer_name}?`)) return
    onDelete?.(job.id)
    startTransition(async () => {
      await deleteJob(job.id)
    })
  }

  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  const [y, m, d] = job.estimated_completion_date.split('-')
  const formattedDate = `${MONTHS[parseInt(m) - 1]} ${parseInt(d)}, ${y}`

  const jobNumberFormatted = `#${String(job.job_number).padStart(4, '0')}`

  return (
    <div
      ref={setNodeRef}
      style={isOverlay ? {} : style}
      {...(isOverlay ? {} : { ...attributes, ...listeners })}
      suppressHydrationWarning
      className={`relative overflow-hidden rounded-md bg-card border p-3 cursor-grab shadow-sm select-none
        ${isSelected ? 'ring-2 ring-[var(--brand)]' : ''}
        ${isOverlay ? 'shadow-lg rotate-1 opacity-90' : ''}
      `}
    >
      {accentColor && (
        <div
          className="absolute left-0 inset-y-0 w-1"
          style={{ background: accentColor }}
        />
      )}
      {/* Primary line: customer — animal, mount */}
      <p className={`text-sm font-medium leading-snug ${accentColor ? 'pl-2' : ''}`}>
        {job.customer_name} — {job.animal_type}, {job.mount_style}
      </p>

      {/* Secondary line: date · job number */}
      <div className={`flex items-center justify-between mt-1 ${accentColor ? 'pl-2' : ''}`}>
        <p className="text-xs text-muted-foreground">
          {formattedDate} · {jobNumberFormatted}
        </p>

        <div className="flex items-center gap-0.5">
          {/* Open detail page */}
          {!isOverlay && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); router.push(`/jobs/${job.id}`) }}
              title="Open job"
              className="p-0.5 rounded transition-colors text-muted-foreground/40 hover:text-foreground hover:bg-muted"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </button>
          )}

          {/* Rush toggle */}
          <button
            type="button"
            onClick={handleRushToggle}
            title={isRush ? 'Remove rush flag' : 'Mark as rush'}
            className={`p-0.5 rounded transition-colors hover:bg-muted
              ${isRush ? 'text-amber-400' : 'text-muted-foreground/40 hover:text-muted-foreground'}`}
          >
            <Zap className="h-3.5 w-3.5" fill={isRush ? 'currentColor' : 'none'} />
          </button>

          {/* Delete */}
          {!isOverlay && (
            <button
              type="button"
              onClick={handleDelete}
              title="Delete job"
              className="p-0.5 rounded transition-colors text-muted-foreground/40 hover:text-red-500 hover:bg-muted"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Bulk select checkbox — shown when onToggleSelect is provided */}
      {onToggleSelect && (
        <div className={`mt-2 -mb-1 ${accentColor ? 'pl-2' : ''}`}>
          <input
            type="checkbox"
            checked={isSelected ?? false}
            onChange={() => onToggleSelect(job.id)}
            className="h-3 w-3 accent-[var(--brand)]"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  )
}
