import { checkAnswer } from './answer-checker.ts'
import { applyAttempt } from './attempt-manager.ts'
import { COPY, revealMessage } from './copy.ts'
import type { TaskSlide } from '../schemas/lesson.schema.ts'
import type { TaskState } from '../schemas/progress.schema.ts'

export type Feedback =
  | { kind: 'invalid'; message: string }
  | { kind: 'incorrect'; message: string }
  | { kind: 'hint'; message: string; hint: string }
  | { kind: 'reveal'; message: string }
  | { kind: 'correct'; message: string; firstTry: boolean }

export function submitTask(slide: TaskSlide, task: TaskState): TaskState {
  if (task.completed) return task
  const response = task.response ?? ''
  if (response === task.lastSubmittedResponse) return task

  const verdict = checkAnswer(slide.interaction, response)
  if (verdict.status === 'invalid') {
    return {
      ...task,
      lastSubmittedResponse: response,
      feedbackKind: 'invalid',
    }
  }

  return applyAttempt(task, verdict.status === 'correct', { response })
}

export function describeFeedback(slide: TaskSlide, task: TaskState): Feedback | null {
  switch (task.feedbackKind) {
    case null:
      return null
    case 'invalid': {
      const verdict = checkAnswer(slide.interaction, task.lastSubmittedResponse ?? '')
      return {
        kind: 'invalid',
        message: verdict.status === 'invalid' ? verdict.message : 'Try that answer again.',
      }
    }
    case 'incorrect':
      return { kind: 'incorrect', message: COPY.incorrect }
    case 'hint':
      return { kind: 'hint', message: COPY.hint, hint: slide.hint }
    case 'reveal':
      return { kind: 'reveal', message: revealMessage(slide.answerLabel, slide.explanation) }
    case 'correct':
      return {
        kind: 'correct',
        message: task.firstTryCorrect ? COPY.correctFirst : COPY.correctRetry,
        firstTry: task.firstTryCorrect,
      }
    default: {
      const unreachable: never = task.feedbackKind
      return unreachable
    }
  }
}
