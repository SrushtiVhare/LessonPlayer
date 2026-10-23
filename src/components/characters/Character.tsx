import type { Theme } from '../../schemas/theme.schema.ts'
import { Astronaut } from './Astronaut.tsx'
import { Dino } from './Dino.tsx'
import { Player } from './Player.tsx'
import type { CharacterMood } from './mood.ts'

const illustrations = {
  astronaut: Astronaut,
  dino: Dino,
  player: Player,
} as const

export function Character({
  theme,
  mood,
  compact = false,
  size,
}: {
  theme: Theme
  mood: CharacterMood
  compact?: boolean
  size?: string
}) {
  const Art = illustrations[theme.character.illustration]
  return (
    <figure className="character-float m-0 flex flex-col items-center gap-2 text-center" data-character={theme.character.illustration} data-mood={mood}>
      <div
        role={compact ? undefined : 'img'}
        aria-hidden={compact ? true : undefined}
        aria-label={compact ? undefined : theme.character.description}
        className={size ?? (compact ? 'h-24 w-24' : 'h-36 w-36 sm:h-44 sm:w-44')}
      >
        <Art mood={mood} />
      </div>
      {compact ? null : (
        <figcaption className="feedback-pop max-w-56 rounded-[var(--wq-radius-card)] bg-surface px-3 py-2 text-sm font-semibold text-ink shadow-[var(--wq-shadow)]">
          <span className="sr-only">{theme.character.name} says: </span>
          {theme.phrases[mood]}
        </figcaption>
      )}
    </figure>
  )
}
