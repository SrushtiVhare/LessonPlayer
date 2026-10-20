import type { Interaction } from '../../schemas/lesson.schema.ts'

type Numeric = Extract<Interaction, { type: 'numeric-input' }>

export function NumericInput({
  interaction,
  value,
  disabled,
  onChange,
}: {
  interaction: Numeric
  name: string
  value: string | null
  disabled: boolean
  revealed: boolean
  onChange: (value: string | null) => void
}) {
  return (
    <div className="grid gap-2">
      <label className="grid gap-2 text-base font-bold text-ink" htmlFor={`${interaction.type}-answer`}>
        Your answer
        <input
          id={`${interaction.type}-answer`}
          data-testid="numeric-input"
          className="min-h-14 w-full rounded-[var(--wq-radius-card)] border-4 border-transparent bg-surface px-4 font-display text-3xl text-ink shadow-[var(--wq-shadow)] outline-none focus:border-secondary disabled:text-ink"
          inputMode="text"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          placeholder={interaction.placeholder ?? 'Type your answer'}
          value={value ?? ''}
          disabled={disabled}
          aria-describedby="answer-format"
          onChange={(event) => onChange(event.target.value)}
        />
      </label>
      <p id="answer-format" className="text-base text-muted">
        {interaction.acceptedFormats.includes('fraction') && interaction.acceptedFormats.includes('decimal')
          ? 'Try a fraction like 3/4 or a decimal like 0.5.'
          : interaction.acceptedFormats.includes('fraction')
            ? 'Try a fraction like 3/4.'
            : 'Try a decimal like 0.5.'}
      </p>
    </div>
  )
}
