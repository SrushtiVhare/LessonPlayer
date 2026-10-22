import { parseNumberInput } from '../lib/fraction-parser.ts'
import { rationalsEqual, type Rational } from '../lib/rational.ts'
import { getAdventure } from '../features/lesson-library/adventures.ts'
import { parseLesson, type Lesson } from '../schemas/lesson.schema.ts'
import type { Adventure } from '../schemas/adventure.schema.ts'

export const LIVE_LESSON_ID = 'live-fractions'
export const QUESTION_COUNT = 10

const TEXT_LIMITS = {
  instruction: 180,
  supporting: 180,
  hint: 200,
  explanation: 240,
  answerLabel: 24,
  readAloud: 420,
  title: 60,
  story: 320,
  objective: 160,
  message: 180,
  concept: 280,
  badge: 32,
  description: 220,
} as const

type MathKind = 'identify' | 'vocabulary' | 'add' | 'mistake'
type VocabAsk = 'denominator' | 'numerator'

type MathFacts = {
  kind: MathKind
  asks?: VocabAsk
  denominator: number
  numerators: number[]
  answerNumerator: number
}

type CleanResult = { ok: true; lesson: Lesson } | { ok: false; errors: string[] }

function record(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : null
}

function text(value: unknown, max: number, label: string, errors: string[]): string {
  if (typeof value !== 'string') {
    errors.push(`${label} must be text.`)
    return ''
  }
  const trimmed = value.trim().replace(/\s+/g, ' ')
  if (!trimmed) errors.push(`${label} is empty.`)
  if (trimmed.length > max) errors.push(`${label} is ${trimmed.length} characters. Keep it under ${max}.`)
  if (/[<>]/.test(trimmed)) errors.push(`${label} cannot contain HTML.`)
  return trimmed
}

function whole(value: unknown): number | null {
  return typeof value === 'number' && Number.isInteger(value) ? value : null
}

function readMath(value: unknown, errors: string[], index: number): MathFacts | null {
  const math = record(value)
  if (!math) {
    errors.push(`Challenge ${index} is missing its math check.`)
    return null
  }
  const kind = math.kind
  if (kind !== 'identify' && kind !== 'vocabulary' && kind !== 'add' && kind !== 'mistake') {
    errors.push(`Challenge ${index} has an unknown math kind.`)
    return null
  }
  const denominator = whole(math.denominator)
  const answerNumerator = whole(math.answerNumerator)
  const numerators = Array.isArray(math.numerators) ? math.numerators.map(whole) : []
  if (denominator === null || denominator < 2 || denominator > 12) {
    errors.push(`Challenge ${index} needs a denominator from 2 to 12.`)
  }
  if (answerNumerator === null || answerNumerator < 0) {
    errors.push(`Challenge ${index} needs an answer numerator.`)
  }
  if (numerators.length === 0 || numerators.some((part) => part === null || part < 0)) {
    errors.push(`Challenge ${index} needs whole numerators.`)
  }
  const asks = math.asks
  if (kind === 'vocabulary' && asks !== 'denominator' && asks !== 'numerator') {
    errors.push(`Challenge ${index} must ask about the numerator or the denominator.`)
  }
  if (denominator === null || answerNumerator === null || numerators.some((part) => part === null)) return null
  return {
    kind,
    asks: asks === 'denominator' || asks === 'numerator' ? asks : undefined,
    denominator,
    numerators: numerators.filter((part): part is number => part !== null),
    answerNumerator,
  }
}

function mentionsNumber(label: string, value: number): boolean {
  return new RegExp(`(?<![0-9])${value}(?![0-9])`).test(label)
}

function sameFraction(label: string, numerator: number, denominator: number): boolean {
  const parsed = parseNumberInput(label, { allowFraction: true, allowDecimal: true, allowNegative: false })
  return parsed.ok && rationalsEqual(parsed.rational, { numerator, denominator })
}

function mentions(instruction: string, numerator: number, denominator: number): boolean {
  return instruction.includes(`${numerator}/${denominator}`)
}

function choiceId(index: number, correct: boolean): string {
  return correct ? 'answer' : `choice-${index + 1}`
}

function meaningPattern(facts: MathFacts): RegExp {
  if (facts.kind === 'mistake') return /\b(denom|bottom|same)/i
  if (facts.asks === 'numerator') return /\b(select|shade|top|numer|chosen|focus)/i
  return /\b(total|equal|bottom|denom|whole)/i
}

function matchChoices(
  cleaned: { label: string; accessibleLabel: string }[],
  facts: MathFacts,
  instruction: string,
  errors: string[],
  index: number,
): boolean[] | null {
  const target = `${facts.answerNumerator}/${facts.denominator}`
  if (facts.kind === 'vocabulary') {
    const byNumber = cleaned.map((option) => mentionsNumber(option.label, facts.answerNumerator))
    if (byNumber.filter(Boolean).length === 1) return byNumber
    const byMeaning = cleaned.map((option) => meaningPattern(facts).test(option.label))
    if (byMeaning.filter(Boolean).length === 1) return byMeaning
    errors.push(`Challenge ${index} needs one choice that shows the ${facts.asks === 'numerator' ? 'numerator' : 'denominator'}.`)
    return null
  }

  const byFraction = cleaned.map((option) => sameFraction(option.label, facts.answerNumerator, facts.denominator))
  if (byFraction.filter(Boolean).length === 1) return byFraction
  if (facts.kind === 'mistake') {
    const trap = `${facts.answerNumerator}/${facts.denominator * facts.numerators.length}`
    const instructionHasTrap = instruction.includes(trap)
    const byMeaning = cleaned.map((option) => meaningPattern(facts).test(option.label))
    if (instructionHasTrap && byMeaning.filter(Boolean).length === 1) return byMeaning
    errors.push(`Challenge ${index} must show the wrong sum ${trap}, and one choice must say the denominators were added.`)
    return null
  }
  errors.push(`Challenge ${index} must have exactly one choice equal to ${target}.`)
  return null
}

function cleanChoices(
  interaction: Record<string, unknown>,
  facts: MathFacts,
  instruction: string,
  errors: string[],
  index: number,
): Record<string, unknown> | null {
  const options = Array.isArray(interaction.options) ? interaction.options : []
  if (options.length < 3 || options.length > 4) {
    errors.push(`Challenge ${index} needs 3 or 4 choices.`)
    return null
  }
  const cleaned = options.map((option, optionIndex) => {
    const row = record(option)
    const label = text(row?.label, 24, `Challenge ${index} choice ${optionIndex + 1}`, errors)
    const accessibleLabel = text(row?.accessibleLabel, 80, `Challenge ${index} choice ${optionIndex + 1} label`, errors)
    return { label, accessibleLabel }
  })
  const matches = matchChoices(cleaned, facts, instruction, errors, index)
  if (!matches) return null
  if (facts.kind === 'mistake' && matches.some((match, optionIndex) => match && sameFraction(cleaned[optionIndex]?.label ?? '', facts.answerNumerator, facts.denominator))) {
    const trap = { numerator: facts.answerNumerator, denominator: facts.denominator * facts.numerators.length }
    const hasTrap = cleaned.some((option, optionIndex) => !matches[optionIndex] && sameFraction(option.label, trap.numerator, trap.denominator))
    if (!hasTrap) errors.push(`Challenge ${index} needs a wrong choice that adds the denominators, such as ${trap.numerator}/${trap.denominator}.`)
  }
  return {
    type: 'multiple-choice',
    prompt: '',
    correctOptionId: 'answer',
    options: cleaned.map((option, optionIndex) => ({
      id: choiceId(optionIndex, matches[optionIndex] === true),
      label: option.label,
      accessibleLabel: option.accessibleLabel,
    })),
  }
}

function cleanInteraction(
  interaction: Record<string, unknown> | null,
  facts: MathFacts,
  instruction: string,
  errors: string[],
  index: number,
): Record<string, unknown> | null {
  const type = interaction?.type
  if (facts.kind !== 'add' && type !== 'multiple-choice') {
    errors.push(`Challenge ${index} must be multiple choice.`)
    return null
  }
  if (facts.kind === 'add' && /number line|tap the mark/i.test(instruction)) {
    return {
      type: 'number-line',
      prompt: instruction,
      start: { numerator: 0, denominator: 1 },
      end: { numerator: 1, denominator: 1 },
      partitions: facts.denominator,
      correct: { numerator: facts.answerNumerator, denominator: facts.denominator },
    }
  }
  if (type === 'multiple-choice') return cleanChoices(interaction ?? {}, facts, instruction, errors, index)
  const answer: Rational = { numerator: facts.answerNumerator, denominator: facts.denominator }
  if (type === 'numeric-input') {
    if (facts.kind !== 'add') errors.push(`Challenge ${index} can only be typed when pieces are being added.`)
    return {
      type: 'numeric-input',
      prompt: instruction,
      acceptedFormats: ['fraction', 'decimal'],
      allowNegative: false,
      correct: answer,
      placeholder: 'Type 3/4 or 0.75',
    }
  }
  if (type === 'number-line') {
    if (facts.kind !== 'add') errors.push(`Challenge ${index} can only use the number line when pieces are being added.`)
    return {
      type: 'number-line',
      prompt: instruction,
      start: { numerator: 0, denominator: 1 },
      end: { numerator: 1, denominator: 1 },
      partitions: facts.denominator,
      correct: answer,
    }
  }
  errors.push(`Challenge ${index} has an unknown question type.`)
  return null
}

function checkFacts(facts: MathFacts, instruction: string, errors: string[], index: number): void {
  const sum = facts.numerators.reduce((total, part) => total + part, 0)
  if (facts.kind === 'identify' || facts.kind === 'add' || facts.kind === 'mistake') {
    if (facts.kind !== 'identify' && sum !== facts.answerNumerator) {
      errors.push(`Challenge ${index} adds to ${sum}, not ${facts.answerNumerator}.`)
    }
    if (facts.kind === 'identify' && (facts.numerators.length !== 1 || facts.numerators[0] !== facts.answerNumerator)) {
      errors.push(`Challenge ${index} must shade the same number of pieces as its answer.`)
    }
    if (facts.answerNumerator > facts.denominator) errors.push(`Challenge ${index} is bigger than one whole. Keep the sum inside one whole.`)
    if (facts.numerators.some((part) => part > facts.denominator)) errors.push(`Challenge ${index} has a piece bigger than the whole.`)
  }
  if (facts.kind === 'vocabulary' && facts.asks === 'denominator' && facts.answerNumerator !== facts.denominator) {
    errors.push(`Challenge ${index} asks for the denominator, so the answer must be ${facts.denominator}.`)
  }
  if (facts.kind === 'vocabulary' && facts.asks === 'numerator' && facts.answerNumerator !== facts.numerators[0]) {
    errors.push(`Challenge ${index} asks for the numerator, so the answer must match the shaded pieces.`)
  }
  if ((facts.kind === 'add' || facts.kind === 'mistake') && facts.numerators.some((part) => !mentions(instruction, part, facts.denominator))) {
    errors.push(`Challenge ${index} must show every piece as a fraction, like 1/${facts.denominator}.`)
  }
}

function cleanVisual(value: unknown, facts: MathFacts, errors: string[], index: number): Record<string, unknown> | undefined {
  const visual = record(value)
  const bars = Array.isArray(visual?.bars) ? visual.bars : []
  if (bars.length === 0) {
    if (facts.kind === 'identify') errors.push(`Challenge ${index} needs a fraction bar.`)
    return undefined
  }
  if (bars.length > 3) {
    errors.push(`Challenge ${index} needs 1 to 3 fraction bars.`)
    return undefined
  }
  const cleaned = bars.map((bar, barIndex) => {
    const row = record(bar)
    const segments = whole(row?.segments)
    const shaded = whole(row?.shaded)
    const color = row?.color === 'gold' || row?.color === 'blue' || row?.color === 'lavender' ? row.color : 'gold'
    if (segments === null || shaded === null || shaded > segments || segments < 1 || segments > 20) {
      errors.push(`Challenge ${index} bar ${barIndex + 1} is not a valid fraction bar.`)
    }
    return {
      segments: segments ?? 1,
      shaded: shaded ?? 0,
      color,
      caption: text(row?.caption, 90, `Challenge ${index} bar ${barIndex + 1} caption`, errors) || 'Equal pieces',
    }
  })
  if (facts.kind === 'identify') {
    const bar = cleaned[0]
    if (!bar || bar.segments !== facts.denominator || bar.shaded !== facts.answerNumerator) {
      errors.push(`Challenge ${index} bar must show ${facts.answerNumerator} shaded pieces out of ${facts.denominator}.`)
    }
  }
  return { type: 'fraction-bars', bars: cleaned }
}

function cleanTask(value: unknown, index: number, errors: string[]): Record<string, unknown> | null {
  const task = record(value)
  if (!task || task.type !== 'task') {
    errors.push(`Slide ${index + 1} must be a challenge.`)
    return null
  }
  const instruction = text(task.instruction, TEXT_LIMITS.instruction, `Challenge ${index} question`, errors)
  const facts = readMath(task.math, errors, index)
  if (!facts) return null
  checkFacts(facts, instruction, errors, index)
  const interaction = cleanInteraction(record(task.interaction), facts, instruction, errors, index)
  if (interaction) interaction.prompt = instruction
  const supporting = task.supportingText === undefined ? undefined : text(task.supportingText, TEXT_LIMITS.supporting, `Challenge ${index} help text`, errors)
  return {
    id: `q${index}`,
    type: 'task',
    instruction,
    supportingText: supporting || undefined,
    hint: text(task.hint, TEXT_LIMITS.hint, `Challenge ${index} hint`, errors),
    explanation: text(task.explanation, TEXT_LIMITS.explanation, `Challenge ${index} explanation`, errors),
    answerLabel: facts.kind === 'vocabulary' ? text(task.answerLabel, TEXT_LIMITS.answerLabel, `Challenge ${index} answer`, errors) : `${facts.answerNumerator}/${facts.denominator}`,
    readAloud: text(task.readAloud, TEXT_LIMITS.readAloud, `Challenge ${index} read aloud`, errors) || instruction,
    visual: cleanVisual(task.visual, facts, errors, index),
    interaction,
    mathKind: facts.kind,
    mathAsk: facts.asks ?? '',
    signature: `${facts.denominator}:${[...facts.numerators].sort((a, b) => a - b).join('+')}`,
  }
}

function checkCoverage(tasks: Record<string, unknown>[], errors: string[]): void {
  if (tasks.length !== QUESTION_COUNT) errors.push(`The mission needs exactly ${QUESTION_COUNT} challenges.`)
  const kinds = tasks.map((task) => task.mathKind)
  const types = tasks.map((task) => record(task.interaction)?.type)
  if (kinds[0] !== 'identify') errors.push('Challenge 1 must ask which fraction matches a picture.')
  if (kinds[1] !== 'vocabulary' || tasks[1]?.mathAsk !== 'denominator') errors.push('Challenge 2 must ask what the denominator means.')
  if (kinds[2] !== 'vocabulary' || tasks[2]?.mathAsk !== 'numerator') errors.push('Challenge 3 must ask what the numerator means.')
  if (!kinds.includes('mistake')) errors.push('One challenge must catch the mistake of adding denominators.')
  if (kinds.filter((kind) => kind === 'add').length < 5) errors.push('At least 5 challenges must add fractions.')
  if (types.filter((type) => type === 'numeric-input').length < 2) errors.push('At least 2 challenges must ask the child to type an answer.')
  if (!types.includes('number-line')) errors.push('One challenge must use a number line.')
  const puzzles = tasks.filter((task) => task.mathKind === 'add' || task.mathKind === 'mistake')
  const denominators = new Set(
    puzzles
      .map((task) => task.signature)
      .filter((item): item is string => typeof item === 'string')
      .map((item) => item.split(':')[0]),
  )
  if (denominators.size < 3) errors.push('Use at least 3 different denominators so the mission is not the same sum again.')
  const signatures = puzzles.map((task) => task.signature)
  if (new Set(signatures).size !== signatures.length) errors.push('Do not repeat the same pieces twice.')
}

export function buildLessonPrompt(adventure: Adventure, variation: string, previousErrors: string[] = []): string {
  const retry = previousErrors.length > 0 ? `\n\nYour last draft was rejected:\n${previousErrors.join('\n')}\nFix every line.` : ''
  return `Write a brand-new Grade 4 math lesson as JSON for a 9-year-old.
Topic: adding fractions that share a denominator.
Friend: ${adventure.theme.character.name}. World: ${adventure.story.lessonTitle}. ${adventure.story.welcomeBody}
Variation ${variation}. Use different numbers from any familiar worksheet. Do not copy 1/4 + 2/4 or 1/5 + 2/5 unless the variation truly needs them, and never repeat a pair.

Teach the whole idea in exactly 10 challenges, in this order:
1. identify: a bar is shaded. Ask which fraction matches. Do not write the fraction in the question.
2. vocabulary: what the denominator counts. math.asks is "denominator" and answerNumerator equals the denominator.
3. vocabulary: what the numerator counts. math.asks is "numerator".
4. add, multiple choice.
5. add, numeric-input.
6. add, number-line.
7. add, multiple choice word problem starring ${adventure.theme.character.name}.
8. mistake: someone added the denominators. The right choice keeps the denominator. Include the trap, such as 3/10 when the sum is 3/5.
9. add, numeric-input.
10. add, multiple choice.

Math rules:
- Inside one problem the denominator stays the same.
- Use at least 3 different denominators, each from 2 to 12.
- Numerators are whole numbers greater than 0. Their sum is answerNumerator and must be less than or equal to the denominator.
- For add and mistake, the question text must contain each fraction as n/d.
- Hints do not reveal the answer. Explanations say to add the numerators and keep the denominator.
- Multiple-choice labels for sums are fractions like 3/5. Exactly one choice matches the answer.
- Vocabulary choices are short words, and only the right choice contains the answer number.
- Number line: start 0/1, end 1/1, partitions equal to the denominator, correct equal to the sum.
- Typed answers accept a fraction or a decimal. allowNegative is false.
- No HTML. Short sentences. ids can be anything simple.

JSON shape:
{
  "title": "short title",
  "description": "one sentence",
  "objectives": ["three short goals"],
  "slides": [
    { "id": "intro", "type": "intro", "title": "", "story": "", "objective": "", "startLabel": "Start Mission", "readAloud": "" },
    { "id": "q1", "type": "task", "instruction": "", "supportingText": "", "hint": "", "explanation": "", "answerLabel": "1/4", "readAloud": "",
      "visual": { "type": "fraction-bars", "bars": [{ "segments": 4, "shaded": 1, "color": "gold", "caption": "1 of 4 equal pieces" }] },
      "math": { "kind": "identify", "denominator": 4, "numerators": [1], "answerNumerator": 1 },
      "interaction": { "type": "multiple-choice", "prompt": "", "correctOptionId": "answer", "options": [
        { "id": "answer", "label": "1/4", "accessibleLabel": "1 out of 4" },
        { "id": "choice-2", "label": "1/3", "accessibleLabel": "1 out of 3" },
        { "id": "choice-3", "label": "4/1", "accessibleLabel": "4 out of 1" }
      ] }
    }
  ]
}
The last slide is an outro with title, message, conceptSummary, badgeName, and readAloud.
Put a math object on every challenge. kind is identify, vocabulary, add, or mistake.${retry}`
}

export function prepareGeneratedLesson(raw: unknown, adventure: Adventure): CleanResult {
  const errors: string[] = []
  const source = record(raw)
  if (!source) return { ok: false, errors: ['The model did not return a lesson object.'] }
  const slides = Array.isArray(source.slides) ? source.slides : []
  const intro = record(slides[0])
  const outro = record(slides[slides.length - 1])
  const middle = slides.slice(1, -1).map((slide, index) => cleanTask(slide, index + 1, errors))
  const tasks = middle.filter((slide): slide is Record<string, unknown> => slide !== null)
  checkCoverage(tasks, errors)

  const lesson = {
    id: LIVE_LESSON_ID,
    version: 1,
    title: text(source.title, TEXT_LIMITS.title, 'Title', errors) || adventure.story.lessonTitle,
    description: text(source.description, TEXT_LIMITS.description, 'Description', errors) || adventure.story.lessonDescription,
    grade: 4,
    topic: 'Adding fractions with the same denominator',
    objectives: Array.isArray(source.objectives)
      ? source.objectives.slice(0, 4).map((goal, index) => text(goal, 160, `Goal ${index + 1}`, errors)).filter(Boolean)
      : [adventure.story.objective ?? 'Add fractions that have the same denominator.'],
    theme: adventure.theme,
    slides: [
      {
        id: 'intro',
        type: 'intro',
        title: text(intro?.title, TEXT_LIMITS.title, 'Intro title', errors) || adventure.story.introTitle,
        story: text(intro?.story, TEXT_LIMITS.story, 'Intro story', errors),
        objective: text(intro?.objective, TEXT_LIMITS.objective, 'Intro goal', errors),
        startLabel: 'Start Mission',
        readAloud: text(intro?.readAloud, TEXT_LIMITS.readAloud, 'Intro read aloud', errors),
      },
      ...tasks.map((task) => {
        const { mathKind, mathAsk, signature, ...rest } = task
        void mathKind
        void mathAsk
        void signature
        return rest
      }),
      {
        id: 'outro',
        type: 'outro',
        title: text(outro?.title, TEXT_LIMITS.title, 'Ending title', errors),
        message: text(outro?.message, TEXT_LIMITS.message, 'Ending message', errors),
        conceptSummary: text(outro?.conceptSummary, TEXT_LIMITS.concept, 'Concept summary', errors),
        badgeName: text(outro?.badgeName, TEXT_LIMITS.badge, 'Badge name', errors),
        readAloud: text(outro?.readAloud, TEXT_LIMITS.readAloud, 'Ending read aloud', errors),
      },
    ],
  }

  if (lesson.objectives.length === 0) errors.push('Add at least one learning goal.')
  if (errors.length > 0) return { ok: false, errors }
  const parsed = parseLesson(lesson)
  if (!parsed.ok) return parsed
  return { ok: true, lesson: parsed.lesson }
}

export function prepareForAdventure(raw: unknown, adventureId: string): CleanResult {
  return prepareGeneratedLesson(raw, getAdventure(adventureId))
}
