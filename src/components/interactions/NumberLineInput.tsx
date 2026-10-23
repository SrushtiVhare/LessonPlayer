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
    <div className="grid gap-2 overflow-x-auto pb-1">
      <div role="group" aria-label={interaction.prompt} className="relative min-w-[30rem] px-1 pt-12">
        <div className="absolute top-[4.6rem] right-7 left-7 h-3 rounded-full bg-primary" aria-hidden="true" />
        <div className="relative flex items-start justify-between gap-1">
          {ticks.map((tick) => {
            const selected = value === String(tick.index)
            const shown = selected || (revealed && tick.isAnswer)
            return (
              <button
                key={tick.index}
                type="button"
                className="relative flex min-h-20 min-w-12 flex-1 flex-col items-center gap-2 rounded-2xl px-1 py-1 transition active:scale-95"
                aria-pressed={selected}
                disabled={disabled}
                data-testid={`tick-${tick.index}`}
                onClick={() => onChange(String(tick.index))}
              >
                {shown ? <span className="emoji-marker piece-pop absolute -top-11 text-4xl" aria-hidden="true" /> : null}
                <span className={`h-9 w-9 rounded-full border-[5px] ${shown ? 'border-primary bg-accent' : 'border-primary bg-surface'}`} />
                <span className="font-display text-lg text-ink">{tick.label}</span>
                {selected ? <span className="sr-only">Selected</span> : null}
                {revealed && tick.isAnswer ? <span className="text-xs font-bold text-reveal">Answer</span> : null}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
