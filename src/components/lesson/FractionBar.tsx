import type { FractionBar as FractionBarModel, LessonVisual } from '../../schemas/lesson.schema.ts'

const fills = {
  gold: 'var(--wq-accent)',
  blue: 'var(--wq-secondary)',
  lavender: 'var(--wq-primary)',
} as const

export function FractionBar({ bar }: { bar: FractionBarModel }) {
  return (
    <figure className="m-0 grid gap-2">
      <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${bar.segments}, minmax(0, 1fr))` }} aria-hidden="true">
        {Array.from({ length: bar.segments }, (_, index) => (
          <span
            key={index}
            className="piece-pop h-10 rounded-xl border-2 border-black/10 sm:h-12"
            style={{
              background: index < bar.shaded ? fills[bar.color] : 'rgb(26 35 64 / 0.06)',
              animationDelay: `${index * 45}ms`,
            }}
          />
        ))}
      </div>
      <figcaption className="text-sm font-semibold text-muted">{bar.caption}</figcaption>
    </figure>
  )
}

export function FractionBars({ visual }: { visual: LessonVisual }) {
  return (
    <div className="grid gap-4">
      {visual.bars.map((bar, index) => (
        <FractionBar key={`${bar.caption}-${index}`} bar={bar} />
      ))}
    </div>
  )
}
