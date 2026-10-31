import { describe, expect, it } from 'vitest'
import { bundledLessons } from '../../src/features/lesson-library/catalog.ts'
import { buildTutorContext } from '../../src/lib/tutor-context.ts'
import { handleTutor } from '../../src/server/handle-tutor.ts'
import { createInitialTaskState } from '../../src/schemas/progress.schema.ts'
import type { TaskSlide } from '../../src/schemas/lesson.schema.ts'

const lesson = bundledLessons[0]!
const slide = lesson.slides.find((item): item is TaskSlide => item.id === 'identify-fraction')!

describe('tutor api', () => {
  it('answers from the lesson when no model key is set', async () => {
    const result = await handleTutor(
      { context: buildTutorContext(lesson, slide, createInitialTaskState()), action: 'hint', note: '' },
      {},
    )
    expect(result.status).toBe(200)
    if (!('reply' in result.body)) throw new Error('expected a reply')
    expect(result.body.source).toBe('lesson')
    expect(result.body.reply).not.toContain('1/4')
  })

  it('refuses a request that is not about a lesson slide', async () => {
    const result = await handleTutor({ action: 'hint' }, {})
    expect(result.status).toBe(400)
  })
})
