import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { motion, useReducedMotion } from 'framer-motion'
import { describeFeedback } from '../../lib/grade-task.ts'
import { playSoftChime } from '../../lib/chime.ts'
import type { IntroSlide, OutroSlide, TaskSlide } from '../../schemas/lesson.schema.ts'
import type { Lesson } from '../../schemas/lesson.schema.ts'
import type { TaskState } from '../../schemas/progress.schema.ts'
import { FeedbackBanner } from '../../components/feedback/FeedbackBanner.tsx'
import { FractionBars } from '../../components/lesson/FractionBar.tsx'
import { InteractionHost } from '../../components/interactions/registry.tsx'
import { Button } from '../../components/ui/Button.tsx'
import { scoreLesson } from '../../lib/scoring.ts'
import type { LessonPlayerState } from './lesson-reducer.ts'

export function IntroView({ slide, onStart }: { slide: IntroSlide; onStart: () => void }) {
  return (
    <section className="grid gap-5" aria-labelledby="slide-heading">
      <h1 id="slide-heading" tabIndex={-1} className="font-display text-4xl text-ink outline-none sm:text-5xl">
        {slide.title}
      </h1>
      <p className="text-xl leading-relaxed text-ink">{slide.story}</p>
      <p className="rounded-[var(--wq-radius-card)] bg-surface px-4 py-3 text-lg font-bold text-ink shadow-[var(--wq-shadow)]">
        Today's mission: {slide.objective}
      </p>
      <Button variant="accent" data-testid="start-mission" onClick={onStart}>
        {slide.startLabel}
      </Button>
    </section>
  )
}

export function TaskView({
  lesson,
  slide,
  task,
  soundEnabled,
  onChange,
  onSubmit,
  onHint,
  onBack,
  onNext,
  canBack,
  canNext,
  nextLabel,
}: {
  lesson: Lesson
  slide: TaskSlide
  task: TaskState
  soundEnabled: boolean
  onChange: (value: string | null) => void
  onSubmit: () => void
  onHint: () => void
  onBack: () => void
  onNext: () => void
  canBack: boolean
  canNext: boolean
  nextLabel: string
}) {
  const feedback = describeFeedback(slide, task)
  const previous = useRef(task.feedbackKind)
  useEffect(() => {
    if (previous.current !== 'correct' && task.feedbackKind === 'correct' && soundEnabled && lesson.theme.sound.celebration) {
      try {
        playSoftChime()
      } catch {
        // Browsers can block audio. The visual celebration still works.
      }
    }
    previous.current = task.feedbackKind
  }, [lesson.theme.sound.celebration, soundEnabled, task.feedbackKind])

  const checkDisabled =
    task.lastSubmittedResponse !== null && task.response === task.lastSubmittedResponse

  return (
    <form
      className="grid gap-5"
      aria-labelledby="slide-heading"
      onSubmit={(event) => {
        event.preventDefault()
        if (!checkDisabled) onSubmit()
      }}
    >
      <div className="grid gap-2">
        <h1 id="slide-heading" tabIndex={-1} className="font-display text-3xl text-ink outline-none sm:text-4xl">
          {slide.instruction}
        </h1>
        {slide.supportingText ? <p className="text-lg text-muted">{slide.supportingText}</p> : null}
      </div>
      {slide.visual ? <FractionBars visual={slide.visual} /> : null}
      <InteractionHost
        interaction={slide.interaction}
        name={slide.id}
        value={task.response}
        disabled={task.completed}
        revealed={task.revealed}
        onChange={onChange}
      />
      <FeedbackBanner feedback={feedback} />
      {task.hintVisible && feedback?.kind !== 'hint' ? (
        <p className="rounded-2xl bg-hint-surface px-4 py-3 font-semibold text-hint">{slide.hint}</p>
      ) : null}
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <Button variant="ghost" onClick={onBack} disabled={!canBack}>
          Back
        </Button>
        <Button variant="ghost" data-testid="hint" onClick={onHint}>
          Need a clue?
        </Button>
        {!task.completed ? (
          <Button variant="primary" type="submit" data-testid="check-answer" disabled={checkDisabled}>
            Check Answer
          </Button>
        ) : null}
        <Button variant="accent" data-testid="next" onClick={onNext} disabled={!canNext}>
          {nextLabel}
        </Button>
      </div>
    </form>
  )
}

export function OutroView({
  lesson,
  slide,
  state,
  hasMoreLessons,
  onReplay,
}: {
  lesson: Lesson
  slide: OutroSlide
  state: LessonPlayerState
  hasMoreLessons: boolean
  onReplay: () => void
}) {
  const reduce = useReducedMotion()
  const [confirmReplay, setConfirmReplay] = useState(false)
  const score = scoreLesson(lesson, state.tasks)
  const tasks = lesson.slides.filter((item) => item.type === 'task')
  return (
    <section className="grid gap-5" aria-labelledby="slide-heading">
      <Celebration reduce={Boolean(reduce)} style={lesson.theme.celebration.style} />
      <h1 id="slide-heading" tabIndex={-1} className="font-display text-4xl text-ink outline-none sm:text-5xl">
        {slide.title}
      </h1>
      <p className="text-xl text-ink">{slide.message}</p>
      <p className="rounded-[var(--wq-radius-card)] bg-surface px-4 py-4 text-lg font-bold text-ink shadow-[var(--wq-shadow)]" data-testid="score">
        You solved {score.firstTryCorrect} out of {score.total} on your first try.
      </p>
      <p className="text-lg font-semibold text-ink">You finished {score.completed} challenges.</p>
      <ul className="grid gap-2">
        {tasks.map((task, index) => {
          const result = state.tasks[task.id]
          const label = result?.firstTryCorrect ? 'Solved on your own' : result?.solved ? 'Solved with practice' : 'Finished together'
          return (
            <li key={task.id} className="flex items-center gap-3 rounded-2xl bg-surface px-3 py-2 font-semibold text-ink">
              <Star filled={Boolean(result?.solved)} />
              <span>
                Challenge {index + 1}: {label}
              </span>
            </li>
          )
        })}
      </ul>
      <p className="text-lg leading-relaxed text-ink">{slide.conceptSummary}</p>
      <p className="font-display text-2xl text-ink">Badge earned: {slide.badgeName}</p>
      <div className="flex flex-col gap-3 sm:flex-row">
        {confirmReplay ? (
          <div role="dialog" aria-labelledby="replay-title" className="grid gap-3 rounded-2xl bg-hint-surface p-4 text-hint">
            <h2 id="replay-title" className="font-display text-2xl">Start again from the beginning?</h2>
            <p>Your stars from this mission will reset.</p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button variant="accent" data-testid="confirm-replay" onClick={onReplay}>
                Start over
              </Button>
              <Button variant="ghost" onClick={() => setConfirmReplay(false)}>
                Keep my stars
              </Button>
            </div>
          </div>
        ) : (
          <Button variant="accent" data-testid="play-again" onClick={() => setConfirmReplay(true)}>
            Play Again
          </Button>
        )}
        <Link
          to="/"
          data-testid="choose-adventure"
          className="inline-flex min-h-12 items-center justify-center rounded-[var(--wq-radius-button)] bg-surface px-5 py-3 text-lg font-bold text-ink shadow-[var(--wq-shadow)]"
        >
          {hasMoreLessons ? 'Choose Another Adventure' : 'Back to Adventures'}
        </Link>
      </div>
    </section>
  )
}

function Star({ filled }: { filled: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7 shrink-0" aria-hidden="true">
      <path
        d="M12 2.8 14.7 8.7 21 9.4 16.4 13.8 17.6 20 12 16.9 6.4 20 7.6 13.8 3 9.4 9.3 8.7Z"
        fill={filled ? 'var(--wq-accent)' : 'transparent'}
        stroke="var(--wq-text)"
        strokeWidth="1.6"
      />
    </svg>
  )
}

function Celebration({ reduce, style }: { reduce: boolean; style: 'stars' | 'confetti' }) {
  if (reduce) return <p className="font-display text-2xl text-ink">Mission complete</p>
  const pieces = style === 'confetti' ? ['#E6B325', '#2A5BD7', '#3C3489', '#0D6A36'] : ['#E6B325', '#E6B325', '#2A5BD7', '#FFFFFF']
  return (
    <motion.div className="flex h-16 items-end justify-center gap-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} aria-hidden="true">
      {pieces.map((color, index) => (
        <motion.span
          key={`${color}-${index}`}
          className="block h-4 w-4 rounded-full"
          style={{ background: color }}
          initial={{ y: 12 }}
          animate={{ y: [12, -18, 0] }}
          transition={{ duration: 0.8, delay: index * 0.08 }}
        />
      ))}
    </motion.div>
  )
}
