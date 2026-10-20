import { z } from 'zod'
import { themeSchema } from './theme.schema.ts'

const taskSkinSchema = z.object({
  instruction: z.string().trim().min(1).max(180),
  supportingText: z.string().trim().min(1).max(180).optional(),
  readAloud: z.string().trim().min(1).max(420),
})

export const adventureSchema = z
  .object({
    id: z.string().regex(/^[a-z0-9-]+$/).max(40),
    theme: themeSchema,
    story: z.object({
      welcomeTitle: z.string().trim().min(1).max(40),
      welcomeBody: z.string().trim().min(1).max(180),
      lessonTitle: z.string().trim().min(1).max(60),
      lessonDescription: z.string().trim().min(1).max(220),
      introTitle: z.string().trim().min(1).max(60),
      introStory: z.string().trim().min(1).max(320),
      objective: z.string().trim().min(1).max(160),
      introReadAloud: z.string().trim().min(1).max(420),
      outroTitle: z.string().trim().min(1).max(60),
      outroMessage: z.string().trim().min(1).max(180),
      badgeName: z.string().trim().min(1).max(32),
      outroReadAloud: z.string().trim().min(1).max(420),
      slides: z.record(z.string(), taskSkinSchema),
    }),
  })
  .superRefine((adventure, ctx) => {
    if (adventure.theme.id !== adventure.id) {
      ctx.addIssue({ code: 'custom', message: 'The theme id must match the adventure id.', path: ['theme', 'id'] })
    }
  })

export const adventureListSchema = z.array(adventureSchema).min(1).max(6)

export type Adventure = z.infer<typeof adventureSchema>
