import type { Theme } from '../../schemas/theme.schema.ts'

const starPositions = [
  ['8%', '12%'],
  ['18%', '28%'],
  ['78%', '10%'],
  ['88%', '24%'],
  ['70%', '70%'],
  ['12%', '76%'],
  ['46%', '8%'],
  ['92%', '58%'],
] as const

export function LessonBackground({ theme }: { theme: Theme }) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true" data-background={theme.background}>
      {theme.background === 'starfield'
        ? starPositions.map(([top, left]) => (
            <span key={`${top}-${left}`} className="absolute h-1.5 w-1.5 rounded-full bg-primary/30" style={{ top, left }} />
          ))
        : null}
      {theme.decorations.includes('planets') ? (
        <span className="absolute -right-10 top-24 h-28 w-28 rounded-full border-8 border-secondary/20" data-decoration="planets" />
      ) : null}
      {theme.decorations.includes('stars') ? (
        <span className="absolute bottom-16 left-6 h-8 w-8 rotate-12 border-2 border-accent/50" data-decoration="stars" style={{ clipPath: 'polygon(50% 0, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)' }} />
      ) : null}
    </div>
  )
}
