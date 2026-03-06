'use client'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useDroppable } from '@dnd-kit/core'
import { JobCard } from './job-card'
import type { Stage, Job } from '@/types/database'

interface KanbanColumnProps {
  stage: Stage
  jobs: Job[]
  selectedJobIds: Set<string>
  onToggleSelect: (jobId: string) => void
  onDelete: (jobId: string) => void
}

export function KanbanColumn({ stage, jobs, selectedJobIds, onToggleSelect, onDelete }: KanbanColumnProps) {
  // useDroppable makes this column a valid drop zone even when SortableContext items is empty
  // Without this, empty columns cannot receive dropped cards (see research pitfall #2)
  const { setNodeRef } = useDroppable({ id: stage.id })

  return (
    <div className="flex flex-col min-h-0 bg-muted/40 rounded-xl shadow-sm overflow-hidden border border-border/40">
      {/* Column header */}
      <div className="px-3 py-2.5 border-b border-border/50 bg-muted/60 shrink-0">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold truncate">{stage.name}</span>
          <span className="text-xs font-medium text-muted-foreground bg-background/60 rounded-full px-2 py-0.5 ml-2 shrink-0">
            {jobs.length}
          </span>
        </div>
      </div>

      {/* Cards area — scrolls vertically when there are many jobs */}
      <div ref={setNodeRef} className="flex-1 overflow-y-auto p-2 space-y-2 min-h-0">
        <SortableContext items={jobs.map((j) => j.id)} strategy={verticalListSortingStrategy}>
          {jobs.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              isSelected={selectedJobIds.has(job.id)}
              onToggleSelect={onToggleSelect}
              onDelete={onDelete}
            />
          ))}
        </SortableContext>

        {jobs.length === 0 && (
          <div className="flex items-center justify-center h-full min-h-[60px]">
            <p className="text-xs text-muted-foreground/60">Empty</p>
          </div>
        )}
      </div>
    </div>
  )
}
