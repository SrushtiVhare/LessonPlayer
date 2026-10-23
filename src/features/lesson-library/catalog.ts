import rawLesson from '../../lessons/space-fractions.json' with { type: 'json' }
import { parseLesson, type Lesson } from '../../schemas/lesson.schema.ts'
import { readCachedLesson } from '../../lib/storage.ts'

function loadBundled(data: unknown, name: string): Lesson {
  const parsed = parseLesson(data)
  if (!parsed.ok) {
    throw new Error(`Bundled lesson ${name} is invalid:\n${parsed.errors.join('\n')}`)
  }
  return parsed.lesson
}

const extraFiles = import.meta.glob<{ default: unknown }>(['../../lessons/*.json', '!../../lessons/space-fractions.json'], { eager: true })

function loadExtras(): Lesson[] {
  return Object.entries(extraFiles).flatMap(([path, module]) => {
    const parsed = parseLesson(module.default)
    if (parsed.ok) return [parsed.lesson]
    console.warn(`Skipped ${path} because it is not a valid lesson:\n${parsed.errors.join('\n')}`)
    return []
  })
}

const mainLesson = loadBundled(rawLesson, 'space-fractions')
export const extraLessons: Lesson[] = loadExtras()
export const bundledLessons: Lesson[] = [mainLesson, ...extraLessons]

/** Extra lesson files bring their own story, so world skins written for the main lesson must not cover them. */
export function keepsOwnStory(id: string): boolean {
  return extraLessons.some((lesson) => lesson.id === id)
}

export function getBundledLesson(id: string): Lesson | undefined {
  return bundledLessons.find((lesson) => lesson.id === id)
}

export function resolveLesson(id: string): Lesson | null {
  const bundled = getBundledLesson(id) ?? null
  const cached = readCachedLesson(id)
  if (cached && (!bundled || cached.version >= bundled.version)) return cached
  return bundled
}

export function mergeLessons(bundled: Lesson[], remote: Lesson[]): Lesson[] {
  const byId = new Map(bundled.map((lesson) => [lesson.id, lesson]))
  for (const lesson of remote) {
    const current = byId.get(lesson.id)
    if (!current || lesson.version >= current.version) byId.set(lesson.id, lesson)
  }
  return [...byId.values()]
}
