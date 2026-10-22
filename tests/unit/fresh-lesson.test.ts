import { describe, expect, it } from 'vitest'
import { getAdventure } from '../../src/features/lesson-library/adventures.ts'
import { buildFreshLesson } from '../../src/lib/fresh-lesson.ts'
import { checkAnswer } from '../../src/lib/answer-checker.ts'
import { taskSlides } from '../../src/schemas/lesson.schema.ts'

describe('fresh lessons', () => {
  it('always builds 10 playable questions and changes the numbers', () => {
    const adventure = getAdventure('soccer')
    const first = buildFreshLesson(adventure, 11)
    const second = buildFreshLesson(adventure, 99)
    const firstTasks = taskSlides(first)
    const secondTasks = taskSlides(second)

    expect(firstTasks).toHaveLength(10)
    expect(first.theme.character.name).toBe('Kick')
    expect(firstTasks.map((task) => task.interaction.type)).toEqual([
      'multiple-choice',
      'multiple-choice',
      'multiple-choice',
      'multiple-choice',
      'numeric-input',
      'number-line',
      'multiple-choice',
      'multiple-choice',
      'numeric-input',
      'multiple-choice',
    ])

    const typed = firstTasks[4]
    const line = firstTasks[5]
    if (typed?.interaction.type !== 'numeric-input' || line?.interaction.type !== 'number-line') {
      throw new Error('Expected a typed answer and a number line.')
    }
    expect(checkAnswer(typed.interaction, `${typed.interaction.correct.numerator}/${typed.interaction.correct.denominator}`).status).toBe('correct')
    const tick = line.interaction.correct.numerator
    expect(checkAnswer(line.interaction, String(tick)).status).toBe('correct')
    expect(firstTasks[4]?.instruction).not.toBe(secondTasks[4]?.instruction)
  })
})
