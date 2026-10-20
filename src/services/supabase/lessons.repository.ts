import { parseLesson, type Lesson } from '../../schemas/lesson.schema.ts'
import { writeCachedLesson } from '../../lib/storage.ts'
import { isSupabaseConfigured, supabase } from './client.ts'

type LessonResult =
  | { status: 'skipped' }
  | { status: 'ok'; lessons: Lesson[] }
  | { status: 'error' }

export async function fetchPublishedLessons(): Promise<LessonResult> {
  if (!isSupabaseConfigured || !supabase) return { status: 'skipped' }
  const { data, error } = await supabase
    .from('lessons')
    .select('lesson_data')
    .eq('published', true)
    .limit(20)

  if (error || !data) return { status: 'error' }

  const lessons: Lesson[] = []
  for (const row of data) {
    if (!row || typeof row !== 'object' || !('lesson_data' in row)) continue
    const parsed = parseLesson(row.lesson_data)
    if (!parsed.ok) continue
    lessons.push(parsed.lesson)
    writeCachedLesson(parsed.lesson)
  }
  return { status: 'ok', lessons }
}

export async function refreshRemoteLesson(id: string): Promise<Lesson | null> {
  const result = await fetchPublishedLessons()
  if (result.status !== 'ok') return null
  return result.lessons.find((lesson) => lesson.id === id) ?? null
}
