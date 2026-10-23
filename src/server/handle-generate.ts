import {
  buildFreshLesson,
  cleanChapter,
  createTaskSlide,
  fallbackChapter,
  pickTaskNumbers,
  swapTask,
  type Chapter,
  type TaskNumbers,
} from '../lib/fresh-lesson.ts'
import { getAdventure } from '../features/lesson-library/adventures.ts'
import { parseLesson } from '../schemas/lesson.schema.ts'
import type { Adventure } from '../schemas/adventure.schema.ts'

const DEFAULT_MODEL = 'gemini-3.5-flash-lite'

type GenerateResult = { status: number; body: unknown }

function modelText(payload: unknown): string {
  const root = payload !== null && typeof payload === 'object' ? (payload as { candidates?: unknown }) : null
  const candidate = Array.isArray(root?.candidates) ? root.candidates[0] : null
  const content = candidate !== null && typeof candidate === 'object' ? (candidate as { content?: { parts?: unknown } }).content : null
  const parts = Array.isArray(content?.parts) ? content.parts : []
  return parts
    .map((part) => (part !== null && typeof part === 'object' && typeof (part as { text?: unknown }).text === 'string' ? (part as { text: string }).text : ''))
    .join('')
}

async function postModel(key: string, model: string, prompt: string, fast: boolean): Promise<Response | null> {
  try {
    return await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: 'POST',
      signal: AbortSignal.timeout(6000),
      headers: { 'content-type': 'application/json', 'x-goog-api-key': key },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 1,
          maxOutputTokens: 600,
          responseMimeType: 'application/json',
          ...(fast ? { thinkingConfig: { thinkingLevel: 'minimal' } } : {}),
        },
      }),
    })
  } catch {
    return null
  }
}

/** Small JSON answers with minimal thinking come back in about a second. */
async function callModel(key: string, model: string, prompt: string): Promise<unknown> {
  let response = await postModel(key, model, prompt, true)
  if (response?.status === 400) response = await postModel(key, model, prompt, false)
  if (!response?.ok) return null
  const text = modelText(await response.json().catch(() => null))
  try {
    const trimmed = text.trim().replace(/^```(?:json)?/i, '').replace(/```$/i, '').trim()
    const start = trimmed.indexOf('{')
    const end = trimmed.lastIndexOf('}')
    return JSON.parse(start >= 0 && end > start ? trimmed.slice(start, end + 1) : trimmed)
  } catch {
    return null
  }
}

function readAdventure(body: unknown): Adventure {
  const record = body !== null && typeof body === 'object' ? (body as Record<string, unknown>) : {}
  return getAdventure(typeof record.adventureId === 'string' ? record.adventureId : 'space')
}

function worldLine(adventure: Adventure): string {
  return `World: ${adventure.story.lessonTitle}. Hero: ${adventure.theme.character.name}, ${adventure.theme.character.description}`
}

const STORY_RULES = [
  'Write for kids aged 8 to 10. Funny, warm, a little silly, full of action.',
  'Use short sentences. No scary parts.',
  'Never write any numbers, digits, or number words such as one, two, half, or third. The app adds the math.',
].join('\n')

const STEP_FOCUS = [
  'The hero finds something split into equal pieces and some pieces glow. The child will name the fraction.',
  'The hero wonders how many equal pieces make the whole thing. The child learns what the denominator means.',
  'The hero needs some pieces painted or lit up. The child colors pieces and learns what the numerator means.',
  'The hero collects more pieces of the same size. The child adds them.',
  'A door, robot, or lock needs a secret code. The child types the sum.',
  'A path with evenly spaced stepping marks. The child taps where the hero lands.',
  'A friend shares pieces of the same size. The child adds them in a word problem.',
  'A silly character adds the bottom numbers by mistake. The child spots the mistake.',
  'The goal is almost reached. Another code to type.',
  'The big finale. The last piece makes everything shine again.',
]

export async function handleGenerateLesson(body: unknown, env: Record<string, string>): Promise<GenerateResult> {
  const adventure = readAdventure(body)
  const seed = Date.now()
  const lesson = buildFreshLesson(adventure, seed)
  const key = env.GEMINI_API_KEY?.trim()
  if (!key) return { status: 200, body: lesson }

  const raw = await callModel(
    key,
    env.GEMINI_MODEL?.trim() || DEFAULT_MODEL,
    [
      'You write the opening of a math story adventure.',
      worldLine(adventure),
      STORY_RULES,
      `Chapter one: ${STEP_FOCUS[0]}`,
      'Return JSON only:',
      '{"title":"story title, max 36 letters","intro":"opening scene, max 220 letters","chapterTitle":"max 34 letters","story":"chapter one scene, max 200 letters"}',
    ].join('\n'),
  )
  const record = raw !== null && typeof raw === 'object' ? (raw as Record<string, unknown>) : {}
  const chapter = cleanChapter(raw)
  const title = typeof record.title === 'string' ? record.title.trim() : ''
  const intro = typeof record.intro === 'string' ? record.intro.trim().replace(/\s+/g, ' ') : ''
  const introOk = cleanChapter({ chapterTitle: title, story: intro }) !== null && title.length <= 36 && intro.length <= 300

  let next = lesson
  if (chapter) {
    const numbers = pickTaskNumbers(seed, 1, [], false)
    next = swapTask(next, 'q1', createTaskSlide(adventure, 1, numbers, seed, 'q1', chapter))
  }
  if (introOk) {
    const slides = next.slides.map((slide) =>
      slide.type === 'intro' ? { ...slide, title, story: intro, readAloud: `${intro} ${slide.objective}`.slice(0, 420) } : slide,
    )
    const parsed = parseLesson({ ...next, title, slides })
    if (parsed.ok) next = parsed.lesson
  }
  return { status: 200, body: next }
}

function readNumbers(raw: unknown): TaskNumbers | null {
  if (!raw || typeof raw !== 'object') return null
  const row = raw as Record<string, unknown>
  const denominator = Number(row.denominator)
  const left = Number(row.left)
  const right = Number(row.right)
  const shaded = Number(row.shaded)
  if (!Number.isInteger(denominator) || denominator < 2 || denominator > 12) return null
  if (!Number.isInteger(left) || !Number.isInteger(right) || left < 1 || right < 1 || left + right > denominator) return null
  if (!Number.isInteger(shaded) || shaded < 1 || shaded >= denominator) return null
  return { denominator, left, right, shaded }
}

export async function handleNextQuestion(body: unknown, env: Record<string, string>): Promise<GenerateResult> {
  const record = body !== null && typeof body === 'object' ? (body as Record<string, unknown>) : {}
  const adventure = readAdventure(body)
  const stepValue = Number(record.step)
  const step = Number.isInteger(stepValue) && stepValue >= 1 && stepValue <= 10 ? stepValue : 1
  const slideId = typeof record.slideId === 'string' && /^q\d+$/.test(record.slideId) ? record.slideId : `q${step}`
  const used = Array.isArray(record.used) ? record.used.filter((item): item is string => typeof item === 'string').slice(0, 12) : []
  const previous = Array.isArray(record.previous)
    ? record.previous.filter((item): item is string => typeof item === 'string').slice(-2).map((item) => item.slice(0, 240))
    : []
  const easy = record.outcome !== 'first-try'
  let numbers = pickTaskNumbers(Date.now(), step, used, easy)
  let chapter: Chapter = fallbackChapter(adventure, step)

  const key = env.GEMINI_API_KEY?.trim()
  if (key) {
    const raw = await callModel(
      key,
      env.GEMINI_MODEL?.trim() || DEFAULT_MODEL,
      [
        `You write chapter ${step} of 10 of a math story adventure and choose the numbers.`,
        worldLine(adventure),
        STORY_RULES,
        previous.length > 0 ? `The story so far: ${previous.join(' ')} Continue it.` : 'This starts the story.',
        `This chapter: ${STEP_FOCUS[step - 1]}`,
        'Numbers: fractions with the same denominator only.',
        easy
          ? 'The child needed help last time, so use a denominator from 2 to 5.'
          : 'The child got the last one right first try, so use a denominator from 5 to 12.',
        used.length > 0 ? `Do not repeat these problems: ${used.slice(-8).join(' | ')}` : '',
        'left and right are at least 1, and left + right is at most the denominator. shaded is at least 1 and less than the denominator.',
        'Return JSON only:',
        '{"chapterTitle":"max 34 letters","story":"max 200 letters, no numbers","denominator":6,"left":1,"right":2,"shaded":3}',
      ].join('\n'),
    )
    const picked = readNumbers(raw)
    if (picked) {
      const addition = `${picked.left}/${picked.denominator} + ${picked.right}/${picked.denominator}`
      const picture = `${picked.shaded} glowing pieces out of ${picked.denominator}`
      const repeated = used.some((item) => item.includes(addition) || item.includes(picture))
      if (!repeated && (!easy || picked.denominator <= 5)) numbers = picked
    }
    chapter = cleanChapter(raw) ?? chapter
  }

  const slide = createTaskSlide(adventure, step, numbers, Date.now(), slideId, chapter)
  const checked = swapTask(buildFreshLesson(adventure, 1), slideId, slide)
  const ready = checked.slides.find((item) => item.id === slideId)
  const accepted = ready?.type === 'task' && ready.instruction === slide.instruction
  return { status: 200, body: accepted ? ready : createTaskSlide(adventure, step, numbers, Date.now(), slideId) }
}
