import type { Stage } from '@/types/database'
import { PhotoGrid } from './photo-grid'

interface StageTimelineProps {
  stages: Stage[]
  currentStageId: string | null
  stagePhotos?: Record<string, string[]>  // stage_id → signed URLs
}

export function StageTimeline({ stages, currentStageId, stagePhotos = {} }: StageTimelineProps) {
  const currentIndex = stages.findIndex((s) => s.id === currentStageId)

  return (
    <ol className="flex flex-col gap-0">
      {stages.map((stage, i) => {
        const isCurrent = stage.id === currentStageId
        const isPast = currentIndex > -1 && i < currentIndex
        const photos = stagePhotos[stage.id] ?? []

        return (
          <li key={stage.id} className="flex items-start gap-3 py-2">
            {/* Step indicator + connector line */}
            <div className="flex flex-col items-center pt-0.5">
              <div
                className={[
                  'flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold',
                  isCurrent
                    ? 'border-[var(--brand)] bg-[var(--brand)] text-white'
                    : isPast
                      ? 'border-[var(--brand)] bg-white text-[var(--brand)]'
                      : 'border-gray-300 bg-white text-gray-400',
                ].join(' ')}
              >
                {isPast ? '✓' : i + 1}
              </div>
              {/* Connector line — skip on last item */}
              {i < stages.length - 1 && (
                <div
                  className={[
                    'mt-1 w-0.5 flex-1 self-stretch',
                    isPast || isCurrent ? 'bg-[var(--brand)]' : 'bg-gray-200',
                  ].join(' ')}
                  style={{ minHeight: photos.length > 0 ? '4rem' : '1.25rem' }}
                />
              )}
            </div>

            {/* Stage name + photos */}
            <div className="pb-4 flex-1 min-w-0">
              <p
                className={[
                  'text-sm font-medium leading-tight',
                  isCurrent ? 'text-[var(--brand)]' : isPast ? 'text-gray-500' : 'text-gray-400',
                ].join(' ')}
              >
                {stage.name}
              </p>
              {isCurrent && (
                <p className="mt-0.5 text-xs text-gray-500">Current stage</p>
              )}
              {photos.length > 0 && (
                <div className="mt-3">
                  <PhotoGrid photos={photos} />
                </div>
              )}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
