import type { Theme } from '../../schemas/theme.schema.ts'

const floaters = [
  ['8%', '10%', '0s'],
  ['18%', '78%', '0.4s'],
  ['72%', '8%', '0.8s'],
  ['80%', '70%', '0.2s'],
  ['40%', '88%', '1s'],
] as const

export function LessonBackground({ theme }: { theme: Theme }) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true" data-background={theme.background}>
      {floaters.map(([top, left, delay]) => (
        <span
          key={`${top}-${left}`}
          className="float-slow absolute h-3 w-3 rounded-full bg-primary/25"
          style={{ top, left, animationDelay: delay }}
        />
      ))}
      {theme.background === 'starfield' ? (
        <span className="float-slow absolute -right-8 top-16 h-32 w-32 rounded-full border-8 border-secondary/25" data-decoration="planets" />
      ) : null}
      {theme.background === 'jungle' ? (
        <>
          <span className="absolute -left-6 bottom-0 h-40 w-24 rounded-t-full bg-primary/15" data-decoration="ferns" />
          <span className="absolute right-6 bottom-10 h-6 w-16 rotate-12 rounded-full bg-accent/40" data-decoration="bones" />
        </>
      ) : null}
      {theme.background === 'pitch' ? (
        <>
          <span className="absolute bottom-8 left-6 h-14 w-14 rounded-full border-4 border-ink/15" data-decoration="balls" />
          <span className="absolute right-4 bottom-0 h-16 w-28 rounded-t-2xl border-4 border-b-0 border-primary/25" data-decoration="goals" />
        </>
      ) : null}
      {theme.decorations.includes('stars') ? (
        <span className="float-slow absolute bottom-16 left-8 h-8 w-8 bg-accent/70" data-decoration="stars" style={{ clipPath: 'polygon(50% 0, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)' }} />
      ) : null}
    </div>
  )
}
