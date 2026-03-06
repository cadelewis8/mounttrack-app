'use client'
import {
  DndContext, closestCenter,
  useSensor, useSensors, PointerSensor, KeyboardSensor,
  type DragEndEvent,
} from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Trash2, Check, X } from 'lucide-react'
import { useState, useTransition } from 'react'
import { reorderStages, deleteStage, createStage, updateStage, seedDefaultStages } from '@/actions/stages'
import type { Stage } from '@/types/database'

interface StageRowProps {
  stage: Stage
  canDelete: boolean
  onDelete: (id: string) => Promise<void>
  onRename: (id: string, name: string) => Promise<void>
}

function StageRow({ stage, canDelete, onDelete, onRename }: StageRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: stage.id })

  const [editing, setEditing] = useState(false)
  const [editValue, setEditValue] = useState(stage.name)
  const [, startTransition] = useTransition()

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  function handleRenameSubmit() {
    if (!editValue.trim() || editValue.trim() === stage.name) {
      setEditing(false)
      setEditValue(stage.name)
      return
    }
    startTransition(async () => {
      await onRename(stage.id, editValue.trim())
      setEditing(false)
    })
  }

  function handleDeleteClick() {
    startTransition(async () => {
      await onDelete(stage.id)
    })
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 p-2 border rounded-md bg-card"
    >
      {/* Drag handle only — listeners NOT on the whole row to allow button clicks */}
      <button
        type="button"
        className="cursor-grab touch-none text-muted-foreground hover:text-foreground p-0.5"
        {...attributes}
        {...listeners}
        aria-label="Drag to reorder"
      >
        <GripVertical className="h-4 w-4" />
      </button>

      {/* Stage name — click to edit inline */}
      {editing ? (
        <div className="flex items-center gap-1 flex-1">
          <input
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleRenameSubmit()
              if (e.key === 'Escape') { setEditing(false); setEditValue(stage.name) }
            }}
            className="flex-1 text-sm border rounded px-2 py-0.5 bg-background focus:outline-none focus:ring-1 focus:ring-[var(--brand)]"
            autoFocus
            maxLength={50}
          />
          <button type="button" onClick={handleRenameSubmit} className="text-green-500 hover:text-green-600">
            <Check className="h-4 w-4" />
          </button>
          <button type="button" onClick={() => { setEditing(false); setEditValue(stage.name) }} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="flex-1 text-left text-sm hover:text-[var(--brand)] transition-colors"
          title="Click to rename"
        >
          {stage.name}
        </button>
      )}

      {/* Delete button — only shown if canDelete */}
      {canDelete && (
        <button
          type="button"
          onClick={handleDeleteClick}
          className="text-muted-foreground hover:text-red-500 transition-colors p-0.5"
          title="Delete stage"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}

interface StageManagerProps {
  initialStages: Stage[]
}

export function StageManager({ initialStages }: StageManagerProps) {
  const [stages, setStages] = useState(initialStages)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [newStageName, setNewStageName] = useState('')
  const [addError, setAddError] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  )

  function onDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return
    setStages((prev) => {
      const oldIndex = prev.findIndex((s) => s.id === active.id)
      const newIndex = prev.findIndex((s) => s.id === over.id)
      const reordered = arrayMove(prev, oldIndex, newIndex)
      // Persist new order
      startTransition(async () => {
        await reorderStages(reordered.map((s) => s.id))
      })
      return reordered
    })
  }

  async function handleDelete(stageId: string) {
    setDeleteError(null)
    const result = await deleteStage(stageId)
    if (result?.error) {
      setDeleteError(result.error)
    } else {
      setStages((prev) => prev.filter((s) => s.id !== stageId))
    }
  }

  async function handleRename(stageId: string, name: string) {
    const fd = new FormData()
    fd.append('stage_id', stageId)
    fd.append('name', name)
    await updateStage(undefined, fd)
    setStages((prev) => prev.map((s) => s.id === stageId ? { ...s, name } : s))
  }

  async function handleSeedDefaults() {
    const result = await seedDefaultStages()
    if (result?.error) {
      setAddError(result.error)
    }
    // revalidatePath in the action will refresh server component with the new stages
  }

  async function handleAdd() {
    setAddError(null)
    const name = newStageName.trim()
    if (!name) { setAddError('Enter a stage name'); return }
    const fd = new FormData()
    fd.append('name', name)
    const result = await createStage(undefined, fd)
    if (result?.error) {
      setAddError(result.error)
    } else {
      // Optimistic: clear input; revalidatePath will refresh the server component
      setNewStageName('')
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-base font-medium">Production Stages</h2>
        <p className="text-sm text-muted-foreground">
          Drag to reorder. Click a name to rename. Stages appear as columns on the board.
        </p>
      </div>

      {deleteError && (
        <p className="text-sm text-red-500 bg-red-50 dark:bg-red-950/20 border border-red-200 rounded px-3 py-2">
          {deleteError}
        </p>
      )}

      {stages.length === 0 && (
        <div className="text-center py-6 border rounded-md bg-muted/30">
          <p className="text-sm text-muted-foreground mb-3">No stages yet.</p>
          <button
            type="button"
            onClick={handleSeedDefaults}
            className="px-4 py-2 text-sm rounded bg-[var(--brand)] text-white hover:opacity-90 transition-opacity"
          >
            Load default taxidermy stages
          </button>
        </div>
      )}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={stages.map((s) => s.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-1">
            {stages.map((stage) => (
              <StageRow
                key={stage.id}
                stage={stage}
                canDelete={stages.length > 1}
                onDelete={handleDelete}
                onRename={handleRename}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* Add new stage */}
      <div className="flex gap-2 pt-2 border-t">
        <input
          type="text"
          value={newStageName}
          onChange={(e) => setNewStageName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          placeholder="New stage name..."
          maxLength={50}
          className="flex-1 text-sm border rounded px-3 py-1.5 bg-background focus:outline-none focus:ring-1 focus:ring-[var(--brand)]"
        />
        <button
          type="button"
          onClick={handleAdd}
          className="px-3 py-1.5 text-sm rounded bg-[var(--brand)] text-white hover:opacity-90 transition-opacity"
        >
          Add
        </button>
      </div>

      {addError && (
        <p className="text-xs text-red-500">{addError}</p>
      )}
    </div>
  )
}
