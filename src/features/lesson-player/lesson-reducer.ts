import { submitTask } from '../../lib/grade-task.ts'
import { taskSlides, type Lesson, type Slide } from '../../schemas/lesson.schema.ts'
import { createInitialTaskState, type TaskState } from '../../schemas/progress.schema.ts'

export type LessonPlayerState = {
  lessonId: string
  lessonVersion: number
  slideId: string
  tasks: Record<string, TaskState>
}

export type LessonAction =
  | { type: 'next' }
  | { type: 'back' }
  | { type: 'set-response'; response: string | null }
  | { type: 'submit' }
  | { type: 'show-hint' }
  | { type: 'reset-response' }
  | { type: 'restart' }
  | { type: 'hydrate'; state: LessonPlayerState }

export function createInitialState(lesson: Lesson): LessonPlayerState {
  const tasks: Record<string, TaskState> = {}
  for (const slide of taskSlides(lesson)) {
    tasks[slide.id] = createInitialTaskState()
  }
  return {
    lessonId: lesson.id,
    lessonVersion: lesson.version,
    slideId: lesson.slides[0]?.id ?? '',
    tasks,
  }
}

export function getSlide(lesson: Lesson, slideId: string): Slide | undefined {
  return lesson.slides.find((slide) => slide.id === slideId)
}

export function canGoBack(lesson: Lesson, state: LessonPlayerState): boolean {
  return lesson.slides.findIndex((slide) => slide.id === state.slideId) > 0
}

export function canGoNext(lesson: Lesson, state: LessonPlayerState): boolean {
  return nextSlideId(lesson, state) !== null
}

export function nextSlideId(lesson: Lesson, state: LessonPlayerState): string | null {
  const index = lesson.slides.findIndex((slide) => slide.id === state.slideId)
  if (index < 0 || index >= lesson.slides.length - 1) return null
  const current = lesson.slides[index]
  if (!current) return null
  if (current.type === 'task' && !state.tasks[current.id]?.completed) return null
  const next = lesson.slides[index + 1]
  if (!next) return null
  if (next.type === 'outro' && !allTasksCompleted(lesson, state)) return null
  return next.id
}

export function allTasksCompleted(lesson: Lesson, state: LessonPlayerState): boolean {
  return taskSlides(lesson).every((slide) => state.tasks[slide.id]?.completed)
}

function updateTask(state: LessonPlayerState, taskId: string, task: TaskState): LessonPlayerState {
  return { ...state, tasks: { ...state.tasks, [taskId]: task } }
}

export function lessonReducer(lesson: Lesson, state: LessonPlayerState, action: LessonAction): LessonPlayerState {
  switch (action.type) {
    case 'restart':
      return createInitialState(lesson)
    case 'hydrate': {
      if (action.state.lessonId !== lesson.id) return state
      if (!lesson.slides.some((slide) => slide.id === action.state.slideId)) return state
      const tasks = { ...createInitialState(lesson).tasks }
      for (const slide of taskSlides(lesson)) {
        const saved = action.state.tasks[slide.id]
        if (saved) tasks[slide.id] = saved
      }
      return {
        lessonId: lesson.id,
        lessonVersion: lesson.version,
        slideId: action.state.slideId,
        tasks,
      }
    }
    case 'back': {
      const index = lesson.slides.findIndex((slide) => slide.id === state.slideId)
      const previous = lesson.slides[index - 1]
      if (!previous) return state
      return { ...state, slideId: previous.id }
    }
    case 'next': {
      const slideId = nextSlideId(lesson, state)
      if (!slideId) return state
      return { ...state, slideId }
    }
    case 'set-response':
    case 'submit':
    case 'show-hint':
    case 'reset-response':
      return reduceTaskAction(lesson, state, action)
    default: {
      const unreachable: never = action
      return unreachable
    }
  }
}

function reduceTaskAction(
  lesson: Lesson,
  state: LessonPlayerState,
  action: Extract<LessonAction, { type: 'set-response' | 'submit' | 'show-hint' | 'reset-response' }>,
): LessonPlayerState {
  const slide = getSlide(lesson, state.slideId)
  if (!slide || slide.type !== 'task') return state
  const task = state.tasks[slide.id] ?? createInitialTaskState()

  switch (action.type) {
    case 'set-response': {
      if (task.completed || task.response === action.response) return state
      return updateTask(state, slide.id, { ...task, response: action.response })
    }
    case 'submit':
      return updateTask(state, slide.id, submitTask(slide, task))
    case 'show-hint': {
      if (task.hintVisible && (task.feedbackKind === 'correct' || task.feedbackKind === 'reveal' || task.feedbackKind === 'hint')) {
        return state
      }
      return updateTask(state, slide.id, {
        ...task,
        hintVisible: true,
        feedbackKind: task.feedbackKind === 'correct' || task.feedbackKind === 'reveal' ? task.feedbackKind : 'hint',
      })
    }
    case 'reset-response': {
      if (task.completed) return state
      return updateTask(state, slide.id, {
        ...task,
        response: null,
        lastSubmittedResponse: null,
        feedbackKind: task.hintVisible ? 'hint' : task.feedbackKind === 'invalid' || task.feedbackKind === 'incorrect' ? null : task.feedbackKind,
      })
    }
    default: {
      const unreachable: never = action
      return unreachable
    }
  }
}
