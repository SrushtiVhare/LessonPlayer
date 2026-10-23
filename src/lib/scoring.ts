import { taskSlides, type Lesson } from '../schemas/lesson.schema.ts'
import type { TaskState } from '../schemas/progress.schema.ts'

export type LessonScore = {
  total: number
  completed: number
  firstTryCorrect: number
  solved: number
}

export function scoreLesson(lesson: Lesson, tasks: Record<string, TaskState | undefined>): LessonScore {
  const slides = taskSlides(lesson)
  return {
    total: slides.length,
    completed: slides.filter((slide) => tasks[slide.id]?.completed).length,
    firstTryCorrect: slides.filter((slide) => tasks[slide.id]?.firstTryCorrect).length,
    solved: slides.filter((slide) => tasks[slide.id]?.solved).length,
  }
}

export function progressLabel(lesson: Lesson, slideId: string): string {
  const slide = lesson.slides.find((item) => item.id === slideId)
  const index = Math.max(0, lesson.slides.findIndex((item) => item.id === slide?.id))
  return `Slide ${index + 1} of ${lesson.slides.length}`
}
