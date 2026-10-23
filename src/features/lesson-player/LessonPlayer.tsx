import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router'
import { motion, useReducedMotion } from 'framer-motion'
import { characterMood } from '../../components/characters/mood.ts'
import { MissionProgress } from '../../components/progress/MissionProgress.tsx'
import { StoryScene } from '../../components/story/StoryScene.tsx'
import { progressLabel, scoreLesson } from '../../lib/scoring.ts'
import { swapTask, usedFromLesson } from '../../lib/fresh-lesson.ts'
import { requestNextQuestion, type NextOutcome } from '../../lib/next-question.ts'
import { LIVE_LESSON_ID } from '../../server/prepare-lesson.ts'
import { getSlide, canGoBack, canGoNext } from './lesson-reducer.ts'
import { useSoundPreference } from '../../hooks/useSoundPreference.ts'
import { AdventuresLink, SaveStatus, SoundToggle } from './PlayerChrome.tsx'
import { IntroView, OutroView, TaskView } from './SlideViews.tsx'
import { useLessonSession } from './useLessonSession.ts'
import { taskSlides, type Lesson } from '../../schemas/lesson.schema.ts'

export function LessonPlayer({ lesson, hasMoreLessons }: { lesson: Lesson; hasMoreLessons: boolean }) {
  const [liveLesson, setLiveLesson] = useState(lesson)
  const [trackedLesson, setTrackedLesson] = useState(lesson)
  const applied = useRef(new Set<string>())
  const inflight = useRef(new Map<string, Promise<void>>())
  const round = useRef(0)
  if (lesson !== trackedLesson) {
    setTrackedLesson(lesson)
    setLiveLesson(lesson)
  }
  const session = useLessonSession(liveLesson)
  const [searchParams, setSearchParams] = useSearchParams()
  const [waiting, setWaiting] = useState(false)
  const [replays, setReplays] = useState(0)
  const sound = useSoundPreference()
  const reduceMotion = useReducedMotion()
  const slide = getSlide(liveLesson, session.state.slideId) ?? liveLesson.slides[0]
  const headingRef = useRef<HTMLDivElement>(null)
  const score = scoreLesson(liveLesson, session.state.tasks)
  const label = progressLabel(liveLesson, slide?.id ?? '')
  const dynamic = liveLesson.id === LIVE_LESSON_ID
  const slideIdRef = useRef(slide?.id)
  const lessonRef = useRef(liveLesson)

  useEffect(() => {
    slideIdRef.current = slide?.id
    lessonRef.current = liveLesson
  }, [liveLesson, slide?.id])

  useEffect(() => {
    applied.current = new Set()
    inflight.current = new Map()
    round.current += 1
  }, [trackedLesson])

  useEffect(() => {
    document.title = `${liveLesson.title} · WonderQuest Math`
  }, [liveLesson.title])

  useEffect(() => {
    if (searchParams.get('restart') === '1') {
      setSearchParams({}, { replace: true })
    }
  }, [searchParams, setSearchParams])

  useEffect(() => {
    headingRef.current?.querySelector('h1')?.focus()
  }, [slide?.id])

  function startPrefetch(step: number, slideId: string, outcome: NextOutcome): Promise<void> {
    const existing = inflight.current.get(slideId)
    if (existing) return existing
    if (applied.current.has(slideId)) return Promise.resolve()
    const ticket = round.current
    const source = lessonRef.current
    const job = requestNextQuestion({
      adventureId: source.theme.id,
      step,
      slideId,
      used: usedFromLesson(source),
      previous: source.slides.flatMap((item) => (item.type === 'task' && item.story && item.id !== slideId ? [item.story] : [])).slice(0, step - 1),
      outcome,
    })
      .then((raw) => {
        if (ticket !== round.current) return
        if (slideIdRef.current === slideId) return
        setLiveLesson((current) => {
          const nextLesson = swapTask(current, slideId, raw)
          if (nextLesson !== current) applied.current.add(slideId)
          return nextLesson
        })
      })
      .finally(() => {
        if (inflight.current.get(slideId) === job) inflight.current.delete(slideId)
      })
    inflight.current.set(slideId, job)
    return job
  }

  const task = slide?.type === 'task' ? session.state.tasks[slide.id] : undefined
  const slideIndex = slide ? liveLesson.slides.findIndex((item) => item.id === slide.id) : -1
  const before = liveLesson.slides[slideIndex - 1]
  const lastDone = before?.type === 'task' ? session.state.tasks[before.id] : undefined
  const outcome: NextOutcome = !lastDone?.completed
    ? 'first-try'
    : lastDone.revealed
      ? 'revealed'
      : lastDone.firstTryCorrect
        ? 'first-try'
        : 'practice'

  useEffect(() => {
    if (!dynamic || !slide) return
    const next = liveLesson.slides[slideIndex + 1]
    if (!next || next.type !== 'task' || applied.current.has(next.id) || session.state.tasks[next.id]?.completed) return
    if (slide.type === 'intro' && replays === 0) return
    void startPrefetch(slideIndex + 1, next.id, outcome)
  }, [dynamic, liveLesson, outcome, replays, session.state.tasks, slide, slideIndex])

  async function goNext() {
    if (!slide) return
    const index = liveLesson.slides.findIndex((item) => item.id === slide.id)
    const next = liveLesson.slides[index + 1]
    const needsFresh =
      dynamic &&
      next?.type === 'task' &&
      (slide.type !== 'intro' || replays > 0) &&
      !session.state.tasks[next.id]?.completed &&
      !applied.current.has(next.id)
    if (needsFresh) {
      setWaiting(true)
      await Promise.race([startPrefetch(index + 1, next.id, outcome), new Promise((resolve) => window.setTimeout(resolve, 2500))])
      setWaiting(false)
    }
    session.dispatch({ type: 'next' })
  }

  if (!slide) return null
  const mood = characterMood(slide.type, task?.feedbackKind ?? null)
  const tasks = taskSlides(liveLesson)
  const nextIsOutro = liveLesson.slides[liveLesson.slides.findIndex((item) => item.id === slide.id) + 1]?.type === 'outro'
  const chapterNumber = slide.type === 'task' ? tasks.findIndex((item) => item.id === slide.id) + 1 : 0
  let streak = 0
  for (const item of tasks) {
    const result = session.state.tasks[item.id]
    if (!result?.completed) break
    streak = result.firstTryCorrect ? streak + 1 : 0
  }
  const speech =
    task?.feedbackKind === 'correct' && dynamic && !nextIsOutro
      ? `${liveLesson.theme.phrases.celebrate} A new chapter is coming!`
      : mood === 'thinking' && slide.type === 'task' && slide.supportingText
        ? slide.supportingText
        : liveLesson.theme.phrases[mood]

  return (
    <div className="mx-auto grid w-full max-w-3xl gap-4 px-4 pt-4 pb-2 sm:px-6">
      <header className="flex items-start gap-3">
        <AdventuresLink />
        <MissionProgress
          label={label}
          completed={score.completed}
          total={score.total}
          position={slideIndex / Math.max(1, liveLesson.slides.length - 1)}
          stars={score.solved}
          streak={streak}
        />
        <div className="flex items-center gap-2">
          <SaveStatus status={session.syncStatus} />
          <SoundToggle enabled={sound.enabled} onToggle={sound.toggle} />
        </div>
      </header>
      {session.notice ? (
        <div className="flex items-start justify-between gap-3 rounded-3xl bg-surface px-4 py-3 text-ink shadow-[var(--wq-shadow)]" role="status">
          <p>{session.notice}</p>
          <button type="button" className="min-h-12 font-bold" onClick={session.dismissNotice}>
            OK
          </button>
        </div>
      ) : null}
      <motion.div
        key={slide.id}
        ref={headingRef}
        className="grid gap-4"
        initial={reduceMotion ? false : { opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={reduceMotion ? { duration: 0 } : { duration: 0.3 }}
      >
        {slide.type === 'intro' ? <IntroView slide={slide} theme={liveLesson.theme} busy={waiting} onStart={() => void goNext()} /> : null}
        {slide.type === 'task' && task ? (
          <>
            <StoryScene
              theme={liveLesson.theme}
              mood={mood}
              chapterLabel={`Chapter ${chapterNumber}`}
              chapterTitle={slide.chapterTitle}
              story={slide.story}
              speech={speech}
            />
            <TaskView
              lesson={liveLesson}
              slide={slide}
              task={task}
              soundEnabled={sound.enabled}
              canBack={canGoBack(liveLesson, session.state)}
              canNext={canGoNext(liveLesson, session.state) && !waiting}
              nextLabel={waiting ? 'Writing next chapter...' : nextIsOutro ? 'Finish Mission' : 'Next'}
              onChange={(response) => session.dispatch({ type: 'set-response', response })}
              onSubmit={() => session.dispatch({ type: 'submit' })}
              onHint={() => session.dispatch({ type: 'show-hint' })}
              onBack={() => session.dispatch({ type: 'back' })}
              onNext={() => void goNext()}
            />
          </>
        ) : null}
        {slide.type === 'outro' ? (
          <OutroView
            lesson={liveLesson}
            slide={slide}
            state={session.state}
            hasMoreLessons={hasMoreLessons}
            onReplay={() => {
              round.current += 1
              applied.current.clear()
              inflight.current.clear()
              setReplays((count) => count + 1)
              session.dispatch({ type: 'restart' })
            }}
          />
        ) : null}
      </motion.div>
    </div>
  )
}
