import { buildLessonPrompt, prepareForAdventure } from './prepare-lesson.ts'
import { getAdventure } from '../features/lesson-library/adventures.ts'

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

async function callModel(key: string, model: string, prompt: string): Promise<{ ok: true; raw: unknown } | { ok: false; error: string }> {
  let response: Response
  try {
    response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-goog-api-key': key,
      },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 1,
          maxOutputTokens: 8192,
          responseMimeType: 'application/json',
        },
      }),
    })
  } catch {
    return { ok: false, error: 'The AI service could not be reached. Check the internet connection and try again.' }
  }
  const payload: unknown = await response.json().catch(() => null)
  if (!response.ok) {
    const message = payload !== null && typeof payload === 'object' && 'error' in payload ? JSON.stringify((payload as { error: unknown }).error) : response.statusText
    return { ok: false, error: `The AI service said no. ${message}`.slice(0, 280) }
  }
  const text = modelText(payload)
  if (!text) return { ok: false, error: 'The AI service returned an empty lesson.' }
  try {
    return { ok: true, raw: JSON.parse(text) }
  } catch {
    return { ok: false, error: 'The AI service returned text that was not JSON.' }
  }
}

export async function handleGenerateLesson(body: unknown, env: Record<string, string>): Promise<GenerateResult> {
  const adventureId = body !== null && typeof body === 'object' && typeof (body as { adventureId?: unknown }).adventureId === 'string'
    ? (body as { adventureId: string }).adventureId
    : 'space'
  const adventure = getAdventure(adventureId)
  const key = env.GEMINI_API_KEY?.trim()
  if (!key) {
    return {
      status: 503,
      body: {
        error: 'New puzzles need a Gemini API key. Add GEMINI_API_KEY to the .env file, then restart the app. A free key is at https://aistudio.google.com/apikey',
      },
    }
  }

  const model = env.GEMINI_MODEL?.trim() || DEFAULT_MODEL
  const variation = crypto.randomUUID()
  let errors: string[] = []
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const called = await callModel(key, model, buildLessonPrompt(adventure, variation, errors))
    if (!called.ok) return { status: 502, body: { error: called.error } }
    const prepared = prepareForAdventure(called.raw, adventure.id)
    if (prepared.ok) return { status: 200, body: prepared.lesson }
    errors = prepared.errors.slice(0, 12)
  }
  return {
    status: 422,
    body: { error: `The new puzzles did not pass the math check. ${errors.slice(0, 3).join(' ')}` },
  }
}
