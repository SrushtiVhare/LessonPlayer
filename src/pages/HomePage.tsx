import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { ThemedScreen } from '../components/layout/Screens.tsx'
import { Character } from '../components/characters/Character.tsx'
import { Button } from '../components/ui/Button.tsx'
import { bundledLessons, mergeLessons } from '../features/lesson-library/catalog.ts'
import { createInitialState } from '../features/lesson-player/lesson-reducer.ts'
import { reconcileProgress } from '../lib/progress-reconcile.ts'
import { scoreLesson } from '../lib/scoring.ts'
import { readLocalProgress } from '../lib/storage.ts'
import { isSupabaseConfigured } from '../services/supabase/client.ts'
import { fetchPublishedLessons } from '../services/supabase/lessons.repository.ts'
import type { Lesson } from '../schemas/lesson.schema.ts'

export function HomePage() {
  const [lessons, setLessons] = useState<Lesson[]>(bundledLessons)
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const lesson = lessons[0]

  useEffect(() => {
    document.title = 'WonderQuest Math'
    if (!isSupabaseConfigured) return
    let cancelled = false
    void fetchPublishedLessons().then((result) => {
      if (cancelled || result.status !== 'ok') return
      setLessons(mergeLessons(bundledLessons, result.lessons))
    })
    return () => {
      cancelled = true
    }
  }, [])

  if (!lesson) {
    return (
      <div className="grid min-h-dvh place-items-center px-4">
        <h1 className="font-display text-4xl">No missions are ready yet.</h1>
      </div>
    )
  }

  return (
    <ThemedScreen theme={lesson.theme}>
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
        <div className="grid items-center gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
          <Character theme={lesson.theme} mood="welcome" />
          <div className="grid gap-4">
            <h1 className="font-display text-4xl text-ink sm:text-6xl">Hi, explorer!</h1>
            <p className="max-w-xl text-xl leading-relaxed text-ink">
              The stars broke into pieces. Want to help {lesson.theme.character.name} put them back together?
            </p>
          </div>
        </div>
        <ul className="grid gap-4">
          {lessons.map((item) => (
            <li key={item.id}>
              <LessonCard lesson={item} confirmId={confirmId} onAskReplay={() => setConfirmId(item.id)} onCancel={() => setConfirmId(null)} />
            </li>
          ))}
        </ul>
      </div>
    </ThemedScreen>
  )
}

function badgeName(lesson: Lesson): string {
  const outro = lesson.slides.find((slide) => slide.type === 'outro')
  return outro?.type === 'outro' ? outro.badgeName : 'Mission badge'
}

function LessonCard({
  lesson,
  confirmId,
  onAskReplay,
  onCancel,
}: {
  lesson: Lesson
  confirmId: string | null
  onAskReplay: () => void
  onCancel: () => void
}) {
  const read = readLocalProgress(lesson.id)
  const state = read.status === 'ok' ? reconcileProgress(lesson, read.progress).state : createInitialState(lesson)
  const score = scoreLesson(lesson, state.tasks)
  const finished = score.total > 0 && score.completed === score.total
  const started = finished || score.completed > 0 || state.slideId !== lesson.slides[0]?.id

  return (
    <article className="grid gap-4 rounded-[var(--wq-radius-card)] bg-surface p-5 shadow-[var(--wq-shadow)]">
      <p className="font-bold text-muted">Grade {lesson.grade} · {lesson.topic}</p>
      <h2 className="font-display text-3xl text-ink">{lesson.title}</h2>
      <p className="max-w-2xl text-lg text-ink">{lesson.description}</p>
      {started ? (
        <div className="grid gap-1">
          <p className="font-bold text-ink">
            {score.completed} of {score.total} challenges finished
          </p>
          <div className="h-3 overflow-hidden rounded-full bg-canvas">
            <div className="h-full bg-accent" style={{ width: `${score.total === 0 ? 0 : (score.completed / score.total) * 100}%` }} />
          </div>
          {finished ? <p className="font-bold text-ink">Badge: {badgeName(lesson)}</p> : null}
        </div>
      ) : null}
      <div className="flex flex-col gap-3 sm:flex-row">
        {finished ? (
          <>
            <Link to={`/lesson/${lesson.id}`} className="inline-flex min-h-12 items-center justify-center rounded-[var(--wq-radius-button)] bg-primary px-5 font-bold text-on-primary">
              Review Mission
            </Link>
            <Button variant="accent" onClick={onAskReplay}>
              Play Again
            </Button>
          </>
        ) : (
          <Link
            to={`/lesson/${lesson.id}`}
            data-testid="start-learning"
            className="inline-flex min-h-12 items-center justify-center rounded-[var(--wq-radius-button)] bg-accent px-5 text-lg font-bold text-on-accent"
          >
            {started ? 'Continue Mission' : 'Start Learning'}
          </Link>
        )}
      </div>
      {confirmId === lesson.id ? (
        <div role="dialog" aria-labelledby="replay-title" className="grid gap-3 rounded-2xl bg-hint-surface p-4 text-hint">
          <h3 id="replay-title" className="font-display text-2xl">
            Start again from the beginning?
          </h3>
          <p>Your stars from this mission will reset.</p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link to={`/lesson/${lesson.id}?restart=1`} className="inline-flex min-h-12 items-center justify-center rounded-[var(--wq-radius-button)] bg-accent px-5 font-bold text-on-accent">
              Start over
            </Link>
            <Button variant="ghost" onClick={onCancel}>
              Keep my stars
            </Button>
          </div>
        </div>
      ) : null}
    </article>
  )
}
