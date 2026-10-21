import { describe, expect, it } from 'vitest'
import { getAdventure } from '../../src/features/lesson-library/adventures.ts'
import { checkAnswer } from '../../src/lib/answer-checker.ts'
import { buildLessonPrompt, prepareGeneratedLesson, QUESTION_COUNT } from '../../src/server/prepare-lesson.ts'
import { taskSlides } from '../../src/schemas/lesson.schema.ts'

function choice(label: string, accessibleLabel: string) {
  return { id: 'temp', label, accessibleLabel }
}

function task(input: {
  kind: 'identify' | 'vocabulary' | 'add' | 'mistake'
  asks?: 'denominator' | 'numerator'
  denominator: number
  numerators: number[]
  answerNumerator: number
  instruction: string
  type?: 'multiple-choice' | 'numeric-input' | 'number-line'
  options?: { label: string; accessibleLabel: string }[]
  visual?: boolean
}) {
  const answer = `${input.answerNumerator}/${input.denominator}`
  const options = input.options ?? [
    choice(answer, `${input.answerNumerator} out of ${input.denominator}`),
    choice('1/2', '1 out of 2'),
    choice('9/2', '9 out of 2'),
  ]
  const type = input.type ?? 'multiple-choice'
  const interaction =
    type === 'numeric-input'
      ? { type, prompt: input.instruction, acceptedFormats: ['fraction', 'decimal'], allowNegative: false, correct: { numerator: 1, denominator: 99 }, placeholder: 'Type a fraction' }
      : type === 'number-line'
        ? { type, prompt: input.instruction, start: { numerator: 0, denominator: 1 }, end: { numerator: 1, denominator: 1 }, partitions: 2, correct: { numerator: 1, denominator: 99 } }
        : { type, prompt: 'wrong prompt', correctOptionId: 'nope', options }
  return {
    id: 'draft',
    type: 'task',
    instruction: input.instruction,
    hint: 'Count the equal pieces first.',
    explanation: 'Add the numerators. The denominator stays the same.',
    answerLabel: input.kind === 'vocabulary' ? 'the count' : answer,
    readAloud: input.instruction,
    visual: input.visual
      ? { type: 'fraction-bars', bars: [{ segments: input.denominator, shaded: input.answerNumerator, color: 'gold', caption: 'Equal pieces' }] }
      : undefined,
    math: {
      kind: input.kind,
      asks: input.asks,
      denominator: input.denominator,
      numerators: input.numerators,
      answerNumerator: input.answerNumerator,
    },
    interaction,
  }
}

function validDraft() {
  return {
    title: 'Piece Parade',
    description: 'Ten puzzles about adding same-size pieces.',
    objectives: ['Name a fraction.', 'Add the numerators.', 'Keep the denominator.'],
    slides: [
      { id: 'intro', type: 'intro', title: 'Piece Parade', story: 'Rex found a basket of equal pieces. Let us put them back together.', objective: 'Add fractions with the same denominator.', startLabel: 'Go', readAloud: 'Rex found a basket of equal pieces.' },
      task({ kind: 'identify', denominator: 4, numerators: [1], answerNumerator: 1, instruction: 'Which fraction matches the glowing pieces?', visual: true }),
      task({
        kind: 'vocabulary',
        asks: 'denominator',
        denominator: 4,
        numerators: [1],
        answerNumerator: 4,
        instruction: 'The bar is split into equal pieces. What does the denominator count?',
        options: [choice('4 equal pieces', '4 equal pieces'), choice('2 equal pieces', '2 equal pieces'), choice('8 equal pieces', '8 equal pieces')],
      }),
      task({
        kind: 'vocabulary',
        asks: 'numerator',
        denominator: 5,
        numerators: [2],
        answerNumerator: 2,
        instruction: 'Some pieces are shaded. What does the numerator count?',
        options: [choice('2 shaded pieces', '2 shaded pieces'), choice('5 shaded pieces', '5 shaded pieces'), choice('3 shaded pieces', '3 shaded pieces')],
      }),
      task({ kind: 'add', denominator: 5, numerators: [1, 2], answerNumerator: 3, instruction: 'What is 1/5 + 2/5?' }),
      task({ kind: 'add', denominator: 8, numerators: [2, 3], answerNumerator: 5, instruction: 'Type the sum of 2/8 and 3/8.', type: 'numeric-input' }),
      task({ kind: 'add', denominator: 6, numerators: [1, 2], answerNumerator: 3, instruction: 'Tap the mark for 1/6 + 2/6.', type: 'number-line' }),
      task({ kind: 'add', denominator: 3, numerators: [1, 1], answerNumerator: 2, instruction: 'Rex has 1/3 of a snack and finds 1/3 more. How much is that?' }),
      task({
        kind: 'mistake',
        denominator: 7,
        numerators: [1, 2],
        answerNumerator: 3,
        instruction: 'A friend added the bottoms of 1/7 and 2/7. Which answer keeps the denominator?',
        options: [choice('3/7', '3 out of 7'), choice('3/14', '3 out of 14'), choice('2/7', '2 out of 7'), choice('1/7', '1 out of 7')],
      }),
      task({ kind: 'add', denominator: 10, numerators: [1, 4], answerNumerator: 5, instruction: 'Type the sum of 1/10 and 4/10.', type: 'numeric-input' }),
      task({ kind: 'add', denominator: 9, numerators: [2, 3], answerNumerator: 5, instruction: 'What is 2/9 + 3/9?' }),
      { id: 'outro', type: 'outro', title: 'The basket is full', message: 'You put every piece back.', conceptSummary: 'Same-size pieces keep the same denominator. Add the numerators.', badgeName: 'Piece Pro', readAloud: 'You put every piece back. Add the numerators. The denominator stays the same.' },
    ],
  }
}

describe('generated lessons', () => {
  const adventure = getAdventure('dino')

  it('asks the model for 10 challenges in the chosen world', () => {
    const prompt = buildLessonPrompt(adventure, 'test-variation')
    expect(prompt).toContain('exactly 10')
    expect(prompt).toContain('Rex')
    expect(prompt).toContain('test-variation')
  })

  it('keeps a draft only when the math covers the whole idea', () => {
    const prepared = prepareGeneratedLesson(validDraft(), adventure)
    expect(prepared.ok).toBe(true)
    if (!prepared.ok) return
    const tasks = taskSlides(prepared.lesson)
    expect(tasks).toHaveLength(QUESTION_COUNT)
    expect(prepared.lesson.theme.character.name).toBe('Rex')
    expect(prepared.lesson.id).toBe('live-fractions')
    const typed = tasks[4]
    const line = tasks[5]
    const trap = tasks[7]
    if (typed?.interaction.type !== 'numeric-input' || line?.interaction.type !== 'number-line' || trap?.interaction.type !== 'multiple-choice') {
      throw new Error('Expected typed, number-line, and mistake challenges.')
    }
    expect(checkAnswer(typed.interaction, '5/8').status).toBe('correct')
    expect(checkAnswer(typed.interaction, '0.625').status).toBe('correct')
    expect(checkAnswer(line.interaction, '3').status).toBe('correct')
    expect(checkAnswer(trap.interaction, 'answer').status).toBe('correct')
    expect(checkAnswer(trap.interaction, 'choice-2').status).toBe('incorrect')
  })

  it('accepts word meanings when the pictured count is still right', () => {
    const draft = validDraft()
    draft.slides[2] = task({
      kind: 'vocabulary',
      asks: 'denominator',
      denominator: 8,
      numerators: [8],
      answerNumerator: 8,
      instruction: 'What does the denominator in a fraction tell us?',
      options: [choice('Total pieces', 'Total pieces'), choice('Color count', 'Color count'), choice('Box size', 'Box size')],
    })
    draft.slides[6] = task({
      kind: 'add',
      denominator: 5,
      numerators: [2, 2],
      answerNumerator: 4,
      instruction: 'Use the number line to find 2/5 + 2/5.',
      type: 'numeric-input',
    })
    draft.slides[8] = task({
      kind: 'mistake',
      denominator: 9,
      numerators: [2, 4],
      answerNumerator: 6,
      instruction: 'Mia added 2/9 + 4/9 and wrote 6/18. What did she do wrong?',
      options: [choice('Added denominators', 'Added denominators'), choice('Multiplied numerators', 'Multiplied numerators'), choice('Forgot the top number', 'Forgot the top number')],
    })
    const prepared = prepareGeneratedLesson(draft, adventure)
    if (!prepared.ok) throw new Error(prepared.errors.join('\n'))
    expect(prepared.ok).toBe(true)
    if (!prepared.ok) return
    const tasks = taskSlides(prepared.lesson)
    expect(tasks[5]?.interaction.type).toBe('number-line')
    expect(tasks[7]?.interaction.type).toBe('multiple-choice')
  })

  it('rejects a sum that does not add up', () => {
    const draft = validDraft()
    const broken = draft.slides[4] as { math: { kind: 'add'; denominator: number; numerators: number[]; answerNumerator: number } }
    broken.math = { kind: 'add', denominator: 5, numerators: [1, 2], answerNumerator: 4 }
    const prepared = prepareGeneratedLesson(draft, adventure)
    expect(prepared.ok).toBe(false)
  })
})
