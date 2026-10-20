import { z } from 'zod'

export const feedbackKindSchema = z.enum(['invalid', 'incorrect', 'hint', 'reveal', 'correct'])

export const taskStateSchema = z
  .object({
    attempts: z.number().int().min(0).max(3),
    completed: z.boolean(),
    solved: z.boolean(),
    firstTryCorrect: z.boolean(),
    revealed: z.boolean(),
    hintVisible: z.boolean(),
    response: z.string().max(40).nullable(),
    lastSubmittedResponse: z.string().max(40).nullable(),
    feedbackKind: feedbackKindSchema.nullable(),
  })
  .superRefine((task, ctx) => {
    if (task.firstTryCorrect && (!task.solved || !task.completed || task.attempts !== 0 || task.revealed)) {
      ctx.addIssue({ code: 'custom', message: 'First-try progress is inconsistent.' })
    }
    if (task.revealed && (!task.completed || task.solved || task.firstTryCorrect)) {
      ctx.addIssue({ code: 'custom', message: 'Revealed progress is inconsistent.' })
    }
    if (task.solved && (!task.completed || task.revealed)) {
      ctx.addIssue({ code: 'custom', message: 'Solved progress is inconsistent.' })
    }
    if (task.completed && !task.solved && !task.revealed) {
      ctx.addIssue({ code: 'custom', message: 'Completed progress is inconsistent.' })
    }
  })

export const savedProgressSchema = z.object({
  lessonId: z.string().min(1),
  lessonVersion: z.number().int().positive(),
  slideId: z.string().min(1),
  tasks: z.record(z.string(), taskStateSchema),
  updatedAt: z.string().min(1),
})

export type FeedbackKind = z.infer<typeof feedbackKindSchema>
export type TaskState = z.infer<typeof taskStateSchema>
export type SavedProgress = z.infer<typeof savedProgressSchema>

export function createInitialTaskState(): TaskState {
  return {
    attempts: 0,
    completed: false,
    solved: false,
    firstTryCorrect: false,
    revealed: false,
    hintVisible: false,
    response: null,
    lastSubmittedResponse: null,
    feedbackKind: null,
  }
}
