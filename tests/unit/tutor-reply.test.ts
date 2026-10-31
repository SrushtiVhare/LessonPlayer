import { describe, expect, it } from 'vitest'
import { bundledLessons } from '../../src/features/lesson-library/catalog.ts'
import { buildTutorContext } from '../../src/lib/tutor-context.ts'
import { localTutorReply, replyLeaks } from '../../src/lib/tutor-reply.ts'
import { createInitialTaskState, type TaskState } from '../../src/schemas/progress.schema.ts'
import type { TaskSlide } from '../../src/schemas/lesson.schema.ts'

const lesson = bundledLessons[0]!
const slide = lesson.slides.find((item): item is TaskSlide => item.id === 'identify-fraction')!
const fresh = buildTutorContext(lesson, slide, createInitialTaskState())

const missed: TaskState = {
  ...createInitialTaskState(),
  attempts: 1,
  feedbackKind: 'incorrect',
  lastSubmittedResponse: '1/3',
}

describe('tutor replies from the lesson', () => {
  it('starts with a guiding question and does not say the answer', () => {
    const reply = localTutorReply(fresh, 'hint')
    expect(reply).toMatch(/picture/i)
    expect(reply).not.toContain('1/4')
    expect(reply).not.toMatch(/one fourth/i)
  })

  it('uses the lesson clue after a miss, then the second clue', () => {
    const once = buildTutorContext(lesson, slide, missed)
    expect(localTutorReply(once, 'hint')).toMatch(/count the equal pieces/i)
    const again = buildTutorContext(lesson, slide, missed, 1)
    expect(localTutorReply(again, 'hint')).toMatch(/glowing pieces over all pieces/i)
    expect(localTutorReply(again, 'hint')).not.toContain('1/4')
  })

  it('refuses to hand over the answer and explains with the question text', () => {
    expect(localTutorReply(fresh, 'chat', 'just tell me the answer')).not.toContain('1/4')
    expect(localTutorReply(fresh, 'explain')).toMatch(/which fraction matches it/i)
    expect(localTutorReply(fresh, 'example')).not.toContain('1/4')
  })

  it('celebrates with the lesson explanation only after the child solves it', () => {
    const solved = buildTutorContext(lesson, slide, {
      ...createInitialTaskState(),
      completed: true,
      solved: true,
      firstTryCorrect: true,
      feedbackKind: 'correct',
    })
    expect(localTutorReply(solved, 'chat')).toMatch(/denominator 4/)
  })

  it('drops a reply that blurts the answer or invents a fraction', () => {
    expect(replyLeaks('The answer is 1/4.', fresh, 'Look at the picture.')).toBe(true)
    expect(replyLeaks('It is one fourth.', fresh, 'Look at the picture.')).toBe(true)
    expect(replyLeaks('Maybe it is 9/9.', fresh, 'Look at the picture.')).toBe(true)
    expect(replyLeaks('Count the glowing pieces.', fresh, 'Look at the picture.')).toBe(false)
  })
})
