import { describe, expect, it } from 'vitest'
import { bundledLessons } from '../../src/features/lesson-library/catalog.ts'
import { buildTutorContext } from '../../src/lib/tutor-context.ts'
import { createInitialTaskState, type TaskState } from '../../src/schemas/progress.schema.ts'
import type { TaskSlide } from '../../src/schemas/lesson.schema.ts'

const lesson = bundledLessons[0]!
const taskSlide = lesson.slides.find((slide): slide is TaskSlide => slide.id === 'identify-fraction')!

const revealed: TaskState = {
  attempts: 3,
  completed: true,
  solved: false,
  firstTryCorrect: false,
  revealed: true,
  hintVisible: true,
  response: '1/3',
  lastSubmittedResponse: '1/3',
  feedbackKind: 'reveal',
}

describe('tutor context', () => {
  it('follows the question on the screen and hides the worked solution', () => {
    const context = buildTutorContext(lesson, taskSlide, createInitialTaskState())
    expect(context.slideId).toBe('identify-fraction')
    expect(context.characterName).toBe('Astro')
    expect(context.prompt).toMatch(/which fraction matches it/i)
    expect(context.choices).toEqual(['1/4', '1/3', '4/1', '3/4'])
    expect(context.picture).toMatch(/1 glowing piece out of 4/)
    expect(context.status).toBe('new')
    expect(context.maySayAnswer).toBe(false)
    expect(context.explanation).toBeNull()
    expect(context.secretPhrases).toContain('1/4')
    expect(context.secretPhrases).toContain('1 out of 4')
  })

  it('may repeat the lesson explanation only after the answer is shown or solved', () => {
    const shown = buildTutorContext(lesson, taskSlide, revealed)
    expect(shown.status).toBe('revealed')
    expect(shown.maySayAnswer).toBe(true)
    expect(shown.explanation).toMatch(/denominator 4/)
    expect(shown.lastTry).toBe('1/3')

    const solved = buildTutorContext(lesson, taskSlide, {
      ...createInitialTaskState(),
      completed: true,
      solved: true,
      firstTryCorrect: true,
      feedbackKind: 'correct',
    })
    expect(solved.status).toBe('correct')
    expect(solved.maySayAnswer).toBe(true)
  })

  it('switches with the slide, including the story start and the ending', () => {
    const intro = lesson.slides[0]!
    const outro = lesson.slides[lesson.slides.length - 1]!
    expect(buildTutorContext(lesson, intro, undefined).status).toBe('welcome')
    expect(buildTutorContext(lesson, outro, undefined).status).toBe('done')
    expect(buildTutorContext(lesson, outro, undefined).prompt).toMatch(/fraction/i)
  })
})
