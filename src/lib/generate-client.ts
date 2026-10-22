import { buildFreshLesson } from './fresh-lesson.ts'
import { getAdventure } from '../features/lesson-library/adventures.ts'
import { parseLesson, type Lesson } from '../schemas/lesson.schema.ts'

export async function requestGeneratedLesson(adventureId: string): Promise<{ ok: true; lesson: Lesson } | { ok: false; error: string }> {
  let response: Response
  try {
    response = await fetch('/api/generate-lesson', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ adventureId }),
    })
  } catch {
    return { ok: true, lesson: buildFreshLesson(getAdventure(adventureId), Date.now()) }
  }
  const payload: unknown = await response.json().catch(() => null)
  const parsed = parseLesson(payload)
  if (!response.ok || !parsed.ok) return { ok: true, lesson: buildFreshLesson(getAdventure(adventureId), Date.now()) }
  return { ok: true, lesson: parsed.lesson }
}
