import { Check, Lightbulb, RotateCcw, Sparkles } from 'lucide-react'
import type { Feedback } from '../../lib/grade-task.ts'

const styles = {
  invalid: 'bg-incorrect-surface text-incorrect',
  incorrect: 'bg-incorrect-surface text-incorrect',
  hint: 'bg-hint-surface text-hint',
  reveal: 'bg-reveal-surface text-reveal',
  correct: 'bg-success-surface text-success',
} as const

export function FeedbackBanner({ feedback }: { feedback: Feedback | null }) {
  if (!feedback) {
    return <div aria-live="polite" data-testid="feedback" className="min-h-4" />
  }
  const Icon = feedback.kind === 'correct' ? Check : feedback.kind === 'hint' ? Lightbulb : feedback.kind === 'reveal' ? Sparkles : RotateCcw
  return (
    <div aria-live="polite" data-testid="feedback" className={`feedback-pop rounded-3xl px-4 py-4 ${styles[feedback.kind]}`} role="status">
      <p className="flex items-start gap-2 text-xl font-extrabold">
        <Icon aria-hidden="true" className="mt-1 shrink-0" size={22} />
        <span>{feedback.message}</span>
      </p>
      {feedback.kind === 'correct' ? <p className="mt-1 font-display text-2xl text-accent" aria-hidden="true">★ ★ ★</p> : null}
      {feedback.kind === 'hint' ? <p className="mt-2 text-base font-semibold">{feedback.hint}</p> : null}
    </div>
  )
}
