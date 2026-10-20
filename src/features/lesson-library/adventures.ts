import rawAdventures from '../../themes/adventures.json' with { type: 'json' }
import { applyAdventure } from '../../lib/apply-adventure.ts'
import { adventureListSchema, type Adventure } from '../../schemas/adventure.schema.ts'
import type { Lesson } from '../../schemas/lesson.schema.ts'

function loadAdventures(data: unknown): Adventure[] {
  const parsed = adventureListSchema.safeParse(data)
  if (!parsed.success) {
    const details = parsed.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('\n')
    throw new Error(`Adventure themes are invalid:\n${details}`)
  }
  return parsed.data
}

export const adventures: Adventure[] = loadAdventures(rawAdventures)

export function getAdventure(id: string | null | undefined): Adventure {
  return adventures.find((adventure) => adventure.id === id) ?? adventures[0]!
}

export function lessonWithAdventure(lesson: Lesson, adventureId: string | null | undefined): Lesson {
  return applyAdventure(lesson, getAdventure(adventureId))
}
