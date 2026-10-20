import { describe, expect, it } from 'vitest'
import { applyAttempt } from '../../src/lib/attempt-manager.ts'
import { COPY, revealMessage } from '../../src/lib/copy.ts'
import { describeFeedback, submitTask } from '../../src/lib/grade-task.ts'
import { scoreLesson } from '../../src/lib/scoring.ts'
import { bundledLessons } from '../../src/features/lesson-library/catalog.ts'
import { createInitialTaskState, type TaskState } from '../../src/schemas/progress.schema.ts'
import type { TaskSlide } from '../../src/schemas/lesson.schema.ts'

const lesson = bundledLessons[0]!
const task = lesson.slides.find((slide): slide is TaskSlide => slide.type === 'task' && slide.id === 'add-fifths')!

describe('attempt thresholds', () => {
  it('shows a retry, then a hint, then the answer', () => {
    let state: TaskState = { ...createInitialTaskState(), response: 'two-fifths' }
    state = submitTask(task, state)
    expect(state.attempts).toBe(1)
    expect(state.completed).toBe(false)
    expect(describeFeedback(task, state)?.message).toBe(COPY.incorrect)

    state = { ...state, response: 'one-fifth' }
    state = submitTask(task, state)
    expect(state.attempts).toBe(2)
    expect(state.hintVisible).toBe(true)
    expect(describeFeedback(task, state)).toMatchObject({ kind: 'hint', message: COPY.hint, hint: task.hint })

    state = { ...state, response: 'three-tenths' }
    state = submitTask(task, state)
    expect(state.attempts).toBe(3)
    expect(state.completed).toBe(true)
    expect(state.solved).toBe(false)
    expect(state.revealed).toBe(true)
    expect(state.firstTryCorrect).toBe(false)
    expect(describeFeedback(task, state)?.message).toBe(revealMessage(task.answerLabel, task.explanation))
  })

  it('does not spend an attempt on a correct answer or a repeated submission', () => {
    const first = submitTask(task, { ...createInitialTaskState(), response: 'three-fifths' })
    expect(first.attempts).toBe(0)
    expect(first.firstTryCorrect).toBe(true)
    expect(first.solved).toBe(true)
    const repeated = submitTask(task, { ...first, response: 'three-fifths' })
    expect(repeated).toEqual(first)

    let retried = submitTask(task, { ...createInitialTaskState(), response: 'one-fifth' })
    retried = submitTask(task, { ...retried, response: 'three-fifths' })
    expect(retried.attempts).toBe(1)
    expect(retried.firstTryCorrect).toBe(false)
    expect(retried.solved).toBe(true)
    expect(scoreLesson(lesson, { [task.id]: retried }).firstTryCorrect).toBe(0)
  })

  it('ignores a second click on the same wrong answer', () => {
    const once = submitTask(task, { ...createInitialTaskState(), response: 'one-fifth' })
    const again = submitTask(task, once)
    expect(again.attempts).toBe(1)
  })

  it('counts first-try successes without counting revealed answers', () => {
    const tasks = Object.fromEntries(
      lesson.slides.filter((slide) => slide.type === 'task').map((slide) => [slide.id, createInitialTaskState()]),
    )
    tasks['identify-fraction'] = { ...createInitialTaskState(), completed: true, solved: true, firstTryCorrect: true, feedbackKind: 'correct' }
    tasks['add-fifths'] = { ...createInitialTaskState(), attempts: 3, completed: true, revealed: true, hintVisible: true, feedbackKind: 'reveal' }
    const score = scoreLesson(lesson, tasks)
    expect(score).toMatchObject({ total: 5, completed: 2, firstTryCorrect: 1, solved: 1 })
  })

  it('does not change a completed task when applyAttempt is called again', () => {
    const done = applyAttempt(createInitialTaskState(), true, { response: 'three-fifths' })
    expect(applyAttempt(done, false, { response: 'nope' })).toEqual(done)
  })
})
