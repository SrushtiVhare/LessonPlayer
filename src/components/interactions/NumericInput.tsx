import { Delete } from 'lucide-react'
import type { Interaction } from '../../schemas/lesson.schema.ts'

type Numeric = Extract<Interaction, { type: 'numeric-input' }>

const MAX_LENGTH = 12

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
  const text = value ?? ''
  const keys = [
    '1', '2', '3',
    '4', '5', '6',
    '7', '8', '9',
    interaction.acceptedFormats.includes('fraction') ? '/' : '',
    '0',
    interaction.acceptedFormats.includes('decimal') ? '.' : '',
  ]
  const press = (key: string) => {
    if (text.length >= MAX_LENGTH) return
    onChange(text + key)
  }

  return (
    <div className="grid gap-3">
      <label className="sr-only" htmlFor={`${interaction.type}-answer`}>
        Your answer
      </label>
      <div className="flex items-center gap-2">
        <input
          id={`${interaction.type}-answer`}
          data-testid="numeric-input"
          className="min-h-20 w-full rounded-3xl border-[3px] border-b-[7px] border-black/10 bg-canvas px-5 text-center font-display text-5xl text-ink outline-none placeholder:text-2xl sm:placeholder:text-3xl focus:border-primary disabled:text-ink"
          inputMode="decimal"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          maxLength={MAX_LENGTH}
          placeholder={interaction.placeholder ?? '?'}
          value={text}
          disabled={disabled}
          aria-describedby="answer-format"
          onChange={(event) => onChange(event.target.value)}
        />
      </div>
      <p id="answer-format" className="text-center text-base font-semibold text-muted">
        {interaction.acceptedFormats.includes('fraction') && interaction.acceptedFormats.includes('decimal')
          ? 'Like 3/4 or 0.75'
          : interaction.acceptedFormats.includes('fraction')
            ? 'Like 3/4'
            : 'Like 0.5'}
      </p>
      {disabled ? null : (
        <div className="mx-auto grid w-full max-w-sm grid-cols-3 gap-2" role="group" aria-label="Number pad">
          {keys.map((key, index) =>
            key ? (
              <button
                key={key}
                type="button"
                className="min-h-14 rounded-2xl border-2 border-b-[5px] border-black/10 bg-surface font-display text-3xl text-ink active:translate-y-0.5 active:border-b-2"
                aria-label={key === '/' ? 'fraction bar' : key === '.' ? 'decimal point' : key}
                onClick={() => press(key)}
              >
                {key}
              </button>
            ) : (
              <span key={`blank-${index}`} />
            ),
          )}
          <button
            type="button"
            className="col-span-3 inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border-2 border-b-[5px] border-black/10 bg-incorrect-surface font-bold text-incorrect active:translate-y-0.5 active:border-b-2"
            aria-label="Delete last"
            onClick={() => onChange(text.slice(0, -1) || null)}
          >
            <Delete aria-hidden="true" size={22} /> Undo
          </button>
        </div>
      )}
    </div>
  )
}
