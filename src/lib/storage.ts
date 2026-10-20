import { savedProgressSchema, type SavedProgress } from '../schemas/progress.schema.ts'
import { parseLesson, type Lesson } from '../schemas/lesson.schema.ts'

const PROGRESS_PREFIX = 'wonderquest.progress.'
const LESSON_CACHE_PREFIX = 'wonderquest.lesson.'
const SOUND_KEY = 'wonderquest.sound'

function memory(): Storage | null {
  try {
    if (typeof localStorage === 'undefined') return null
    return localStorage
  } catch {
    return null
  }
}

export type ProgressRead =
  | { status: 'empty' }
  | { status: 'invalid' }
  | { status: 'ok'; progress: SavedProgress }

export function readLocalProgress(lessonId: string): ProgressRead {
  const store = memory()
  if (!store) return { status: 'empty' }
  try {
    const raw = store.getItem(PROGRESS_PREFIX + lessonId)
    if (!raw) return { status: 'empty' }
    const parsed = savedProgressSchema.safeParse(JSON.parse(raw))
    if (!parsed.success || parsed.data.lessonId !== lessonId) return { status: 'invalid' }
    return { status: 'ok', progress: parsed.data }
  } catch {
    return { status: 'invalid' }
  }
}

export function writeLocalProgress(progress: SavedProgress): boolean {
  const store = memory()
  if (!store) return false
  try {
    store.setItem(PROGRESS_PREFIX + progress.lessonId, JSON.stringify(progress))
    return true
  } catch {
    return false
  }
}

export function clearLocalProgress(lessonId: string): void {
  const store = memory()
  if (!store) return
  try {
    store.removeItem(PROGRESS_PREFIX + lessonId)
  } catch {
    // Ignore private-mode storage failures. The session still works in memory.
  }
}

export function readSoundEnabled(): boolean {
  const store = memory()
  if (!store) return false
  try {
    return store.getItem(SOUND_KEY) === 'on'
  } catch {
    return false
  }
}

export function writeSoundEnabled(enabled: boolean): void {
  const store = memory()
  if (!store) return
  try {
    store.setItem(SOUND_KEY, enabled ? 'on' : 'off')
  } catch {
    // Sound preference is optional.
  }
}

export function readCachedLesson(lessonId: string): Lesson | null {
  const store = memory()
  if (!store) return null
  try {
    const raw = store.getItem(LESSON_CACHE_PREFIX + lessonId)
    if (!raw) return null
    const parsed = parseLesson(JSON.parse(raw))
    if (!parsed.ok || parsed.lesson.id !== lessonId) return null
    return parsed.lesson
  } catch {
    return null
  }
}

export function writeCachedLesson(lesson: Lesson): void {
  const store = memory()
  if (!store) return
  try {
    store.setItem(LESSON_CACHE_PREFIX + lesson.id, JSON.stringify(lesson))
  } catch {
    // A failed cache write still leaves the bundled lesson available.
  }
}
