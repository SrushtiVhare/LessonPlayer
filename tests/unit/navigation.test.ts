import { describe, expect, it } from 'vitest'
import { bundledLessons } from '../../src/features/lesson-library/catalog.ts'
import {
  canGoNext,
  createInitialState,
  lessonReducer,
  type LessonPlayerState,
} from '../../src/features/lesson-player/lesson-reducer.ts'
import { chooseProgressSource, reconcileProgress } from '../../src/lib/progress-reconcile.ts'
import { readLocalProgress } from '../../src/lib/storage.ts'
import { progressLabel } from '../../src/lib/scoring.ts'
import { createInitialTaskState, type SavedProgress } from '../../src/schemas/progress.schema.ts'

const lesson = bundledLessons[0]!

function finish(state: LessonPlayerState, slideId: string, response: string): LessonPlayerState {
  const next = lessonReducer(lesson, { ...state, slideId }, { type: 'set-response', response })
  return lessonReducer(lesson, next, { type: 'submit' })
}

describe('lesson navigation', () => {
  it('locks next until the challenge is complete and keeps progress when going back', () => {
    let state = createInitialState(lesson)
    expect(canGoNext(lesson, state)).toBe(true)
    state = lessonReducer(lesson, state, { type: 'next' })
    expect(progressLabel(lesson, state.slideId)).toBe('Slide 2 of 7')
    expect(canGoNext(lesson, state)).toBe(false)
    state = finish(state, state.slideId, 'one-fourth')
    expect(state.tasks['identify-fraction']?.firstTryCorrect).toBe(true)
    expect(canGoNext(lesson, state)).toBe(true)
    state = lessonReducer(lesson, state, { type: 'next' })
    state = lessonReducer(lesson, state, { type: 'back' })
    expect(state.slideId).toBe('identify-fraction')
    expect(state.tasks['identify-fraction']?.firstTryCorrect).toBe(true)
    const before = state.tasks['identify-fraction']
    state = lessonReducer(lesson, state, { type: 'submit' })
    expect(state.tasks['identify-fraction']).toEqual(before)
  })

  it('does not open the outro or crash when next is unavailable', () => {
    let state = createInitialState(lesson)
    const stuck = lessonReducer(lesson, state, { type: 'back' })
    expect(stuck.slideId).toBe('intro')
    state = { ...state, slideId: 'outro' }
    expect(lessonReducer(lesson, state, { type: 'next' }).slideId).toBe('outro')
    state = createInitialState(lesson)
    state = { ...state, slideId: 'add-tenths' }
    expect(lessonReducer(lesson, state, { type: 'next' }).slideId).toBe('add-tenths')
  })

  it('drops stale slides and keeps finished challenges after a version change', () => {
    const saved: SavedProgress = {
      lessonId: lesson.id,
      lessonVersion: lesson.version + 1,
      slideId: 'retired-slide',
      tasks: {
        'identify-fraction': {
          ...createInitialTaskState(),
          completed: true,
          solved: true,
          firstTryCorrect: true,
          feedbackKind: 'correct',
        },
        'old-task': {
          ...createInitialTaskState(),
          completed: true,
          solved: true,
          firstTryCorrect: true,
          feedbackKind: 'correct',
        },
      },
      updatedAt: '2026-10-20T00:00:00.000Z',
    }
    const reconciled = reconcileProgress(lesson, saved)
    expect(reconciled.notice).toMatch(/updated/)
    expect(reconciled.state.tasks['identify-fraction']?.completed).toBe(true)
    expect(reconciled.state.tasks['old-task']).toBeUndefined()
    expect(reconciled.state.slideId).toBe('add-fifths')
  })

  it('chooses the newer progress source unless the child has already edited', () => {
    expect(chooseProgressSource(null, '2026-10-20T00:00:00.000Z', false)).toBe('remote')
    expect(chooseProgressSource('2026-10-20T02:00:00.000Z', '2026-10-20T01:00:00.000Z', false)).toBe('local')
    expect(chooseProgressSource('2026-10-20T01:00:00.000Z', '2026-10-20T02:00:00.000Z', true)).toBe('local')
  })

  it('rejects unreadable saved progress', () => {
    window.localStorage.setItem('wonderquest.progress.space-fractions', '{')
    expect(readLocalProgress(lesson.id).status).toBe('invalid')
  })

  it('starts fresh when saved progress is for another lesson', () => {
    const saved: SavedProgress = {
      lessonId: 'other',
      lessonVersion: 1,
      slideId: 'intro',
      tasks: {},
      updatedAt: '2026-10-20T00:00:00.000Z',
    }
    expect(reconcileProgress(lesson, saved).state.slideId).toBe('intro')
    expect(reconcileProgress(lesson, saved).notice).toBeNull()
  })
})
