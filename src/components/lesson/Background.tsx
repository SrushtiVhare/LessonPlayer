import type { Theme } from '../../schemas/theme.schema.ts'

const floaters = [
  ['10%', '4%', '0s', 'text-4xl'],
  ['26%', '90%', '0.6s', 'text-5xl'],
  ['62%', '3%', '1.2s', 'text-3xl'],
  ['80%', '88%', '0.3s', 'text-4xl'],
  ['45%', '94%', '1.6s', 'text-2xl'],
] as const

const extras: Record<Theme['background'], string> = {
  starfield: '🪐',
  jungle: '🌿',
  pitch: '🥅',
  plain: '✨',
}

export function LessonBackground({ theme }: { theme: Theme }) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true" data-background={theme.background}>
      {floaters.map(([top, left, delay, size], index) => (
        <span
          key={`${top}-${left}`}
          className={`float-slow absolute opacity-60 ${size}`}
          style={{ top, left, animationDelay: delay }}
          data-decoration={index % 2 === 0 ? theme.decorations[0] : theme.decorations[1]}
        >
          {index % 2 === 0 ? theme.character.emoji ?? '⭐' : extras[theme.background]}
        </span>
      ))}
    </div>
  )
}
