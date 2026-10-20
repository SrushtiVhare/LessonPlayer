import type { Theme } from '../../schemas/theme.schema.ts'
import { Astronaut } from './Astronaut.tsx'
import { Dino } from './Dino.tsx'
import type { CharacterMood } from './mood.ts'

const illustrations = {
  astronaut: Astronaut,
  dino: Dino,
} as const

export function Character({
  theme,
  mood,
}: {
  theme: Theme
  mood: CharacterMood
}) {
  const Art = illustrations[theme.character.illustration]
  return (
    <figure className="m-0 flex flex-col items-center gap-2 text-center" data-character={theme.character.illustration} data-mood={mood}>
      <div role="img" aria-label={theme.character.description}>
        <Art mood={mood} />
      </div>
      <figcaption className="max-w-56 rounded-[var(--wq-radius-card)] bg-surface px-3 py-2 text-sm font-semibold text-ink shadow-[var(--wq-shadow)]">
        <span className="sr-only">{theme.character.name} says: </span>
        {theme.phrases[mood]}
      </figcaption>
    </figure>
  )
}
