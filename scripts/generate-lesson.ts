/**
 * Ask an LLM for a new lesson, validate it with the same schema the player uses, then save it.
 *
 *   npm run generate:lesson -- --topic "Adding fractions with the same denominator" --grade 4 --theme dino
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { parseArgs } from 'node:util'
import { parseLesson } from '../src/schemas/lesson.schema.ts'

const { values } = parseArgs({
  options: {
    topic: { type: 'string' },
    grade: { type: 'string', default: '4' },
    theme: { type: 'string', default: 'space' },
    out: { type: 'string' },
  },
})

const topic = values.topic?.trim()
const grade = Number(values.grade)
if (!topic || !Number.isInteger(grade) || grade < 1 || grade > 8) {
  console.error('Usage: npm run generate:lesson -- --topic "Adding fractions" --grade 4 [--theme space|dino|soccer] [--out file.json]')
  process.exit(1)
}

const key = process.env.GEMINI_API_KEY?.trim()
if (!key) {
  console.error('Add GEMINI_API_KEY to .env first. A free key is at https://aistudio.google.com/apikey')
  process.exit(1)
}
const model = process.env.GEMINI_MODEL?.trim() || 'gemini-3.5-flash-lite'

const adventures = JSON.parse(readFileSync(new URL('../src/themes/adventures.json', import.meta.url), 'utf8')) as Array<{ id: string; theme: unknown }>
const adventure = adventures.find((item) => item.id === values.theme) ?? adventures[0]!
const theme = adventure.theme as { character: { name: string } }
const sample = JSON.parse(readFileSync(new URL('../src/lessons/space-fractions.json', import.meta.url), 'utf8')) as { slides: unknown[] }
const slug = `${topic}-grade-${grade}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40)
const out = values.out ?? `src/lessons/${slug}.json`

function prompt(errors: string[]): string {
  return [
    `Write one short interactive math lesson for grade ${grade} about: ${topic}.`,
    `The hero is ${theme.character.name}. Make it a fun little story for kids, with very little text per slide.`,
    'Return JSON only, shaped exactly like this example (same keys, same slide types):',
    JSON.stringify({ title: '...', description: '...', topic: '...', objectives: ['...'], slides: sample.slides }),
    'Rules:',
    '- slides: one intro first, then exactly 5 task slides, then one outro last.',
    '- Use at least three interaction types from: multiple-choice, numeric-input, number-line, shade.',
    '- shade looks like {"type":"shade","prompt":"...","segments":8,"correct":{"numerator":3,"denominator":8}}.',
    '- Every task has hint, optional secondHint, a one-line explanation, answerLabel, and readAloud.',
    '- Every answer must be mathematically correct. multiple-choice has 3 or 4 options with one correctOptionId.',
    '- ids use lowercase letters, numbers, and dashes only.',
    errors.length > 0 ? `Your last answer failed these checks. Fix them:\n${errors.join('\n')}` : '',
  ].join('\n')
}

async function ask(text: string): Promise<unknown> {
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: 'POST',
    signal: AbortSignal.timeout(90_000),
    headers: { 'content-type': 'application/json', 'x-goog-api-key': key! },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text }] }],
      generationConfig: { temperature: 0.8, maxOutputTokens: 8192, responseMimeType: 'application/json' },
    }),
  })
  if (!response.ok) throw new Error(`The AI service answered ${response.status}.`)
  const payload = (await response.json()) as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> }
  const raw = payload.candidates?.[0]?.content?.parts?.map((part) => part.text ?? '').join('') ?? ''
  const start = raw.indexOf('{')
  const end = raw.lastIndexOf('}')
  return JSON.parse(start >= 0 && end > start ? raw.slice(start, end + 1) : raw)
}

async function main(): Promise<boolean> {
  let errors: string[] = []
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    console.log(attempt === 1 ? `Asking ${model} for a lesson...` : 'Fixing the problems and asking again...')
    let draft: unknown
    try {
      draft = await ask(prompt(errors))
    } catch (error) {
      errors = [error instanceof Error ? error.message : 'The AI answer could not be read.']
      continue
    }
    const parsed = parseLesson({ ...(draft as object), id: slug, version: 1, grade, theme: adventure.theme })
    if (parsed.ok) {
      writeFileSync(out, `${JSON.stringify(parsed.lesson, null, 2)}\n`)
      console.log(`Saved a valid lesson to ${out}. Play it at http://localhost:5173/lesson/${slug}`)
      return true
    }
    errors = parsed.errors
  }
  console.error(`The lesson did not pass the checks, so nothing was saved:\n${errors.join('\n')}`)
  return false
}

process.exitCode = (await main()) ? 0 : 1
