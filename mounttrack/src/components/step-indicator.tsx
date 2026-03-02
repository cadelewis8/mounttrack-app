interface StepIndicatorProps {
  current: number
  total: number
}

export function StepIndicator({ current, total }: StepIndicatorProps) {
  return (
    <div className="flex items-center gap-2 mb-8">
      {Array.from({ length: total }, (_, i) => (
        <div key={i} className="flex items-center gap-2">
          <div
            className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium ${
              i + 1 <= current
                ? 'bg-[var(--brand)] text-white'
                : 'bg-muted text-muted-foreground'
            }`}
          >
            {i + 1}
          </div>
          {i < total - 1 && (
            <div className={`h-0.5 w-8 ${i + 1 < current ? 'bg-[var(--brand)]' : 'bg-muted'}`} />
          )}
        </div>
      ))}
      <span className="ml-2 text-sm text-muted-foreground">Step {current} of {total}</span>
    </div>
  )
}
