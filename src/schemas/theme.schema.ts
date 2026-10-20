import { z } from 'zod'
import { contrastRatio, MINIMUM_TEXT_CONTRAST } from '../lib/contrast.ts'

export const illustrationIds = ['astronaut', 'dino'] as const
export const decorationIds = ['stars', 'planets'] as const

const hexColor = z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Use a #RRGGBB color.')

const colorSchema = z.object({
  primary: hexColor,
  onPrimary: hexColor,
  secondary: hexColor,
  background: hexColor,
  surface: hexColor,
  accent: hexColor,
  onAccent: hexColor,
  text: hexColor,
  textMuted: hexColor,
  success: hexColor,
  successSurface: hexColor,
  hint: hexColor,
  hintSurface: hexColor,
  reveal: hexColor,
  revealSurface: hexColor,
  incorrect: hexColor,
  incorrectSurface: hexColor,
})

export const themeSchema = z
  .object({
    id: z.string().regex(/^[a-z0-9-]+$/).max(40),
    colors: colorSchema,
    character: z.object({
      name: z.string().trim().min(1).max(24),
      description: z.string().trim().min(1).max(180),
      illustration: z.enum(illustrationIds),
    }),
    decorations: z.array(z.enum(decorationIds)).max(4),
    background: z.enum(['starfield', 'plain']),
    buttons: z.object({
      radius: z.enum(['md', 'lg', 'pill']),
    }),
    cards: z.object({
      radius: z.enum(['lg', 'xl']),
      shadow: z.enum(['soft', 'none']),
    }),
    celebration: z.object({
      style: z.enum(['stars', 'confetti']),
    }),
    sound: z.object({
      celebration: z.boolean(),
    }),
    phrases: z.object({
      welcome: z.string().trim().min(1).max(90),
      thinking: z.string().trim().min(1).max(90),
      encourage: z.string().trim().min(1).max(90),
      celebrate: z.string().trim().min(1).max(90),
      proud: z.string().trim().min(1).max(90),
    }),
  })
  .superRefine((theme, ctx) => {
    const pairs = [
      ['text', 'background', 'Text on the background'],
      ['text', 'surface', 'Text on cards'],
      ['textMuted', 'surface', 'Muted text on cards'],
      ['textMuted', 'background', 'Muted text on the background'],
      ['onPrimary', 'primary', 'Text on primary buttons'],
      ['onAccent', 'accent', 'Text on accent buttons'],
      ['success', 'successSurface', 'Success feedback'],
      ['hint', 'hintSurface', 'Hint feedback'],
      ['reveal', 'revealSurface', 'Answer feedback'],
      ['incorrect', 'incorrectSurface', 'Try-again feedback'],
    ] as const

    for (const [foreground, background, label] of pairs) {
      const ratio = contrastRatio(theme.colors[foreground], theme.colors[background])
      if (ratio < MINIMUM_TEXT_CONTRAST) {
        ctx.addIssue({
          code: 'custom',
          message: `${label} contrast is ${ratio.toFixed(2)}. It needs to be at least 4.5.`,
          path: ['colors', foreground],
        })
      }
    }
  })

export type Theme = z.infer<typeof themeSchema>
