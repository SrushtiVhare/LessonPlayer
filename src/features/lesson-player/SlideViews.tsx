import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { motion, useReducedMotion } from 'framer-motion'
import { ArrowLeft, Trophy } from 'lucide-react'
import { describeFeedback } from '../../lib/grade-task.ts'
import { playSoftChime } from '../../lib/chime.ts'
import type { IntroSlide, OutroSlide, TaskSlide } from '../../schemas/lesson.schema.ts'
import type { Lesson } from '../../schemas/lesson.schema.ts'
import type { TaskState } from '../../schemas/progress.schema.ts'
import { Character } from '../../components/characters/Character.tsx'
import { FeedbackBanner } from '../../components/feedback/FeedbackBanner.tsx'
import { FractionBars } from '../../components/lesson/FractionBar.tsx'
import { InteractionHost } from '../../components/interactions/registry.tsx'
import { Confetti } from '../../components/story/Confetti.tsx'
import { TypedText } from '../../components/story/StoryScene.tsx'
import { Button } from '../../components/ui/Button.tsx'
import { scoreLesson } from '../../lib/scoring.ts'
import type { Theme } from '../../schemas/theme.schema.ts'
import type { LessonPlayerState } from './lesson-reducer.ts'
import { ReadAloudButton } from './PlayerChrome.tsx'

export function IntroView({ slide, theme, onStart, busy = false }: { slide: IntroSlide; theme: Theme; onStart: () => void; busy?: boolean }) {
  return (
    <section className="grid justify-items-center gap-5 text-center" aria-labelledby="slide-heading">
      <div className="character-float rounded-full bg-white/95 p-3 shadow-2xl ring-[6px] ring-accent">
        <Character theme={theme} mood="welcome" compact size="h-36 w-36 sm:h-44 sm:w-44" />
      </div>
      <h1 id="slide-heading" tabIndex={-1} className="on-world font-display text-5xl outline-none sm:text-6xl">
        {slide.title}
      </h1>
      <div className="grid w-full gap-3 rounded-[2rem] bg-surface p-5 text-left shadow-2xl">
        <div className="flex items-start gap-3">
          <p className="flex-1 text-xl leading-relaxed font-semibold text-ink">
            <TypedText text={slide.story} />
          </p>
          <ReadAloudButton text={slide.readAloud} large />
        </div>
        <p className="w-fit rounded-full bg-hint-surface px-4 py-1.5 font-bold text-hint">🎯 {slide.objective}</p>
      </div>
      <Button variant="accent" data-testid="start-mission" className="min-h-18 w-full text-2xl" onClick={onStart} disabled={busy}>
        {busy ? 'Writing chapter one...' : slide.startLabel}
        {busy ? null : <span className="emoji-marker" aria-hidden="true" />}
      </Button>
    </section>
  )
}

const sheetTone = {
  correct: 'bg-success-surface',
  reveal: 'bg-reveal-surface',
  hint: 'bg-hint-surface',
  incorrect: 'bg-incorrect-surface',
  invalid: 'bg-incorrect-surface',
} as const

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
  const [lastKind, setLastKind] = useState(task.feedbackKind)
  const [burst, setBurst] = useState(0)
  const [moreHelp, setMoreHelp] = useState(false)
  if (task.feedbackKind !== lastKind) {
    setLastKind(task.feedbackKind)
    if (task.feedbackKind === 'correct') setBurst((count) => count + 1)
  }

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
  const tone = feedback ? sheetTone[feedback.kind] : 'bg-surface'
  const showHint = task.hintVisible || feedback?.kind === 'hint'

  return (
    <form
      className="grid gap-4"
      aria-labelledby="slide-heading"
      onSubmit={(event) => {
        event.preventDefault()
        if (!checkDisabled) onSubmit()
      }}
    >
      {burst > 0 ? <Confetti burst={burst} /> : null}
      <div className="grid gap-5 rounded-[2rem] bg-surface p-4 shadow-2xl sm:p-6">
        <div className="flex items-start gap-3">
          <h1 id="slide-heading" tabIndex={-1} className="flex-1 font-display text-3xl leading-tight text-ink outline-none sm:text-4xl">
            {slide.instruction}
          </h1>
          <ReadAloudButton text={slide.readAloud} large />
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
        {showHint && !task.completed ? (
          <div className="grid gap-2 rounded-3xl bg-hint-surface px-4 py-3 text-hint">
            {feedback?.kind === 'hint' ? null : <p className="flex gap-2 text-lg font-bold">💡 {slide.hint}</p>}
            {slide.secondHint ? (
              moreHelp ? (
                <p className="flex gap-2 text-lg font-bold">🔎 {slide.secondHint}</p>
              ) : (
                <button type="button" className="min-h-12 justify-self-start rounded-full bg-white px-4 font-bold" onClick={() => setMoreHelp(true)}>
                  🔎 One more clue
                </button>
              )
            ) : null}
          </div>
        ) : null}
      </div>

      <div className={`sticky bottom-0 z-20 -mx-4 grid gap-3 rounded-t-[2rem] px-4 pt-4 pb-5 shadow-[0_-10px_30px_rgb(0_0_0/0.2)] transition-colors sm:mx-0 sm:rounded-[2rem] ${tone}`}>
        <FeedbackBanner feedback={feedback} />
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={onBack} disabled={!canBack} aria-label="Back" className="w-14 shrink-0 px-0">
            <ArrowLeft aria-hidden="true" className="size-7 shrink-0" strokeWidth={3} />
          </Button>
          {!task.completed ? (
            <Button variant="ghost" data-testid="hint" onClick={onHint} className="shrink-0" aria-label="Need a clue?">
              <span aria-hidden="true" className="text-2xl">
                💡
              </span>
              <span className="hidden sm:inline">Clue</span>
            </Button>
          ) : null}
          {!task.completed ? (
            <Button variant="primary" type="submit" data-testid="check-answer" disabled={checkDisabled} className="min-h-16 flex-1 text-xl uppercase">
              Check Answer
            </Button>
          ) : (
            <Button variant="accent" data-testid="next" onClick={onNext} disabled={!canNext} className="min-h-16 flex-1 text-xl">
              {nextLabel}
            </Button>
          )}
        </div>
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
    <section className="grid justify-items-center gap-5 text-center" aria-labelledby="slide-heading">
      <Confetti burst="finish" count={44} />
      <motion.div
        className="grid h-32 w-32 place-items-center rounded-full bg-accent text-on-accent shadow-2xl ring-8 ring-white/40"
        initial={reduce ? false : { scale: 0.3, rotate: -25 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 220, damping: 12 }}
      >
        <Trophy aria-hidden="true" size={64} />
      </motion.div>
      <h1 id="slide-heading" tabIndex={-1} className="on-world font-display text-4xl outline-none sm:text-5xl">
        {slide.title}
      </h1>
      <div className="flex flex-wrap justify-center gap-1" aria-hidden="true">
        {tasks.map((task, index) => (
          <motion.span key={task.id} initial={reduce ? false : { scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.3 + index * 0.1 }}>
            <Star filled={Boolean(state.tasks[task.id]?.solved)} />
          </motion.span>
        ))}
      </div>
      <div className="grid w-full gap-3 rounded-[2rem] bg-surface p-5 shadow-2xl">
        <p className="font-display text-6xl text-ink" aria-hidden="true">
          {score.firstTryCorrect}/{score.total}
        </p>
        <p className="text-xl font-extrabold text-success" data-testid="score">
          You solved {score.firstTryCorrect} out of {score.total} on your first try.
        </p>
        <p className="text-lg font-semibold text-muted">You finished {score.completed} challenges.</p>
        <p className="rounded-2xl bg-canvas px-4 py-3 text-lg font-semibold text-ink">🧠 {slide.conceptSummary}</p>
        <p className="font-display text-2xl text-ink">
          🏅 Badge earned: {slide.badgeName}
        </p>
      </div>
      <div className="grid w-full gap-3 sm:grid-cols-2">
        {confirmReplay ? (
          <div role="dialog" aria-labelledby="replay-title" className="grid gap-3 rounded-3xl bg-hint-surface p-4 text-hint sm:col-span-2">
            <h2 id="replay-title" className="font-display text-2xl">Play a new story?</h2>
            <p>Your stars from this one will reset.</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <Button variant="accent" data-testid="confirm-replay" onClick={onReplay}>
                Start over
              </Button>
              <Button variant="ghost" onClick={() => setConfirmReplay(false)}>
                Keep my stars
              </Button>
            </div>
          </div>
        ) : (
          <Button variant="accent" data-testid="play-again" className="min-h-16 text-xl" onClick={() => setConfirmReplay(true)}>
            Play Again
          </Button>
        )}
        <Link
          to="/"
          data-testid="choose-adventure"
          className="inline-flex min-h-16 items-center justify-center rounded-2xl border-2 border-b-[6px] border-black/10 bg-surface px-5 text-xl font-extrabold text-ink active:translate-y-0.5"
        >
          {hasMoreLessons ? 'Choose Another Adventure' : 'Back to Adventures'}
        </Link>
      </div>
    </section>
  )
}

function Star({ filled }: { filled: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="h-10 w-10 shrink-0 drop-shadow" aria-hidden="true">
      <path
        d="M12 2.8 14.7 8.7 21 9.4 16.4 13.8 17.6 20 12 16.9 6.4 20 7.6 13.8 3 9.4 9.3 8.7Z"
        fill={filled ? 'var(--wq-accent)' : 'rgb(255 255 255 / 0.25)'}
        stroke="#FFFFFF"
        strokeWidth="1.6"
      />
    </svg>
  )
}
