import { scoreLesson } from '../../lib/scoring.ts'
import type { Lesson } from '../../schemas/lesson.schema.ts'
import { savedProgressSchema, type SavedProgress } from '../../schemas/progress.schema.ts'
import { isSupabaseConfigured, supabase } from './client.ts'

export type RemoteProgressResult =
  | { status: 'empty' }
  | { status: 'ok'; progress: SavedProgress }
  | { status: 'disabled' }
  | { status: 'error' }

async function ensureUserId(): Promise<string | null> {
  if (!supabase) return null
  const existing = await supabase.auth.getSession()
  if (existing.data.session?.user.id) return existing.data.session.user.id
  const signedIn = await supabase.auth.signInAnonymously()
  if (signedIn.error || !signedIn.data.user) return null
  return signedIn.data.user.id
}

export async function pullRemoteProgress(lessonId: string): Promise<RemoteProgressResult> {
  if (!isSupabaseConfigured || !supabase) return { status: 'disabled' }
  try {
    const userId = await ensureUserId()
    if (!userId) return { status: 'disabled' }
    const { data, error } = await supabase
      .from('lesson_progress')
      .select('lesson_id, lesson_version, current_slide_id, task_results, updated_at')
      .eq('lesson_id', lessonId)
      .maybeSingle()
    if (error) return { status: 'error' }
    if (!data) return { status: 'empty' }
    const parsed = savedProgressSchema.safeParse({
      lessonId: data.lesson_id,
      lessonVersion: data.lesson_version,
      slideId: data.current_slide_id,
      tasks: data.task_results,
      updatedAt: data.updated_at,
    })
    if (!parsed.success) return { status: 'error' }
    return { status: 'ok', progress: parsed.data }
  } catch {
    return { status: 'error' }
  }
}

export async function pushRemoteProgress(lesson: Lesson, progress: SavedProgress): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return false
  try {
    const userId = await ensureUserId()
    if (!userId) return false
    const score = scoreLesson(lesson, progress.tasks)
    const { error } = await supabase.from('lesson_progress').upsert(
      {
        user_id: userId,
        lesson_id: lesson.id,
        lesson_version: lesson.version,
        current_slide_id: progress.slideId,
        task_results: progress.tasks,
        completed_tasks: score.completed,
        first_try_correct_count: score.firstTryCorrect,
        completed_at: score.completed === score.total && score.total > 0 ? progress.updatedAt : null,
        updated_at: progress.updatedAt,
      },
      { onConflict: 'user_id,lesson_id' },
    )
    return !error
  } catch {
    return false
  }
}
