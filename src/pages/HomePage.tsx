import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { motion, useReducedMotion } from 'framer-motion'
import { Cloud, Play, Star } from 'lucide-react'
import { ThemedScreen } from '../components/layout/Screens.tsx'
import { Character } from '../components/characters/Character.tsx'
import { StoryPath } from '../components/story/StoryPath.tsx'
import { themeToStyle } from '../components/theme/theme-style.ts'
import { adventures, getAdventure } from '../features/lesson-library/adventures.ts'
import { extraLessons } from '../features/lesson-library/catalog.ts'
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
  const reduce = useReducedMotion()
  const [adventureId, setAdventureId] = useState(() => readAdventureId() ?? 'space')
  const [busy, setBusy] = useState(false)
  const adventure = getAdventure(adventureId)
  const latest = readCachedLesson(readLatestLessonId() ?? '')
  const progress = latest ? readLocalProgress(latest.id) : null
  const state = latest && progress?.status === 'ok' ? reconcileProgress(latest, progress.progress).state : latest ? createInitialState(latest) : null
  const score = latest && state ? scoreLesson(latest, state.tasks) : null
  const unfinished = Boolean(score && score.completed > 0 && score.completed < score.total)
  const pathMatchesWorld = Boolean(latest && latest.theme.id === adventure.id && unfinished)
  function chooseAdventure(id: string) {
    const next = getAdventure(id)
    setAdventureId(next.id)
    writeAdventureId(next.id)
  }

  async function startFresh() {
    setBusy(true)
    const result = await requestGeneratedLesson(adventure.id)
    setBusy(false)
    if (!result.ok) return
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
      <div className="mx-auto grid w-full max-w-5xl gap-8 px-4 pt-5 pb-28 sm:px-6">
        <header className="flex items-center justify-between gap-3">
          <p className="on-world font-display text-3xl leading-none">
            <span className="emoji-marker mr-1" aria-hidden="true" />
            WonderQuest
          </p>
          <div className="flex items-center gap-2">
            {score ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-surface px-3 py-1.5 font-display text-xl text-ink shadow-lg">
                <Star aria-hidden="true" size={22} fill="var(--wq-accent)" stroke="var(--wq-accent)" />
                {score.solved}
                <span className="sr-only">stars from your last story</span>
              </span>
            ) : null}
            <p data-testid="save-status" className="on-world inline-flex items-center" title="Saved on this device">
              <Cloud aria-hidden="true" size={24} />
              <span className="sr-only">Saved on this device</span>
            </p>
          </div>
        </header>

        <section className="grid items-center gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="order-2 grid gap-5 text-center lg:order-1 lg:text-left">
            <h1 className="on-world font-display text-6xl leading-none sm:text-7xl">{adventure.story.welcomeTitle}</h1>
            <p className="mx-auto max-w-xl rounded-3xl bg-white/90 px-5 py-3 text-xl leading-relaxed font-bold text-ink shadow-lg lg:mx-0">{adventure.story.welcomeBody}</p>
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center lg:justify-start">
              <button
                type="button"
                data-testid="start-learning"
                className={`inline-flex min-h-20 items-center justify-center gap-3 rounded-3xl border-b-8 border-black/25 bg-accent px-10 font-display text-3xl text-on-accent transition active:translate-y-1 active:border-b-2 disabled:opacity-80 ${busy ? '' : 'pulse-ring'}`}
                disabled={busy}
                onClick={() => void startFresh()}
              >
                <Play aria-hidden="true" size={30} fill="currentColor" />
                {busy ? 'Writing your story...' : 'Start Learning'}
              </button>
              {unfinished && latest ? (
                <Link
                  to={`/lesson/${latest.id}?adventure=${latest.theme.id}`}
                  className="inline-flex min-h-20 items-center justify-center rounded-3xl border-b-8 border-black/15 bg-surface px-8 font-display text-2xl text-ink active:translate-y-1"
                >
                  Continue Mission
                </Link>
              ) : null}
            </div>
            {score && score.completed === score.total ? (
              <p className="on-world text-lg font-bold">Last story: {score.firstTryCorrect} out of {score.total} on the first try ⭐</p>
            ) : null}
          </div>
          <div className="order-1 grid justify-items-center gap-3 lg:order-2">
            <motion.div
              className="rounded-full bg-white/95 p-4 shadow-2xl ring-8 ring-accent"
              animate={reduce ? undefined : { y: [0, -12, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <Character theme={adventure.theme} mood={busy ? 'thinking' : 'welcome'} compact size="h-40 w-40 sm:h-56 sm:w-56" />
            </motion.div>
            <p className="rounded-full bg-surface px-5 py-2 font-display text-xl text-ink shadow-lg">
              <span className="sr-only">{adventure.theme.character.name} says: </span>
              {adventure.theme.phrases.welcome}
            </p>
          </div>
        </section>

        <section className="grid gap-3" aria-labelledby="world-heading">
          <h2 id="world-heading" className="on-world font-display text-3xl">
            Pick your world
          </h2>
          <div className="grid grid-cols-3 gap-3 sm:gap-4" role="group" aria-label="Choose your world">
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
                  className={`relative grid justify-items-center gap-1 rounded-[2rem] border-b-8 px-2 pt-4 pb-3 transition active:translate-y-1 active:border-b-2 ${
                    selected ? 'border-black/25 bg-accent text-on-accent ring-4 ring-white' : 'wiggle-hover border-black/10 bg-surface text-ink hover:-translate-y-1'
                  }`}
                >
                  <span className="absolute top-2 right-3 text-3xl" aria-hidden="true">
                    {item.theme.character.emoji}
                  </span>
                  <Character theme={item.theme} mood="welcome" compact size="h-20 w-20 sm:h-24 sm:w-24" />
                  <span className="font-display text-2xl">{item.theme.character.name}</span>
                  <span className="hidden text-sm font-bold sm:block">{item.story.lessonTitle}</span>
                </button>
              )
            })}
          </div>
        </section>

        {extraLessons.length > 0 ? (
          <section className="grid gap-3" aria-labelledby="more-heading">
            <h2 id="more-heading" className="on-world font-display text-3xl">
              More lessons
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {extraLessons.map((lesson) => (
                <Link
                  key={lesson.id}
                  to={`/lesson/${lesson.id}`}
                  data-testid={`lesson-${lesson.id}`}
                  className="flex min-h-20 items-center gap-4 rounded-[2rem] border-b-8 border-black/10 bg-surface px-5 py-3 text-ink transition active:translate-y-1 active:border-b-2"
                >
                  <span className="text-4xl" aria-hidden="true">
                    {lesson.theme.character.emoji ?? '⭐'}
                  </span>
                  <span className="grid">
                    <span className="font-display text-2xl">{lesson.title}</span>
                    <span className="text-sm font-bold text-muted">{lesson.topic}</span>
                  </span>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        <section className="grid items-center gap-4 rounded-[2.5rem] bg-surface p-5 shadow-2xl md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <article className="grid gap-2">
            <p className="font-bold text-muted">Grade 4 · Adding fractions with the same denominator</p>
            <h2 className="font-display text-4xl text-ink">{adventure.story.lessonTitle}</h2>
            <p className="text-lg text-ink">{adventure.story.lessonDescription}</p>
          </article>
          <StoryPath
            total={pathMatchesWorld && score ? score.total : QUESTION_COUNT}
            completed={pathMatchesWorld && score ? score.completed : 0}
            solved={pathMatchesWorld && score ? score.solved : 0}
          />
        </section>
      </div>
    </ThemedScreen>
  )
}
