import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { LessonBackground } from '../lesson/Background.tsx'
import { themeToStyle } from '../theme/theme-style.ts'
import type { Theme } from '../../schemas/theme.schema.ts'

export function ThemedScreen({ theme, children }: { theme: Theme; children: ReactNode }) {
  return (
    <div style={themeToStyle(theme)} className="relative min-h-dvh bg-canvas text-ink">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-20 focus:rounded-xl focus:bg-surface focus:px-4 focus:py-3">
        Skip to the mission
      </a>
      <LessonBackground theme={theme} />
      <main id="main" className="relative z-10">
        {children}
      </main>
    </div>
  )
}

export function MissingAdventure() {
  return (
    <div className="mx-auto grid min-h-dvh max-w-xl place-items-center px-4 text-center">
      <div className="grid gap-4">
        <h1 className="font-display text-4xl">That adventure is not ready</h1>
        <p className="text-lg">Let's go back and pick a mission that is ready to play.</p>
        <Link to="/" className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-primary px-5 font-bold text-on-primary">
          Back to Adventures
        </Link>
      </div>
    </div>
  )
}

export function LoadingMission() {
  return (
    <div className="grid min-h-dvh place-items-center px-4">
      <p className="font-display text-3xl" role="status">
        Getting your mission ready...
      </p>
    </div>
  )
}

export function LessonProblem({ errors }: { errors: string[] }) {
  return (
    <div className="mx-auto grid max-w-xl gap-3 px-4 py-10" role="alert">
      <h1 className="font-display text-3xl">This mission needs a fix</h1>
      <p>The lesson file could not be read, so the mission did not start.</p>
      <ul className="grid gap-1 text-sm">
        {errors.map((error) => (
          <li key={error}>{error}</li>
        ))}
      </ul>
    </div>
  )
}
