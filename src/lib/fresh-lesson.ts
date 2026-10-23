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

export type Chapter = { title: string; story: string }

const NUMBER_WORDS =
  /\b(zero|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|half|halves|thirds?|quarters?|fourths?|fifths?|sixths?|sevenths?|eighths?|ninths?|tenths?)\b/i

/** AI story text never carries numbers, so it cannot disagree with the checked math. */
export function cleanChapter(raw: unknown): Chapter | null {
  if (!raw || typeof raw !== 'object') return null
  const row = raw as Record<string, unknown>
  const title = typeof row.chapterTitle === 'string' ? row.chapterTitle.trim() : ''
  const story = typeof row.story === 'string' ? row.story.trim().replace(/\s+/g, ' ') : ''
  if (title.length < 2 || title.length > 40 || story.length < 10 || story.length > 240) return null
  if (/\d/.test(title + story) || NUMBER_WORDS.test(title + ' ' + story)) return null
  return { title, story }
}

export function fallbackChapter(adventure: Adventure, step: number): Chapter {
  const name = adventure.theme.character.name
  const thing = pieceName(adventure.id)
  const chapters: Chapter[] = [
    { title: 'The Glowing Clue', story: `${name} spots a glowing ${thing} split into equal pieces. "Can you read it like a fraction?"` },
    { title: 'Counting the Whole', story: `${name} wants to rebuild the ${thing}. First we need to know how many equal pieces make the whole.` },
    { title: 'The Lit-Up Pieces', story: `Some pieces are shining brighter than the rest. ${name} asks which number counts them.` },
    { title: 'Pieces Together', story: `${name} found more pieces of the same size. Snap them together to see how much you have!` },
    { title: 'The Secret Code', story: `A locked door blocks the path. ${name} says the code is the total of the pieces. Type it in!` },
    { title: 'The Path of Marks', story: `A trail of evenly spaced marks leads onward. Hop along it to the right spot!` },
    { title: 'A Helping Hand', story: `A new friend brings extra pieces for ${name}. How much do they have together?` },
    { title: 'The Tricky Mistake', story: `Uh oh! Someone added the pieces the wrong way. Can you be the fraction detective?` },
    { title: 'Almost There', story: `The ${thing} is nearly whole again. ${name} needs one more code to keep going.` },
    { title: 'The Final Piece', story: `This is the last piece! Solve it and the ${thing} will shine like new.` },
  ]
  return chapters[Math.min(chapters.length, Math.max(1, step)) - 1]!
}

function taskShell(input: {
  index: number
  id?: string
  chapter?: Chapter
  instruction: string
  supportingText: string
  hint: string
  secondHint?: string
  explanation: string
  answerLabel: string
  interaction: Record<string, unknown>
  visual?: Record<string, unknown>
}) {
  return {
    id: input.id ?? `q${input.index}`,
    type: 'task' as const,
    ...(input.chapter ? { chapterTitle: input.chapter.title, story: input.chapter.story } : {}),
    instruction: input.instruction,
    supportingText: input.supportingText,
    hint: input.hint,
    ...(input.secondHint ? { secondHint: input.secondHint } : {}),
    explanation: input.explanation,
    answerLabel: input.answerLabel,
    readAloud: input.instruction,
    visual: input.visual,
    interaction: { ...input.interaction, prompt: input.instruction },
  }
}

function shadeTask(denominator: number, shaded: number) {
  const count = Math.max(1, shaded)
  return {
    instruction: `Tap to color pieces and show ${count}/${denominator}.`,
    supportingText: 'The top number tells how many pieces to color.',
    hint: `The bottom number ${denominator} is all the pieces. The top number tells how many to color.`,
    secondHint: `Color ${count} pieces.`,
    explanation: `The numerator ${count} means ${count} of the ${denominator} equal pieces are colored.`,
    answerLabel: `${count}/${denominator}`,
    interaction: {
      type: 'shade',
      segments: denominator,
      correct: { numerator: count, denominator },
    },
  }
}

export type TaskNumbers = { denominator: number; left: number; right: number; shaded: number }

function pictureKey(numbers: TaskNumbers): string {
  return `${numbers.shaded} glowing pieces out of ${numbers.denominator}`
}

function additionKeys(numbers: TaskNumbers): string[] {
  const { left, right, denominator } = numbers
  return [`${left}/${denominator} + ${right}/${denominator}`, `${right}/${denominator} + ${left}/${denominator}`]
}

function seen(used: string[], step: number, numbers: TaskNumbers): boolean {
  const keys = step <= 3 ? [pictureKey(numbers), `show ${numbers.shaded}/${numbers.denominator}.`] : additionKeys(numbers)
  return used.some((item) => keys.some((key) => item.includes(key)))
}

/** Numbers for one new puzzle. They skip problems the child has already seen. */
export function pickTaskNumbers(seed: number, step: number, used: string[], easy: boolean): TaskNumbers {
  const random = randomFrom(seed || 1)
  for (let attempt = 0; attempt < 40; attempt += 1) {
    const denominator = easy ? 2 + Math.floor(random() * 4) : 5 + Math.floor(random() * 8)
    const left = 1 + Math.floor(random() * Math.max(1, denominator - 1))
    const rightRoom = denominator - left
    if (rightRoom < 1) continue
    const right = 1 + Math.floor(random() * rightRoom)
    const shaded = 1 + Math.floor(random() * Math.max(1, denominator - 1))
    const numbers = { denominator, left, right, shaded }
    if (seen(used, step, numbers)) continue
    return numbers
  }
  for (const denominator of [4, 5, 6, 7, 8, 3]) {
    const numbers = { denominator, left: 1, right: 1, shaded: 1 }
    if (!seen(used, step, numbers)) return numbers
  }
  return { denominator: 6, left: 1, right: 2, shaded: 2 }
}

export function usedFromLesson(lesson: Lesson): string[] {
  return lesson.slides.flatMap((slide) => (slide.type === 'task' ? [slide.instruction] : []))
}

function safeNumbers(numbers: TaskNumbers): TaskNumbers {
  const denominator = Math.min(12, Math.max(2, Math.trunc(numbers.denominator) || 4))
  const left = Math.min(denominator - 1, Math.max(1, Math.trunc(numbers.left) || 1))
  const right = Math.min(denominator - left, Math.max(1, Math.trunc(numbers.right) || 1))
  const shaded = Math.min(denominator - 1, Math.max(1, Math.trunc(numbers.shaded) || 1))
  return { denominator, left, right, shaded }
}

/** One checked puzzle. The step keeps the teaching order, and the numbers are new. */
export function createTaskSlide(
  adventure: Adventure,
  step: number,
  raw: TaskNumbers,
  seed: number,
  slideId?: string,
  chapter: Chapter = fallbackChapter(adventure, step),
) {
  const numbers = safeNumbers(raw)
  const random = randomFrom(seed || 1)
  const name = adventure.theme.character.name
  const { denominator, left, right, shaded } = numbers
  const sum = left + right
  const picture = pictureKey(numbers)
  const addition = `${left}/${denominator} + ${right}/${denominator}`
  const answer = `${sum}/${denominator}`
  const bars = {
    type: 'fraction-bars',
    bars: [
      { segments: denominator, shaded: left, color: 'gold', caption: `${left} pieces` },
      { segments: denominator, shaded: right, color: 'blue', caption: `${right} more` },
    ],
  }
  const shared = {
    index: step,
    id: slideId,
    chapter,
  }
  if (step === 1) {
    return taskShell({
      ...shared,
      instruction: `Which fraction matches ${picture}?`,
      supportingText: 'The pieces are the same size.',
      hint: 'Count every equal piece first. That number is the denominator.',
      explanation: `${picture} is ${shaded}/${denominator}.`,
      answerLabel: `${shaded}/${denominator}`,
      visual: {
        type: 'fraction-bars',
        bars: [{ segments: denominator, shaded, color: 'gold', caption: `${shaded} glowing pieces` }],
      },
      interaction: choices(shaded, denominator, random),
    })
  }
  if (step === 2) {
    return taskShell({
      ...shared,
      instruction: `${picture}. What does the denominator tell us?`,
      supportingText: 'Look at the bottom number.',
      hint: 'The denominator counts the equal pieces in the whole.',
      explanation: 'The denominator tells how many equal pieces the whole is split into.',
      answerLabel: 'Total pieces',
      visual: {
        type: 'fraction-bars',
        bars: [{ segments: denominator, shaded, color: 'lavender', caption: `${denominator} equal pieces` }],
      },
      interaction: {
        type: 'multiple-choice',
        correctOptionId: 'answer',
        options: [
          { id: 'answer', label: 'Total pieces', accessibleLabel: 'Total pieces' },
          { id: 'choice-2', label: 'Shaded pieces', accessibleLabel: 'Shaded pieces' },
          { id: 'choice-3', label: 'The color', accessibleLabel: 'The color' },
        ],
      },
    })
  }
  if (step === 3) return taskShell({ ...shared, ...shadeTask(denominator, shaded) })
  if (step === 5 || step === 9) {
    return taskShell({
      ...shared,
      instruction: `Type the sum of ${addition}.`,
      supportingText: 'A fraction or a decimal is fine.',
      hint: `Add the top numbers. Keep ${denominator} on the bottom.`,
      explanation: `${left} plus ${right} is ${sum}. The denominator stays ${denominator}.`,
      answerLabel: answer,
      visual: bars,
      interaction: {
        type: 'numeric-input',
        acceptedFormats: ['fraction', 'decimal'],
        allowNegative: false,
        correct: { numerator: sum, denominator },
        placeholder: 'Type 3/4 or 0.75',
      },
    })
  }
  if (step === 6) {
    return taskShell({
      ...shared,
      instruction: `Tap the mark that shows ${addition}.`,
      supportingText: 'The marks are evenly spaced.',
      hint: `Start at 0 and move ${sum} equal steps.`,
      secondHint: `Hop ${left}, then hop ${right} more.`,
      explanation: `${addition} lands on ${answer}.`,
      answerLabel: answer,
      interaction: {
        type: 'number-line',
        start: { numerator: 0, denominator: 1 },
        end: { numerator: 1, denominator: 1 },
        partitions: denominator,
        correct: { numerator: sum, denominator },
      },
    })
  }
  if (step === 8) {
    return taskShell({
      ...shared,
      instruction: `A friend added ${addition} and wrote ${sum}/${denominator * 2}. Which fraction is right?`,
      supportingText: 'Do not add the bottom numbers.',
      hint: 'The denominator stays the same when the pieces are the same size.',
      explanation: `Adding the denominators makes ${sum}/${denominator * 2}. The denominator should stay ${denominator}.`,
      answerLabel: answer,
      visual: bars,
      interaction: choices(sum, denominator, random),
    })
  }
  const word = step === 7
  return taskShell({
    ...shared,
    instruction: word ? `${name} puts together ${addition}. How much is that?` : `What is ${addition}?`,
    supportingText: word ? 'Put the pieces together.' : 'The pieces are the same size.',
    hint: `Add the top numbers. The bottom number stays ${denominator}.`,
    secondHint: `${left} + ${right} = ${sum}.`,
    explanation: `Add the numerators. The denominator stays ${denominator}, so the sum is ${answer}.`,
    answerLabel: answer,
    visual: bars,
    interaction: choices(sum, denominator, random),
  })
}

export function swapTask(lesson: Lesson, slideId: string, replacement: unknown): Lesson {
  if (!replacement || typeof replacement !== 'object') return lesson
  const slides = lesson.slides.map((slide) => (slide.id === slideId ? replacement : slide))
  const parsed = parseLesson({ ...lesson, slides })
  return parsed.ok ? parsed.lesson : lesson
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
    taskShell({ index: 3, ...shadeTask(vocabDenominator, Math.min(vocabShaded, vocabDenominator - 1)) }),
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

  let step = 0
  const storied = slides.map((slide) => {
    if (slide.type !== 'task') return slide
    step += 1
    const chapter = fallbackChapter(adventure, step)
    return { ...slide, chapterTitle: chapter.title, story: chapter.story }
  })

  const parsed = parseLesson({
    id: LIVE_LESSON_ID,
    version: 1,
    title: adventure.story.lessonTitle,
    description: adventure.story.lessonDescription,
    grade: 4,
    topic: 'Adding fractions with the same denominator',
    objectives: [adventure.story.objective],
    theme: adventure.theme,
    slides: storied,
  })
  if (!parsed.ok) throw new Error(parsed.errors.join('\n'))
  return parsed.lesson
}
