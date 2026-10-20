import { taskSlides, type Lesson } from '../schemas/lesson.schema.ts'
import { type SavedProgress, type TaskState } from '../schemas/progress.schema.ts'
import { createInitialState, type LessonPlayerState } from '../features/lesson-player/lesson-reducer.ts'

export type ReconciledSession = {
  state: LessonPlayerState
  notice: string | null
}

export function chooseProgressSource(
  localUpdatedAt: string | null,
  remoteUpdatedAt: string | null,
  userEdited: boolean,
): 'local' | 'remote' {
  if (!remoteUpdatedAt) return 'local'
  if (userEdited) return 'local'
  if (!localUpdatedAt) return 'remote'
  return remoteUpdatedAt > localUpdatedAt ? 'remote' : 'local'
}

export function reconcileProgress(lesson: Lesson, saved: SavedProgress | null): ReconciledSession {
  const fresh = createInitialState(lesson)
  if (!saved || saved.lessonId !== lesson.id) {
    return { state: fresh, notice: null }
  }

  const tasks: Record<string, TaskState> = { ...fresh.tasks }
  for (const slide of taskSlides(lesson)) {
    const stored = saved.tasks[slide.id]
    if (stored) tasks[slide.id] = stored
  }

  const versionChanged = saved.lessonVersion !== lesson.version
  const slideExists = lesson.slides.some((slide) => slide.id === saved.slideId)
  const slideId = slideExists ? saved.slideId : fallbackSlideId(lesson, tasks)

  return {
    state: {
      lessonId: lesson.id,
      lessonVersion: lesson.version,
      slideId,
      tasks,
    },
    notice: versionChanged ? 'This mission was updated. We kept the challenges you already finished.' : null,
  }
}

function fallbackSlideId(lesson: Lesson, tasks: Record<string, TaskState>): string {
  const anyCompleted = taskSlides(lesson).some((slide) => tasks[slide.id]?.completed)
  if (!anyCompleted) return lesson.slides[0]?.id ?? ''
  const incomplete = taskSlides(lesson).find((slide) => !tasks[slide.id]?.completed)
  if (incomplete) return incomplete.id
  return lesson.slides[lesson.slides.length - 1]?.id ?? lesson.slides[0]?.id ?? ''
}
