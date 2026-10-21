import { z } from 'zod'
import { rationalAtTick, rationalsEqual } from '../lib/rational.ts'
import { themeSchema } from './theme.schema.ts'

const shortText = (max: number) => z.string().trim().min(1).max(max)
const idSchema = z.string().regex(/^[a-z0-9-]+$/).max(48)

export const rationalSchema = z.object({
  numerator: z.number().int().min(-1_000_000).max(1_000_000),
  denominator: z.number().int().positive().max(1_000_000),
})

const barSchema = z
  .object({
    segments: z.number().int().min(1).max(20),
    shaded: z.number().int().min(0).max(20),
    color: z.enum(['gold', 'blue', 'lavender']),
    caption: shortText(90),
  })
  .superRefine((bar, ctx) => {
    if (bar.shaded > bar.segments) {
      ctx.addIssue({
        code: 'custom',
        message: 'Shaded pieces cannot be more than the total pieces.',
        path: ['shaded'],
      })
    }
  })

const visualSchema = z.object({
  type: z.literal('fraction-bars'),
  bars: z.array(barSchema).min(1).max(3),
})

const choiceSchema = z.object({
  id: idSchema,
  label: shortText(24),
  accessibleLabel: shortText(80),
  visual: barSchema.optional(),
})

const multipleChoiceSchema = z
  .object({
    type: z.literal('multiple-choice'),
    prompt: shortText(180),
    options: z.array(choiceSchema).min(3).max(4),
    correctOptionId: idSchema,
  })
  .superRefine((interaction, ctx) => {
    const ids = interaction.options.map((option) => option.id)
    if (new Set(ids).size !== ids.length) {
      ctx.addIssue({ code: 'custom', message: 'Answer choices need unique ids.', path: ['options'] })
    }
    if (!ids.includes(interaction.correctOptionId)) {
      ctx.addIssue({
        code: 'custom',
        message: 'The correct choice must be one of the options.',
        path: ['correctOptionId'],
      })
    }
  })

const numericSchema = z.object({
  type: z.literal('numeric-input'),
  prompt: shortText(180),
  acceptedFormats: z.array(z.enum(['fraction', 'decimal'])).min(1),
  allowNegative: z.boolean(),
  correct: rationalSchema,
  placeholder: shortText(40).optional(),
})

const numberLineSchema = z
  .object({
    type: z.literal('number-line'),
    prompt: shortText(180),
    start: rationalSchema,
    end: rationalSchema,
    partitions: z.number().int().min(2).max(12),
    correct: rationalSchema,
  })
  .superRefine((interaction, ctx) => {
    const start = interaction.start
    const end = interaction.end
    if (start.numerator * end.denominator >= end.numerator * start.denominator) {
      ctx.addIssue({ code: 'custom', message: 'The number line end must be greater than the start.', path: ['end'] })
    }
    const matchesTick = Array.from({ length: interaction.partitions + 1 }, (_, index) =>
      rationalAtTick(start, end, interaction.partitions, index),
    ).some((tick) => tick !== null && rationalsEqual(tick, interaction.correct))
    if (!matchesTick) {
      ctx.addIssue({
        code: 'custom',
        message: 'The correct number-line answer must land on a mark.',
        path: ['correct'],
      })
    }
  })

export const interactionSchema = z.discriminatedUnion('type', [
  multipleChoiceSchema,
  numericSchema,
  numberLineSchema,
])

const introSchema = z.object({
  id: idSchema,
  type: z.literal('intro'),
  title: shortText(60),
  story: shortText(320),
  objective: shortText(160),
  startLabel: shortText(32),
  readAloud: shortText(420),
})

const taskSchema = z.object({
  id: idSchema,
  type: z.literal('task'),
  instruction: shortText(180),
  supportingText: shortText(180).optional(),
  hint: shortText(200),
  explanation: shortText(240),
  answerLabel: shortText(24),
  readAloud: shortText(420),
  visual: visualSchema.optional(),
  interaction: interactionSchema,
})

const outroSchema = z.object({
  id: idSchema,
  type: z.literal('outro'),
  title: shortText(60),
  message: shortText(180),
  conceptSummary: shortText(280),
  badgeName: shortText(32),
  readAloud: shortText(420),
})

export const slideSchema = z.discriminatedUnion('type', [introSchema, taskSchema, outroSchema])

export const lessonSchema = z
  .object({
    id: idSchema,
    version: z.number().int().positive().max(999),
    title: shortText(60),
    description: shortText(220),
    grade: z.number().int().min(1).max(8),
    topic: shortText(80),
    objectives: z.array(shortText(160)).min(1).max(4),
    theme: themeSchema,
    slides: z.array(slideSchema).min(6).max(12),
  })
  .superRefine((lesson, ctx) => {
    const [first] = lesson.slides
    const last = lesson.slides[lesson.slides.length - 1]
    if (first?.type !== 'intro') {
      ctx.addIssue({ code: 'custom', message: 'The first slide must be an intro.', path: ['slides', 0, 'type'] })
    }
    if (last?.type !== 'outro') {
      ctx.addIssue({
        code: 'custom',
        message: 'The last slide must be an outro.',
        path: ['slides', lesson.slides.length - 1, 'type'],
      })
    }
    const tasks = lesson.slides.filter((slide) => slide.type === 'task')
    if (tasks.length < 4 || tasks.length > 10) {
      ctx.addIssue({ code: 'custom', message: 'A lesson needs 4 to 10 challenges.', path: ['slides'] })
    }
    const middle = lesson.slides.slice(1, -1)
    if (middle.some((slide) => slide.type !== 'task')) {
      ctx.addIssue({ code: 'custom', message: 'Only challenges belong between the intro and outro.', path: ['slides'] })
    }
    const ids = lesson.slides.map((slide) => slide.id)
    if (new Set(ids).size !== ids.length) {
      ctx.addIssue({ code: 'custom', message: 'Every slide needs a unique id.', path: ['slides'] })
    }
  })

export type Lesson = z.infer<typeof lessonSchema>
export type Slide = z.infer<typeof slideSchema>
export type IntroSlide = Extract<Slide, { type: 'intro' }>
export type TaskSlide = Extract<Slide, { type: 'task' }>
export type OutroSlide = Extract<Slide, { type: 'outro' }>
export type Interaction = z.infer<typeof interactionSchema>
export type FractionBar = z.infer<typeof barSchema>
export type LessonVisual = z.infer<typeof visualSchema>

export function formatZodError(error: z.ZodError): string[] {
  return error.issues.map((issue) => {
    const path = issue.path.length > 0 ? issue.path.join('.') : 'lesson'
    return `${path}: ${issue.message}`
  })
}

export function parseLesson(data: unknown): { ok: true; lesson: Lesson } | { ok: false; errors: string[] } {
  const result = lessonSchema.safeParse(data)
  if (!result.success) return { ok: false, errors: formatZodError(result.error) }
  return { ok: true, lesson: result.data }
}

export function taskSlides(lesson: Lesson): TaskSlide[] {
  return lesson.slides.filter((slide): slide is TaskSlide => slide.type === 'task')
}
