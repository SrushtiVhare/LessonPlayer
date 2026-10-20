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
        className="h-3 overflow-hidden rounded-full bg-white/80"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={completed}
        aria-label="Challenges finished"
      >
        <div className="h-full rounded-full bg-accent transition-[width]" style={{ width: `${percent}%` }} />
      </div>
    </div>
  )
}
