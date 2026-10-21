import type { Interaction } from '../../schemas/lesson.schema.ts'
import { FractionBar } from '../lesson/FractionBar.tsx'
import { MathLabel } from '../lesson/MathLabel.tsx'

type Choice = Extract<Interaction, { type: 'multiple-choice' }>

export function MultipleChoice({
  interaction,
  name,
  value,
  disabled,
  revealed,
  onChange,
}: {
  interaction: Choice
  name: string
  value: string | null
  disabled: boolean
  revealed: boolean
  onChange: (value: string | null) => void
}) {
  return (
    <fieldset className="grid gap-3" disabled={disabled}>
      <legend className="sr-only">{interaction.prompt}</legend>
      {interaction.options.map((option) => {
        const selected = value === option.id
        const isAnswer = revealed && option.id === interaction.correctOptionId
        return (
          <label
            key={option.id}
            className={`flex min-h-16 cursor-pointer items-center gap-3 rounded-[var(--wq-radius-card)] border-4 border-ink px-4 py-3 text-lg font-bold shadow-[var(--wq-shadow)] transition active:translate-x-1 active:translate-y-1 active:shadow-none has-[:focus-visible]:outline has-[:focus-visible]:outline-4 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-secondary ${selected ? 'bg-accent text-on-accent' : 'bg-surface'} ${disabled ? 'cursor-default' : ''}`}
            data-testid={`choice-${option.id}`}
          >
            <input
              className="sr-only"
              type="radio"
              name={name}
              value={option.id}
              aria-label={option.accessibleLabel}
              checked={selected}
              onChange={() => onChange(option.id)}
            />
            <span className="grid flex-1 gap-2">
              <MathLabel label={option.label} accessibleLabel={option.accessibleLabel} />
              {option.visual ? <FractionBar bar={option.visual} /> : null}
            </span>
            {selected ? <span className="rounded-full bg-primary px-3 py-1 text-sm font-bold text-on-primary">Selected</span> : null}
            {isAnswer ? <span className="rounded-full bg-reveal px-3 py-1 text-sm font-bold text-on-primary">Answer</span> : null}
          </label>
        )
      })}
    </fieldset>
  )
}
