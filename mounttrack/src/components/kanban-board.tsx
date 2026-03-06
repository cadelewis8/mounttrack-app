'use client'
import {
  DndContext, DragOverlay, closestCenter,
  useSensor, useSensors, PointerSensor, KeyboardSensor,
  type DragStartEvent, type DragOverEvent, type DragEndEvent,
} from '@dnd-kit/core'
import { useState, useTransition } from 'react'
import { KanbanColumn } from './kanban-column'
import { JobCard } from './job-card'
import { updateJobStage, bulkMoveJobs } from '@/actions/jobs'
import type { Stage, Job } from '@/types/database'

interface KanbanBoardProps {
  stages: Stage[]
  initialJobsByStage: Record<string, Job[]>
}

function findStageForJob(jobId: string, jobsByStage: Record<string, Job[]>): string | undefined {
  for (const [stageId, jobs] of Object.entries(jobsByStage)) {
    if (jobs.some((j) => j.id === jobId)) return stageId
  }
  return undefined
}

function findJob(jobId: string, jobsByStage: Record<string, Job[]>): Job | undefined {
  for (const jobs of Object.values(jobsByStage)) {
    const found = jobs.find((j) => j.id === jobId)
    if (found) return found
  }
  return undefined
}

export function KanbanBoard({ stages, initialJobsByStage }: KanbanBoardProps) {
  const [jobsByStage, setJobsByStage] = useState(initialJobsByStage)
  const [activeJobId, setActiveJobId] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  // activationConstraint distance:5 prevents button clicks in cards from starting a drag
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  )

  function onDragStart({ active }: DragStartEvent) {
    setActiveJobId(active.id as string)
  }

  function onDragOver({ active, over }: DragOverEvent) {
    if (!over) return
    const fromStage = findStageForJob(active.id as string, jobsByStage)
    const overId = over.id as string
    // over.id could be a job id (card) or stage id (droppable zone)
    const toStage = findStageForJob(overId, jobsByStage) ?? overId
    if (!fromStage || fromStage === toStage) return

    setJobsByStage((prev) => {
      const job = findJob(active.id as string, prev)
      if (!job) return prev
      return {
        ...prev,
        [fromStage]: prev[fromStage].filter((j) => j.id !== job.id),
        [toStage]: [...(prev[toStage] ?? []), job],
      }
    })
  }

  function onDragEnd({ active, over }: DragEndEvent) {
    setActiveJobId(null)
    if (!over) return
    const overId = over.id as string
    const toStage = findStageForJob(overId, jobsByStage) ?? overId

    // Persist to DB in a transition — optimistic state already applied in onDragOver
    startTransition(async () => {
      await updateJobStage(active.id as string, toStage)
    })
  }

  const activeJob = activeJobId ? findJob(activeJobId, jobsByStage) : null

  // Bulk select state — lifted up for the toolbar
  const [selectedJobIds, setSelectedJobIds] = useState<Set<string>>(new Set())
  const [bulkTargetStageId, setBulkTargetStageId] = useState('')

  function toggleSelect(jobId: string) {
    setSelectedJobIds((prev) => {
      const next = new Set(prev)
      if (next.has(jobId)) next.delete(jobId)
      else next.add(jobId)
      return next
    })
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
    >
      <div className="flex flex-col h-full overflow-hidden">
        {/* Bulk move toolbar — visible when one or more cards are selected */}
        {selectedJobIds.size > 0 && (
          <div className="px-4 py-2 border-b flex items-center gap-3 bg-muted/30">
            <span className="text-sm text-muted-foreground">
              {selectedJobIds.size} job{selectedJobIds.size !== 1 ? 's' : ''} selected
            </span>
            <select
              value={bulkTargetStageId}
              onChange={(e) => setBulkTargetStageId(e.target.value)}
              className="text-sm border rounded px-2 py-1 bg-background"
            >
              <option value="">Move to stage...</option>
              {stages.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => {
                if (!bulkTargetStageId) return
                startTransition(async () => {
                  await bulkMoveJobs([...selectedJobIds], bulkTargetStageId)
                  setSelectedJobIds(new Set())
                  setBulkTargetStageId('')
                })
              }}
              disabled={!bulkTargetStageId}
              className="text-sm px-3 py-1 rounded bg-[var(--brand)] text-white hover:opacity-90 disabled:opacity-40 transition-opacity"
            >
              Move
            </button>
            <button
              type="button"
              onClick={() => setSelectedJobIds(new Set())}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Clear
            </button>
          </div>
        )}

        {/* Columns scroll area */}
        <div className="flex gap-4 overflow-x-auto h-full p-4 pb-0">
          {stages.map((stage) => (
            <KanbanColumn
              key={stage.id}
              stage={stage}
              jobs={jobsByStage[stage.id] ?? []}
              selectedJobIds={selectedJobIds}
              onToggleSelect={toggleSelect}
            />
          ))}
        </div>
      </div>

      <DragOverlay>
        {activeJob ? <JobCard job={activeJob} isOverlay /> : null}
      </DragOverlay>
    </DndContext>
  )
}
