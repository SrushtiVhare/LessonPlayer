import type { Interaction } from '../../schemas/lesson.schema.ts'
import { FractionBar } from '../lesson/FractionBar.tsx'
import { MathLabel } from '../lesson/MathLabel.tsx'

type Choice = Extract<Interaction, { type: 'multiple-choice' }>

const tiles = [
  { badge: '#E5484D', tint: '#FFF0F0', shape: 'polygon(50% 8%, 95% 90%, 5% 90%)' },
  { badge: '#2F6FEB', tint: '#EEF4FF', shape: 'polygon(50% 0, 100% 50%, 50% 100%, 0 50%)' },
  { badge: '#D69E00', tint: '#FFF8E1', shape: 'circle(48% at 50% 50%)' },
  { badge: '#1F9D55', tint: '#ECFAF1', shape: 'inset(8% round 18%)' },
] as const

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
  const wide = interaction.options.some((option) => option.visual)
  return (
    <fieldset className={`grid gap-3 ${wide ? '' : 'sm:grid-cols-2'}`} disabled={disabled}>
      <legend className="sr-only">{interaction.prompt}</legend>
      {interaction.options.map((option, index) => {
        const selected = value === option.id
        const isAnswer = revealed && option.id === interaction.correctOptionId
        const tile = tiles[index % tiles.length]!
        return (
          <label
            key={option.id}
            className={`flex min-h-20 cursor-pointer items-center gap-4 rounded-3xl border-[3px] border-b-[7px] px-4 py-3 text-xl font-extrabold text-ink transition active:translate-y-1 active:border-b-[3px] has-[:focus-visible]:outline has-[:focus-visible]:outline-4 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-secondary ${
              isAnswer ? 'border-success bg-success-surface' : selected ? 'scale-[1.02] border-primary' : 'border-black/10'
            } ${disabled ? 'cursor-default' : 'hover:-translate-y-0.5'}`}
            style={isAnswer ? undefined : { background: tile.tint }}
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
            <span className="h-9 w-9 shrink-0" style={{ background: tile.badge, clipPath: tile.shape }} aria-hidden="true" />
            <span className="grid flex-1 gap-2">
              <MathLabel label={option.label} accessibleLabel={option.accessibleLabel} />
              {option.visual ? <FractionBar bar={option.visual} /> : null}
            </span>
            {selected ? <span className="rounded-full bg-primary px-3 py-1 text-sm font-bold text-on-primary">Selected</span> : null}
            {isAnswer ? <span className="rounded-full bg-success px-3 py-1 text-sm font-bold text-white">Answer</span> : null}
          </label>
        )
      })}
    </fieldset>
  )
}
