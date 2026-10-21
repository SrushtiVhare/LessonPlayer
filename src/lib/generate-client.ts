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
    return { ok: false, error: 'The puzzle machine could not be reached. Try again.' }
  }
  const payload: unknown = await response.json().catch(() => null)
  if (!response.ok) {
    const message =
      payload !== null && typeof payload === 'object' && 'error' in payload && typeof (payload as { error: unknown }).error === 'string'
        ? (payload as { error: string }).error
        : 'The puzzle machine got stuck. Try again.'
    return { ok: false, error: message }
  }
  const parsed = parseLesson(payload)
  if (!parsed.ok) return { ok: false, error: 'Those puzzles did not pass the math check. Try again.' }
  return { ok: true, lesson: parsed.lesson }
}
