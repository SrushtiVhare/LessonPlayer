import { formatRational, rationalAtTick, rationalsEqual } from '../../lib/rational.ts'
import type { Interaction } from '../../schemas/lesson.schema.ts'

type NumberLine = Extract<Interaction, { type: 'number-line' }>

export function NumberLineInput({
  interaction,
  value,
  disabled,
  revealed,
  onChange,
}: {
  interaction: NumberLine
  name: string
  value: string | null
  disabled: boolean
  revealed: boolean
  onChange: (value: string | null) => void
}) {
  const ticks = Array.from({ length: interaction.partitions + 1 }, (_, index) => {
    const rational = rationalAtTick(interaction.start, interaction.end, interaction.partitions, index)
    return {
      index,
      label: rational ? formatRational(rational) : String(index),
      isAnswer: Boolean(rational && rationalsEqual(rational, interaction.correct)),
    }
  })

  return (
    <div className="grid gap-4">
      <div role="group" aria-label={interaction.prompt} className="relative px-1 pt-2">
        <div className="absolute top-7 right-6 left-6 h-1.5 rounded-full bg-ink/20" aria-hidden="true" />
        <div className="relative flex items-start justify-between gap-1">
          {ticks.map((tick) => {
            const selected = value === String(tick.index)
            return (
              <button
                key={tick.index}
                type="button"
                className={`flex min-h-16 min-w-12 flex-1 flex-col items-center gap-2 rounded-2xl px-1 py-1 transition active:scale-95 ${selected ? 'bg-surface shadow-[var(--wq-shadow)]' : ''}`}
                aria-pressed={selected}
                disabled={disabled}
                data-testid={`tick-${tick.index}`}
                onClick={() => onChange(String(tick.index))}
              >
                <span className={`h-6 w-6 rounded-full border-4 ${selected || (revealed && tick.isAnswer) ? 'border-primary bg-accent' : 'border-ink bg-surface'}`} />
                <span className="text-sm font-bold text-ink">{tick.label}</span>
                {selected ? <span className="text-xs font-bold text-primary">Selected</span> : null}
                {revealed && tick.isAnswer ? <span className="text-xs font-bold text-reveal">Answer</span> : null}
              </button>
            )
          })}
        </div>
      </div>
      {!disabled && value !== null ? (
        <button type="button" className="min-h-12 justify-self-start font-bold text-primary underline" onClick={() => onChange(null)}>
          Change mark
        </button>
      ) : null}
    </div>
  )
}
