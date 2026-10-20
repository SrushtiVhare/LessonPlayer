import { useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router'
import { motion, useReducedMotion } from 'framer-motion'
import { characterMood } from '../../components/characters/mood.ts'
import { Character } from '../../components/characters/Character.tsx'
import { MissionProgress } from '../../components/progress/MissionProgress.tsx'
import { progressLabel, scoreLesson } from '../../lib/scoring.ts'
import { getSlide, canGoBack, canGoNext } from './lesson-reducer.ts'
import { useSoundPreference } from '../../hooks/useSoundPreference.ts'
import { AdventuresLink, SaveStatus, SoundControls } from './PlayerChrome.tsx'
import { IntroView, OutroView, TaskView } from './SlideViews.tsx'
import { useLessonSession } from './useLessonSession.ts'
import type { Lesson } from '../../schemas/lesson.schema.ts'

export function LessonPlayer({ lesson, hasMoreLessons }: { lesson: Lesson; hasMoreLessons: boolean }) {
  const session = useLessonSession(lesson)
  const [searchParams, setSearchParams] = useSearchParams()
  const sound = useSoundPreference()
  const reduceMotion = useReducedMotion()
  const slide = getSlide(lesson, session.state.slideId) ?? lesson.slides[0]
  const headingRef = useRef<HTMLDivElement>(null)
  const score = scoreLesson(lesson, session.state.tasks)
  const label = progressLabel(lesson, slide?.id ?? '')

  useEffect(() => {
    document.title = `${lesson.title} · WonderQuest Math`
  }, [lesson.title])

  useEffect(() => {
    if (searchParams.get('restart') === '1') {
      setSearchParams({}, { replace: true })
    }
  }, [searchParams, setSearchParams])

  useEffect(() => {
    headingRef.current?.querySelector('h1')?.focus()
  }, [slide?.id])

  if (!slide) return null
  const task = slide.type === 'task' ? session.state.tasks[slide.id] : undefined
  const mood = characterMood(slide.type, task?.feedbackKind ?? null)
  const readAloud = slide.readAloud
  const nextIsOutro = lesson.slides[lesson.slides.findIndex((item) => item.id === slide.id) + 1]?.type === 'outro'

  return (
    <div className="mx-auto grid w-full max-w-5xl gap-6 px-4 py-5 sm:px-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <AdventuresLink />
        <SaveStatus status={session.syncStatus} />
        <SoundControls text={readAloud} enabled={sound.enabled} onToggle={sound.toggle} />
      </header>
      <MissionProgress label={label} completed={score.completed} total={score.total} />
      {session.notice ? (
        <div className="flex items-start justify-between gap-3 rounded-2xl bg-surface px-4 py-3 text-ink shadow-[var(--wq-shadow)]" role="status">
          <p>{session.notice}</p>
          <button type="button" className="min-h-12 font-bold" onClick={session.dismissNotice}>
            OK
          </button>
        </div>
      ) : null}
      <div className="grid items-start gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
        <Character theme={lesson.theme} mood={mood} />
        <motion.div
          key={slide.id}
          ref={headingRef}
          className="rounded-[var(--wq-radius-card)] bg-white/80 p-4 shadow-[var(--wq-shadow)] sm:p-6"
          initial={reduceMotion ? false : { opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={reduceMotion ? { duration: 0 } : { duration: 0.35 }}
        >
          {slide.type === 'intro' ? <IntroView slide={slide} onStart={() => session.dispatch({ type: 'next' })} /> : null}
          {slide.type === 'task' && task ? (
            <TaskView
              lesson={lesson}
              slide={slide}
              task={task}
              soundEnabled={sound.enabled}
              canBack={canGoBack(lesson, session.state)}
              canNext={canGoNext(lesson, session.state)}
              nextLabel={nextIsOutro ? 'Finish Mission' : 'Next'}
              onChange={(response) => session.dispatch({ type: 'set-response', response })}
              onSubmit={() => session.dispatch({ type: 'submit' })}
              onHint={() => session.dispatch({ type: 'show-hint' })}
              onBack={() => session.dispatch({ type: 'back' })}
              onNext={() => session.dispatch({ type: 'next' })}
            />
          ) : null}
          {slide.type === 'outro' ? (
            <OutroView
              lesson={lesson}
              slide={slide}
              state={session.state}
              hasMoreLessons={hasMoreLessons}
              onReplay={() => session.dispatch({ type: 'restart' })}
            />
          ) : null}
        </motion.div>
      </div>
    </div>
  )
}
