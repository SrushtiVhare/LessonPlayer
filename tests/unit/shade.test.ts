import { describe, expect, it } from 'vitest'
import { checkAnswer } from '../../src/lib/answer-checker.ts'
import { interactionSchema } from '../../src/schemas/lesson.schema.ts'

const half = {
  type: 'shade' as const,
  prompt: 'Color pieces to show 1/2.',
  segments: 4,
  correct: { numerator: 1, denominator: 2 },
}

describe('tap to shade', () => {
  it('counts colored pieces, in any position, as an equal fraction', () => {
    expect(checkAnswer(half, '1100').status).toBe('correct')
    expect(checkAnswer(half, '0101').status).toBe('correct')
    expect(checkAnswer(half, '1110').status).toBe('incorrect')
  })

  it('treats nothing colored or a broken response as not an answer yet', () => {
    expect(checkAnswer(half, '0000').status).toBe('invalid')
    expect(checkAnswer(half, '').status).toBe('invalid')
    expect(checkAnswer(half, '11').status).toBe('invalid')
    expect(checkAnswer(half, '1x00').status).toBe('invalid')
  })

  it('rejects a lesson whose answer is not a whole number of pieces', () => {
    expect(interactionSchema.safeParse(half).success).toBe(true)
    expect(interactionSchema.safeParse({ ...half, segments: 5 }).success).toBe(false)
  })
})
