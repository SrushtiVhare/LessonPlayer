import { COPY } from './copy.ts'
import { parseNumberInput } from './fraction-parser.ts'
import { rationalAtTick, rationalsEqual } from './rational.ts'
import type { Interaction } from '../schemas/lesson.schema.ts'

export type AnswerVerdict =
  | { status: 'correct' }
  | { status: 'incorrect' }
  | { status: 'invalid'; message: string }

function assertNever(value: never): never {
  throw new Error(`Unknown interaction: ${JSON.stringify(value)}`)
}

export function checkAnswer(interaction: Interaction, response: string): AnswerVerdict {
  switch (interaction.type) {
    case 'multiple-choice':
      return checkChoice(interaction, response)
    case 'numeric-input':
      return checkNumeric(interaction, response)
    case 'number-line':
      return checkNumberLine(interaction, response)
    default:
      return assertNever(interaction)
  }
}

function checkChoice(
  interaction: Extract<Interaction, { type: 'multiple-choice' }>,
  response: string,
): AnswerVerdict {
  if (response.trim() === '') return { status: 'invalid', message: COPY.chooseAnswer }
  if (!interaction.options.some((option) => option.id === response)) {
    return { status: 'invalid', message: COPY.chooseAnswer }
  }
  return response === interaction.correctOptionId ? { status: 'correct' } : { status: 'incorrect' }
}

function checkNumeric(
  interaction: Extract<Interaction, { type: 'numeric-input' }>,
  response: string,
): AnswerVerdict {
  const parsed = parseNumberInput(response, {
    allowFraction: interaction.acceptedFormats.includes('fraction'),
    allowDecimal: interaction.acceptedFormats.includes('decimal'),
    allowNegative: interaction.allowNegative,
  })
  if (!parsed.ok) return { status: 'invalid', message: parsed.message }
  return rationalsEqual(parsed.rational, interaction.correct)
    ? { status: 'correct' }
    : { status: 'incorrect' }
}

function checkNumberLine(
  interaction: Extract<Interaction, { type: 'number-line' }>,
  response: string,
): AnswerVerdict {
  if (response.trim() === '') return { status: 'invalid', message: COPY.tapMark }
  if (!/^\d+$/.test(response.trim())) return { status: 'invalid', message: COPY.tapMark }
  const index = Number(response)
  const tick = rationalAtTick(interaction.start, interaction.end, interaction.partitions, index)
  if (!tick) return { status: 'invalid', message: COPY.tapMark }
  return rationalsEqual(tick, interaction.correct) ? { status: 'correct' } : { status: 'incorrect' }
}
