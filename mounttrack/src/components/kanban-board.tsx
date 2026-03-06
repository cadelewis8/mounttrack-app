'use client'
import {
  DndContext, DragOverlay, closestCenter,
  useSensor, useSensors, PointerSensor, KeyboardSensor,
  type DragStartEvent, type DragOverEvent, type DragEndEvent,
} from '@dnd-kit/core'
import { useState, useTransition } from 'react'
import { KanbanColumn } from './kanban-column'
import { JobCard } from './job-card'
import { updateJobStage } from '@/actions/jobs'
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

  // Bulk select state — lifted up for the toolbar in Plan 05
  // For now just expose it as context; bulk select UI is added in Plan 05
  const [selectedJobIds, setSelectedJobIds] = useState<Set<string>>(new Set())

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

      <DragOverlay>
        {activeJob ? <JobCard job={activeJob} isOverlay /> : null}
      </DragOverlay>
    </DndContext>
  )
}
