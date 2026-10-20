import type { TaskState } from '../schemas/progress.schema.ts'

export type AttemptContent = {
  response: string
}

/**
 * Incorrect attempts move 1 -> try again, 2 -> hint, 3 -> reveal and complete.
 * A correct answer does not increase the attempt count.
 * Invalid input and repeated submissions of the same response are ignored by the caller.
 */
export function applyAttempt(task: TaskState, correct: boolean, content: AttemptContent): TaskState {
  if (task.completed) return task

  if (correct) {
    const firstTryCorrect = task.attempts === 0
    return {
      ...task,
      completed: true,
      solved: true,
      firstTryCorrect,
      revealed: false,
      lastSubmittedResponse: content.response,
      feedbackKind: 'correct',
    }
  }

  const attempts = task.attempts + 1
  if (attempts >= 3) {
    return {
      ...task,
      attempts: 3,
      completed: true,
      solved: false,
      firstTryCorrect: false,
      revealed: true,
      hintVisible: true,
      lastSubmittedResponse: content.response,
      feedbackKind: 'reveal',
    }
  }

  if (attempts === 2) {
    return {
      ...task,
      attempts,
      hintVisible: true,
      lastSubmittedResponse: content.response,
      feedbackKind: 'hint',
    }
  }

  return {
    ...task,
    attempts,
    lastSubmittedResponse: content.response,
    feedbackKind: 'incorrect',
  }
}
