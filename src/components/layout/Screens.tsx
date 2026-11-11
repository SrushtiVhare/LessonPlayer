import { useEffect, type ReactNode } from 'react'
import { Link } from 'react-router'
import { LessonBackground } from '../lesson/Background.tsx'
import { themeToStyle } from '../theme/theme-style.ts'
import type { Theme } from '../../schemas/theme.schema.ts'

export function ThemedScreen({ theme, children, skipLabel = 'Skip to the mission' }: { theme: Theme; children: ReactNode; skipLabel?: string }) {
  return (
    <div style={themeToStyle(theme)} data-world={theme.background} className="world-sky relative min-h-dvh text-ink">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-20 focus:rounded-xl focus:bg-surface focus:px-4 focus:py-3"
        onClick={(event) => {
          const main = document.getElementById('main')
          if (!main) return
          event.preventDefault()
          main.focus()
        }}
      >
        {skipLabel}
      </a>
      <LessonBackground theme={theme} />
      <main id="main" tabIndex={-1} className="relative z-10 outline-none">
        {children}
      </main>
    </div>
  )
}

export function MissingAdventure() {
  useEffect(() => {
    document.title = "We can't find that adventure · WonderQuest Math"
  }, [])

  return (
    <div className="mx-auto grid min-h-dvh max-w-xl place-items-center px-4 text-center">
      <div className="grid gap-4 rounded-[2rem] bg-white p-6 text-[#1A2340] shadow-xl">
        <p className="text-6xl" aria-hidden="true">🧭</p>
        <h1 className="font-display text-4xl">We can't find that adventure</h1>
        <p className="text-lg">Let's go home and pick another one.</p>
        <Link to="/" className="inline-flex min-h-14 items-center justify-center rounded-2xl bg-[#3C3489] px-5 text-lg font-bold text-white">
          Go home
        </Link>
      </div>
    </div>
  )
}

export function LoadingMission() {
  useEffect(() => {
    document.title = 'Getting your adventure ready · WonderQuest Math'
  }, [])

  return (
    <div className="world-sky grid min-h-dvh place-items-center px-4">
      <div className="grid justify-items-center gap-4 rounded-[2rem] border-b-8 border-black/10 bg-white px-8 py-6 text-[#1A2340] shadow-xl">
        <span className="character-float text-7xl" aria-hidden="true">✨</span>
        <h1 className="font-display text-3xl" aria-live="polite">
          Your adventure is almost ready...
        </h1>
      </div>
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
