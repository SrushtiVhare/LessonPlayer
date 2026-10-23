import { Flame, Star } from 'lucide-react'

export function MissionProgress({
  label,
  completed,
  total,
  position,
  stars = 0,
  streak = 0,
}: {
  label: string
  completed: number
  total: number
  position: number
  stars?: number
  streak?: number
}) {
  const percent = Math.round(Math.min(1, Math.max(0, position)) * 100)
  return (
    <div className="grid flex-1 gap-1">
      <div className="flex items-center gap-3">
        <div
          className="relative h-7 flex-1 rounded-full bg-black/25"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={total}
          aria-valuenow={completed}
          aria-label="Challenges finished"
        >
          <div className="h-full rounded-full bg-accent transition-[width] duration-500" style={{ width: `${Math.max(percent, 6)}%` }}>
            <div className="mx-3 mt-1.5 h-1.5 rounded-full bg-white/50" />
          </div>
          <span
            className="emoji-marker absolute top-1/2 -translate-x-1/2 -translate-y-1/2 text-3xl transition-[left] duration-500"
            style={{ left: `${Math.min(Math.max(percent, 6), 96)}%` }}
            aria-hidden="true"
          />
          <span className="sr-only">
            {completed} of {total} challenges finished
          </span>
        </div>
        <span className="on-world inline-flex items-center gap-1 font-display text-2xl" title="Stars">
          <Star aria-hidden="true" size={26} fill="var(--wq-accent)" stroke="var(--wq-accent)" />
          {stars}
          <span className="sr-only">stars</span>
        </span>
        {streak > 1 ? (
          <span className="on-world inline-flex items-center gap-1 font-display text-2xl" title="First-try streak">
            <Flame aria-hidden="true" size={26} fill="#FF9F1C" stroke="#FF9F1C" />
            {streak}
            <span className="sr-only">in a row</span>
          </span>
        ) : null}
      </div>
      <p className="on-world text-sm font-bold">{label}</p>
    </div>
  )
}
