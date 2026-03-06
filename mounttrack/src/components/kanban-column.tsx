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
}

export function KanbanColumn({ stage, jobs, selectedJobIds, onToggleSelect }: KanbanColumnProps) {
  // useDroppable makes this column a valid drop zone even when SortableContext items is empty
  // Without this, empty columns cannot receive dropped cards (see research pitfall #2)
  const { setNodeRef } = useDroppable({ id: stage.id })

  return (
    <div className="flex flex-col w-64 shrink-0 bg-muted/40 rounded-lg">
      {/* Column header with stage name + job count */}
      <div className="px-3 py-2 border-b border-border/50">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium truncate">{stage.name}</span>
          <span className="text-xs text-muted-foreground ml-2 shrink-0">
            {jobs.length}
          </span>
        </div>
      </div>

      {/* Cards area — scroll vertically when many jobs */}
      <div ref={setNodeRef} className="flex-1 overflow-y-auto p-2 space-y-2 min-h-[80px]">
        <SortableContext items={jobs.map((j) => j.id)} strategy={verticalListSortingStrategy}>
          {jobs.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              isSelected={selectedJobIds.has(job.id)}
              onToggleSelect={onToggleSelect}
            />
          ))}
        </SortableContext>

        {jobs.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-4">No jobs</p>
        )}
      </div>
    </div>
  )
}
