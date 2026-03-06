'use client'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useTransition } from 'react'
import { Zap } from 'lucide-react'
import { toggleJobRush } from '@/actions/jobs'
import type { Job } from '@/types/database'

interface JobCardProps {
  job: Job
  isOverlay?: boolean
  isSelected?: boolean
  onToggleSelect?: (jobId: string) => void
}

export function JobCard({ job, isOverlay, isSelected, onToggleSelect }: JobCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: job.id })

  const [, startTransition] = useTransition()

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0 : 1,  // Hide original while DragOverlay shows ghost
  }

  // Overdue takes priority over rush (red > orange)
  const borderClass = job.is_overdue
    ? 'border-l-4 border-l-red-500'
    : job.is_rush
    ? 'border-l-4 border-l-orange-500'
    : ''

  function handleRushToggle(e: React.MouseEvent) {
    e.stopPropagation()  // Prevent drag start
    startTransition(async () => {
      await toggleJobRush(job.id, !job.is_rush)
    })
  }

  const formattedDate = new Date(job.estimated_completion_date + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  const jobNumberFormatted = `#${String(job.job_number).padStart(4, '0')}`

  return (
    <div
      ref={setNodeRef}
      style={isOverlay ? {} : style}
      {...(isOverlay ? {} : { ...attributes, ...listeners })}
      className={`rounded-md bg-card border p-3 cursor-grab shadow-sm select-none
        ${borderClass}
        ${isSelected ? 'ring-2 ring-[var(--brand)]' : ''}
        ${isOverlay ? 'shadow-lg rotate-1 opacity-90' : ''}
      `}
    >
      {/* Primary line: customer — animal, mount */}
      <p className="text-sm font-medium leading-snug">
        {job.customer_name} — {job.animal_type}, {job.mount_style}
      </p>

      {/* Secondary line: date · job number */}
      <div className="flex items-center justify-between mt-1">
        <p className="text-xs text-muted-foreground">
          {formattedDate} · {jobNumberFormatted}
        </p>

        {/* Rush toggle button — activationConstraint distance:5 ensures this click works */}
        <button
          type="button"
          onClick={handleRushToggle}
          title={job.is_rush ? 'Remove rush flag' : 'Mark as rush'}
          className={`p-0.5 rounded transition-colors hover:bg-muted
            ${job.is_rush ? 'text-orange-500' : 'text-muted-foreground/40 hover:text-muted-foreground'}`}
        >
          <Zap className="h-3.5 w-3.5" fill={job.is_rush ? 'currentColor' : 'none'} />
        </button>
      </div>

      {/* Bulk select checkbox — shown when onToggleSelect is provided */}
      {onToggleSelect && (
        <div className="mt-2 -mb-1">
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
