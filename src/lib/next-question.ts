import { getAdventure } from '../features/lesson-library/adventures.ts'
import { createTaskSlide, pickTaskNumbers } from './fresh-lesson.ts'

export type NextOutcome = 'first-try' | 'practice' | 'revealed'

export async function requestNextQuestion(input: {
  adventureId: string
  step: number
  slideId: string
  used: string[]
  previous: string[]
  outcome: NextOutcome
}): Promise<unknown> {
  try {
    const response = await fetch('/api/next-question', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(input),
    })
    if (response.ok) {
      const body: unknown = await response.json()
      if (body !== null && typeof body === 'object' && (body as { type?: unknown }).type === 'task') return body
    }
  } catch {
    // The backup puzzle below still changes the numbers.
  }
  const easy = input.outcome !== 'first-try'
  const numbers = pickTaskNumbers(Date.now(), input.step, input.used, easy)
  return createTaskSlide(getAdventure(input.adventureId), input.step, numbers, Date.now(), input.slideId)
}
