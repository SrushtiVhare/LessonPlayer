export function MissionProgress({
  label,
  completed,
  total,
}: {
  label: string
  completed: number
  total: number
}) {
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100)
  return (
    <div className="grid gap-2">
      <div className="flex items-baseline justify-between gap-3">
        <p className="font-display text-lg text-ink">{label}</p>
        <p className="text-sm font-bold text-muted">
          {completed} of {total} finished
        </p>
      </div>
      <div
        className="flex gap-1.5"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={completed}
        aria-label="Challenges finished"
      >
        {Array.from({ length: Math.max(total, 1) }, (_, index) => (
          <span
            key={index}
            className={`h-4 flex-1 rounded-full border-2 border-ink ${index < completed ? 'bg-accent' : 'bg-surface'}`}
          />
        ))}
        <span className="sr-only">{percent} percent</span>
      </div>
    </div>
  )
}
