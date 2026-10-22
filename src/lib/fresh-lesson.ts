import { rationalsEqual, type Rational } from './rational.ts'
import { parseLesson, type Lesson } from '../schemas/lesson.schema.ts'
import type { Adventure } from '../schemas/adventure.schema.ts'
import { LIVE_LESSON_ID } from '../server/prepare-lesson.ts'

type Problem = { denominator: number; parts: number[] }

function randomFrom(seed: number) {
  let state = seed >>> 0
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0
    return state / 4294967296
  }
}

function pieceName(adventureId: string): string {
  if (adventureId === 'dino') return 'egg'
  if (adventureId === 'soccer') return 'ball'
  return 'star'
}

function piecePhrase(adventureId: string): string {
  if (adventureId === 'dino') return 'an egg'
  if (adventureId === 'soccer') return 'a ball'
  return 'a star'
}

function pickAdd(random: () => number, used: Set<string>): Problem {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    const denominator = 3 + Math.floor(random() * 8)
    const first = 1 + Math.floor(random() * Math.max(1, denominator - 2))
    const second = 1 + Math.floor(random() * Math.max(1, denominator - first))
    const parts = [first, second].sort((left, right) => left - right)
    const signature = `${denominator}:${parts.join('+')}`
    if (parts[0]! + parts[1]! > denominator || used.has(signature)) continue
    used.add(signature)
    return { denominator, parts }
  }
  used.add('4:1+1')
  return { denominator: 4, parts: [1, 1] }
}

function same(left: Rational, right: Rational): boolean {
  return rationalsEqual(left, right)
}

function choices(numerator: number, denominator: number, random: () => number) {
  const candidates: Rational[] = [
    { numerator, denominator },
    { numerator, denominator: denominator * 2 },
    { numerator: Math.max(1, numerator - 1), denominator },
    { numerator: numerator + 1, denominator: denominator + 1 },
  ]
  const unique: Rational[] = []
  for (const candidate of candidates) {
    if (unique.some((item) => same(item, candidate))) continue
    unique.push(candidate)
  }
  const ordered = unique
    .map((item) => ({ item, sort: random() }))
    .sort((left, right) => left.sort - right.sort)
    .map((entry) => entry.item)
  return {
    type: 'multiple-choice' as const,
    prompt: '',
    correctOptionId: 'answer',
    options: ordered.slice(0, 4).map((item, index) => ({
      id: same(item, { numerator, denominator }) ? 'answer' : `choice-${index + 1}`,
      label: `${item.numerator}/${item.denominator}`,
      accessibleLabel: `${item.numerator} out of ${item.denominator}`,
    })),
  }
}

function taskShell(input: {
  index: number
  instruction: string
  supportingText: string
  hint: string
  explanation: string
  answerLabel: string
  interaction: Record<string, unknown>
  visual?: Record<string, unknown>
}) {
  return {
    id: `q${input.index}`,
    type: 'task',
    instruction: input.instruction,
    supportingText: input.supportingText,
    hint: input.hint,
    explanation: input.explanation,
    answerLabel: input.answerLabel,
    readAloud: input.instruction,
    visual: input.visual,
    interaction: { ...input.interaction, prompt: input.instruction },
  }
}

/** A new 10-question mission. The numbers change with the seed, and the math is already checked. */
export function buildFreshLesson(adventure: Adventure, seed: number): Lesson {
  const random = randomFrom(seed)
  const name = adventure.theme.character.name
  const thing = pieceName(adventure.id)
  const phrase = piecePhrase(adventure.id)
  const used = new Set<string>()
  const identifyDenominator = 4 + Math.floor(random() * 6)
  const identifyShaded = 1 + Math.floor(random() * (identifyDenominator - 1))
  const vocabDenominator = 3 + Math.floor(random() * 6)
  const vocabShaded = 1 + Math.floor(random() * vocabDenominator)
  const adds = Array.from({ length: 7 }, () => pickAdd(random, used))
  const [mc, typed, line, word, mistake, typedAgain, final] = adds
  if (!mc || !typed || !line || !word || !mistake || !typedAgain || !final) {
    throw new Error('A fresh mission needs seven addition puzzles.')
  }

  const sum = (problem: Problem) => problem.parts[0]! + problem.parts[1]!
  const show = (problem: Problem) => `${problem.parts[0]}/${problem.denominator} + ${problem.parts[1]}/${problem.denominator}`
  const bar = (segments: number, shaded: number, caption: string) => ({
    type: 'fraction-bars',
    bars: [{ segments, shaded, color: 'gold', caption }],
  })

  const slides = [
    {
      id: 'intro',
      type: 'intro',
      title: adventure.story.lessonTitle,
      story: adventure.story.introStory,
      objective: adventure.story.objective,
      startLabel: 'Start Mission',
      readAloud: adventure.story.introReadAloud,
    },
    taskShell({
      index: 1,
      instruction: `Which fraction matches the glowing ${thing} pieces?`,
      supportingText: `The ${thing} is split into equal pieces.`,
      hint: 'Count every equal piece first. That number is the denominator.',
      explanation: `There are ${identifyDenominator} equal pieces, and ${identifyShaded} of them are glowing. That is ${identifyShaded}/${identifyDenominator}.`,
      answerLabel: `${identifyShaded}/${identifyDenominator}`,
      visual: bar(identifyDenominator, identifyShaded, `${identifyShaded} glowing pieces`),
      interaction: choices(identifyShaded, identifyDenominator, random),
    }),
    taskShell({
      index: 2,
      instruction: 'What does the denominator tell us?',
      supportingText: 'Look at the bottom number.',
      hint: 'The denominator counts the equal pieces in the whole.',
      explanation: 'The denominator tells how many equal pieces the whole is split into.',
      answerLabel: 'Total pieces',
      interaction: {
        type: 'multiple-choice',
        correctOptionId: 'answer',
        options: [
          { id: 'answer', label: 'Total pieces', accessibleLabel: 'Total pieces' },
          { id: 'choice-2', label: 'Shaded pieces', accessibleLabel: 'Shaded pieces' },
          { id: 'choice-3', label: 'The color', accessibleLabel: 'The color' },
        ],
      },
    }),
    taskShell({
      index: 3,
      instruction: 'What does the numerator tell us?',
      supportingText: 'Look at the top number.',
      hint: 'The numerator counts the pieces we are using.',
      explanation: 'The numerator tells how many of the equal pieces are shaded.',
      answerLabel: 'Shaded pieces',
      visual: bar(vocabDenominator, vocabShaded, `${vocabShaded} shaded pieces`),
      interaction: {
        type: 'multiple-choice',
        correctOptionId: 'answer',
        options: [
          { id: 'choice-1', label: 'Total pieces', accessibleLabel: 'Total pieces' },
          { id: 'answer', label: 'Shaded pieces', accessibleLabel: 'Shaded pieces' },
          { id: 'choice-3', label: 'The color', accessibleLabel: 'The color' },
        ],
      },
    }),
    taskShell({
      index: 4,
      instruction: `What is ${show(mc)}?`,
      supportingText: 'The pieces are the same size.',
      hint: `Add the top numbers. The bottom number stays ${mc.denominator}.`,
      explanation: `Add the numerators. The denominator stays ${mc.denominator}, so the sum is ${sum(mc)}/${mc.denominator}.`,
      answerLabel: `${sum(mc)}/${mc.denominator}`,
      interaction: choices(sum(mc), mc.denominator, random),
    }),
    taskShell({
      index: 5,
      instruction: `Type the sum of ${typed.parts[0]}/${typed.denominator} and ${typed.parts[1]}/${typed.denominator}.`,
      supportingText: 'A fraction or a decimal is fine.',
      hint: `Add the top numbers. Keep ${typed.denominator} on the bottom.`,
      explanation: `${typed.parts[0]} plus ${typed.parts[1]} is ${sum(typed)}. The denominator stays ${typed.denominator}.`,
      answerLabel: `${sum(typed)}/${typed.denominator}`,
      interaction: {
        type: 'numeric-input',
        acceptedFormats: ['fraction', 'decimal'],
        allowNegative: false,
        correct: { numerator: sum(typed), denominator: typed.denominator },
        placeholder: 'Type 3/4 or 0.75',
      },
    }),
    taskShell({
      index: 6,
      instruction: `Tap the mark that shows ${show(line)}.`,
      supportingText: 'The marks are evenly spaced.',
      hint: `Start at 0 and move ${sum(line)} equal steps.`,
      explanation: `${show(line)} lands on ${sum(line)}/${line.denominator}.`,
      answerLabel: `${sum(line)}/${line.denominator}`,
      interaction: {
        type: 'number-line',
        start: { numerator: 0, denominator: 1 },
        end: { numerator: 1, denominator: 1 },
        partitions: line.denominator,
        correct: { numerator: sum(line), denominator: line.denominator },
      },
    }),
    taskShell({
      index: 7,
      instruction: `${name} has ${word.parts[0]}/${word.denominator} of ${phrase} and finds ${word.parts[1]}/${word.denominator} more. How much is that?`,
      supportingText: 'Put the pieces together.',
      hint: `Add the top numbers. The bottom stays ${word.denominator}.`,
      explanation: `The pieces are the same size, so the sum is ${sum(word)}/${word.denominator}.`,
      answerLabel: `${sum(word)}/${word.denominator}`,
      interaction: choices(sum(word), word.denominator, random),
    }),
    taskShell({
      index: 8,
      instruction: `A friend added ${show(mistake)} and wrote ${sum(mistake)}/${mistake.denominator * 2}. Which fraction is right?`,
      supportingText: 'Do not add the bottom numbers.',
      hint: 'The denominator stays the same when the pieces are the same size.',
      explanation: `Adding the denominators makes ${sum(mistake)}/${mistake.denominator * 2}. The denominator should stay ${mistake.denominator}.`,
      answerLabel: `${sum(mistake)}/${mistake.denominator}`,
      interaction: choices(sum(mistake), mistake.denominator, random),
    }),
    taskShell({
      index: 9,
      instruction: `Type the sum of ${typedAgain.parts[0]}/${typedAgain.denominator} and ${typedAgain.parts[1]}/${typedAgain.denominator}.`,
      supportingText: 'A fraction or a decimal is fine.',
      hint: `Add the top numbers and keep ${typedAgain.denominator}.`,
      explanation: `The sum is ${sum(typedAgain)}/${typedAgain.denominator}.`,
      answerLabel: `${sum(typedAgain)}/${typedAgain.denominator}`,
      interaction: {
        type: 'numeric-input',
        acceptedFormats: ['fraction', 'decimal'],
        allowNegative: false,
        correct: { numerator: sum(typedAgain), denominator: typedAgain.denominator },
        placeholder: 'Type 3/4 or 0.75',
      },
    }),
    taskShell({
      index: 10,
      instruction: `What is ${show(final)}?`,
      supportingText: 'One more same-size sum.',
      hint: `Add the numerators. Keep ${final.denominator}.`,
      explanation: `The denominator stays ${final.denominator}, so the sum is ${sum(final)}/${final.denominator}.`,
      answerLabel: `${sum(final)}/${final.denominator}`,
      interaction: choices(sum(final), final.denominator, random),
    }),
    {
      id: 'outro',
      type: 'outro',
      title: adventure.story.outroTitle,
      message: adventure.story.outroMessage,
      conceptSummary: 'Same-size pieces keep the same denominator. Add the numerators. The denominator stays the same.',
      badgeName: adventure.story.badgeName,
      readAloud: adventure.story.outroReadAloud,
    },
  ]

  const parsed = parseLesson({
    id: LIVE_LESSON_ID,
    version: 1,
    title: adventure.story.lessonTitle,
    description: adventure.story.lessonDescription,
    grade: 4,
    topic: 'Adding fractions with the same denominator',
    objectives: [adventure.story.objective],
    theme: adventure.theme,
    slides,
  })
  if (!parsed.ok) throw new Error(parsed.errors.join('\n'))
  return parsed.lesson
}
