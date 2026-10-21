import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { ThemedScreen } from '../components/layout/Screens.tsx'
import { Character } from '../components/characters/Character.tsx'
import { themeToStyle } from '../components/theme/theme-style.ts'
import { adventures, getAdventure } from '../features/lesson-library/adventures.ts'
import { createInitialState } from '../features/lesson-player/lesson-reducer.ts'
import { requestGeneratedLesson } from '../lib/generate-client.ts'
import { reconcileProgress } from '../lib/progress-reconcile.ts'
import { scoreLesson } from '../lib/scoring.ts'
import {
  clearLocalProgress,
  readAdventureId,
  readCachedLesson,
  readLatestLessonId,
  readLocalProgress,
  writeAdventureId,
  writeCachedLesson,
  writeLatestLessonId,
} from '../lib/storage.ts'
import { QUESTION_COUNT } from '../server/prepare-lesson.ts'

export function HomePage() {
  const navigate = useNavigate()
  const [adventureId, setAdventureId] = useState(() => readAdventureId() ?? 'space')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const adventure = getAdventure(adventureId)
  const latest = readCachedLesson(readLatestLessonId() ?? '')
  const progress = latest ? readLocalProgress(latest.id) : null
  const state = latest && progress?.status === 'ok' ? reconcileProgress(latest, progress.progress).state : latest ? createInitialState(latest) : null
  const score = latest && state ? scoreLesson(latest, state.tasks) : null
  const unfinished = Boolean(score && score.completed > 0 && score.completed < score.total)

  function chooseAdventure(id: string) {
    const next = getAdventure(id)
    setAdventureId(next.id)
    writeAdventureId(next.id)
  }

  async function startFresh() {
    setBusy(true)
    setError(null)
    const result = await requestGeneratedLesson(adventure.id)
    setBusy(false)
    if (!result.ok) {
      setError(result.error)
      return
    }
    clearLocalProgress(result.lesson.id)
    writeCachedLesson(result.lesson)
    writeLatestLessonId(result.lesson.id)
    navigate(`/lesson/${result.lesson.id}?adventure=${adventure.id}`)
  }

  useEffect(() => {
    document.title = 'WonderQuest Math'
  }, [])

  return (
    <ThemedScreen theme={adventure.theme}>
      <div className="mx-auto grid w-full max-w-5xl gap-8 px-4 py-6 sm:px-6">
        <header className="flex items-center justify-between gap-3">
          <div>
            <p className="font-display text-3xl leading-none text-ink">WonderQuest</p>
            <p className="font-bold text-muted">Math</p>
          </div>
          <p data-testid="save-status" className="max-w-48 text-right text-sm font-semibold text-muted">
            Saved on this device
          </p>
        </header>
        <section className="grid items-center gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
          <div className="grid gap-4">
            <p className="text-sm font-bold tracking-wide text-muted uppercase">Ten puzzles · one big idea</p>
            <h1 className="font-display text-5xl text-ink sm:text-6xl">{adventure.story.welcomeTitle}</h1>
            <p className="max-w-xl text-xl leading-relaxed text-ink">{adventure.story.welcomeBody}</p>
            <div className="flex max-w-md gap-1.5" aria-hidden="true">
              {Array.from({ length: QUESTION_COUNT }, (_, index) => (
                <span key={index} className="h-3 flex-1 rounded-full border-2 border-ink bg-surface" />
              ))}
            </div>
            <p className="font-bold text-ink">Ten new puzzles every time. They cover the whole idea, from naming a fraction to catching a tricky mistake.</p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                data-testid="start-learning"
                className="inline-flex min-h-14 items-center justify-center rounded-[var(--wq-radius-button)] border-4 border-ink bg-accent px-6 text-lg font-bold text-on-accent shadow-[var(--wq-shadow)] transition active:translate-x-1 active:translate-y-1 active:shadow-none disabled:opacity-70"
                disabled={busy}
                onClick={() => void startFresh()}
              >
                {busy ? 'Making 10 new puzzles...' : 'Start Learning'}
              </button>
              {unfinished && latest ? (
                <Link
                  to={`/lesson/${latest.id}?adventure=${latest.theme.id}`}
                  className="inline-flex min-h-14 items-center justify-center rounded-[var(--wq-radius-button)] border-4 border-ink bg-surface px-6 text-lg font-bold text-ink shadow-[var(--wq-shadow)]"
                >
                  Continue Mission
                </Link>
              ) : null}
            </div>
            {score && score.completed === score.total ? (
              <p className="font-bold text-ink">Last mission: {score.firstTryCorrect} out of {score.total} on the first try.</p>
            ) : null}
            {error ? (
              <p role="alert" data-testid="generate-error" className="rounded-2xl border-4 border-ink bg-incorrect-surface px-4 py-3 font-bold text-incorrect">
                {error}
              </p>
            ) : null}
          </div>
          <div className="mx-auto grid w-56 justify-items-center gap-3 rounded-[2.5rem] border-4 border-ink bg-surface px-4 pt-4 pb-6 shadow-[var(--wq-shadow)]">
            <Character theme={adventure.theme} mood={busy ? 'thinking' : 'welcome'} />
          </div>
        </section>
        <section className="grid gap-3" aria-labelledby="world-heading">
          <h2 id="world-heading" className="font-display text-2xl text-ink">
            Pick your world
          </h2>
          <div className="grid gap-3 sm:grid-cols-3" role="group" aria-label="Choose your world">
            {adventures.map((item) => {
              const selected = item.id === adventure.id
              return (
                <button
                  key={item.id}
                  type="button"
                  data-testid={`theme-${item.id}`}
                  aria-pressed={selected}
                  onClick={() => chooseAdventure(item.id)}
                  style={themeToStyle(item.theme)}
                  className={`grid min-h-36 justify-items-center gap-1 rounded-[var(--wq-radius-card)] border-4 border-ink px-3 py-4 shadow-[var(--wq-shadow)] transition active:translate-y-1 active:shadow-none ${selected ? 'bg-accent text-on-accent' : 'bg-surface text-ink'}`}
                >
                  <Character theme={item.theme} mood="welcome" compact />
                  <span className="font-display text-2xl">{item.theme.character.name}</span>
                  <span className="text-sm font-bold">{item.story.lessonTitle}</span>
                </button>
              )
            })}
          </div>
        </section>
        <article className="grid gap-2 rounded-[var(--wq-radius-card)] border-4 border-ink bg-surface p-5 shadow-[var(--wq-shadow)]">
          <p className="font-bold text-muted">Grade 4 · Adding fractions with the same denominator</p>
          <h2 className="font-display text-3xl text-ink">{adventure.story.lessonTitle}</h2>
          <p className="max-w-2xl text-lg text-ink">{adventure.story.lessonDescription}</p>
        </article>
      </div>
    </ThemedScreen>
  )
}
