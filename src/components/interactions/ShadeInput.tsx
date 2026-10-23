import type { Interaction } from '../../schemas/lesson.schema.ts'

type Shade = Extract<Interaction, { type: 'shade' }>

export function ShadeInput({
  interaction,
  value,
  disabled,
  revealed,
  onChange,
}: {
  interaction: Shade
  name: string
  value: string | null
  disabled: boolean
  revealed: boolean
  onChange: (value: string | null) => void
}) {
  const answerCount = (interaction.correct.numerator * interaction.segments) / interaction.correct.denominator
  const marks = revealed
    ? Array.from({ length: interaction.segments }, (_, index) => (index < answerCount ? '1' : '0')).join('')
    : value && value.length === interaction.segments
      ? value
      : '0'.repeat(interaction.segments)
  const colored = [...marks].filter((mark) => mark === '1').length

  const toggle = (index: number) => {
    const next = [...marks].map((mark, position) => (position === index ? (mark === '1' ? '0' : '1') : mark)).join('')
    onChange(next.includes('1') ? next : null)
  }

  return (
    <div className="grid gap-3">
      <div
        role="group"
        aria-label={interaction.prompt}
        className="grid gap-1.5 rounded-3xl bg-canvas p-2"
        style={{ gridTemplateColumns: `repeat(${interaction.segments}, minmax(0, 1fr))` }}
      >
        {[...marks].map((mark, index) => {
          const on = mark === '1'
          return (
            <button
              key={index}
              type="button"
              data-testid={`piece-${index}`}
              aria-pressed={on}
              aria-label={`Piece ${index + 1}`}
              disabled={disabled}
              onClick={() => toggle(index)}
              className={`min-h-24 rounded-2xl border-[3px] border-b-[6px] transition active:translate-y-0.5 sm:min-h-28 ${
                on ? 'piece-pop border-primary bg-accent' : 'border-black/15 bg-surface hover:bg-hint-surface'
              }`}
            />
          )
        })}
      </div>
      <p className="text-center font-display text-3xl text-ink" aria-live="polite">
        {colored}/{interaction.segments}
        <span className="sr-only"> pieces colored</span>
      </p>
    </div>
  )
}
