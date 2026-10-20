import { describe, expect, it } from 'vitest'
import raw from '../../src/lessons/space-fractions.json' with { type: 'json' }
import { checkAnswer } from '../../src/lib/answer-checker.ts'
import { addRationals } from '../../src/lib/rational.ts'
import { parseLesson, taskSlides } from '../../src/schemas/lesson.schema.ts'
import { createSupabaseClient, readSupabaseConfig } from '../../src/services/supabase/client.ts'

describe('lesson schema', () => {
  it('accepts the space fractions lesson', () => {
    const parsed = parseLesson(raw)
    expect(parsed.ok).toBe(true)
    if (!parsed.ok) return
    expect(parsed.lesson.slides.map((slide) => slide.type)).toEqual(['intro', 'task', 'task', 'task', 'task', 'task', 'outro'])
    expect(taskSlides(parsed.lesson)).toHaveLength(5)
  })

  it('rejects a lesson that is missing its tasks', () => {
    const parsed = parseLesson({ ...raw, slides: [] })
    expect(parsed.ok).toBe(false)
  })

  it('rejects a multiple-choice task whose answer is not an option', () => {
    const broken = structuredClone(raw)
    const task = broken.slides[1]
    if (task?.type !== 'task' || !task.interaction || task.interaction.type !== 'multiple-choice') throw new Error('expected choice task')
    task.interaction.correctOptionId = 'not-a-choice'
    expect(parseLesson(broken).ok).toBe(false)
  })

  it('rejects a number-line answer that misses every mark', () => {
    const broken = structuredClone(raw)
    const task = broken.slides[4]
    if (task?.type !== 'task' || !task.interaction || task.interaction.type !== 'number-line') throw new Error('expected number line')
    task.interaction.correct = { numerator: 1, denominator: 3 }
    expect(parseLesson(broken).ok).toBe(false)
  })

  it('rejects theme colors that fail contrast or try to inject CSS', () => {
    const broken = structuredClone(raw)
    broken.theme.colors.text = '#ffffff'
    expect(parseLesson(broken).ok).toBe(false)
    broken.theme.colors.text = '#fff; color: red'
    expect(parseLesson(broken).ok).toBe(false)
  })
})

describe('sample lesson mathematics', () => {
  const parsed = parseLesson(raw)
  if (!parsed.ok) throw new Error(parsed.errors.join('\n'))
  const tasks = taskSlides(parsed.lesson)

  it('grades the fraction story in teaching order', () => {
    const [identify, fifths, eighths, line, tenths] = tasks
    expect(checkAnswer(identify!.interaction, 'one-fourth').status).toBe('correct')
    expect(checkAnswer(fifths!.interaction, 'three-tenths').status).toBe('incorrect')
    expect(checkAnswer(eighths!.interaction, '10/16').status).toBe('correct')
    expect(checkAnswer(eighths!.interaction, '0.625').status).toBe('correct')
    expect(checkAnswer(line!.interaction, '3').status).toBe('correct')
    expect(checkAnswer(tenths!.interaction, 'seven-tenths').status).toBe('correct')
    expect(addRationals({ numerator: 1, denominator: 5 }, { numerator: 2, denominator: 5 })).toEqual({ numerator: 3, denominator: 5 })
    expect(addRationals({ numerator: 1, denominator: 4 }, { numerator: 2, denominator: 4 })).toEqual({ numerator: 3, denominator: 4 })
    expect(addRationals({ numerator: 4, denominator: 10 }, { numerator: 3, denominator: 10 })).toEqual({ numerator: 7, denominator: 10 })
  })
})

describe('supabase configuration', () => {
  it('stays disconnected without a real https anon key', () => {
    expect(readSupabaseConfig({})).toBeNull()
    expect(readSupabaseConfig({ url: 'http://example.supabase.co', anonKey: 'a.b.c' })).toBeNull()
    expect(createSupabaseClient(null)).toBeNull()
    const config = readSupabaseConfig({ url: 'https://example.supabase.co', anonKey: 'a.b.c' })
    expect(config?.url).toBe('https://example.supabase.co')
  })
})
