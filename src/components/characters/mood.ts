import type { FeedbackKind } from '../../schemas/progress.schema.ts'
import type { Slide } from '../../schemas/lesson.schema.ts'
import type { Theme } from '../../schemas/theme.schema.ts'

export type CharacterMood = keyof Theme['phrases']

export function characterMood(
  slideType: Slide['type'],
  feedbackKind: FeedbackKind | null,
): CharacterMood {
  if (slideType === 'intro') return 'welcome'
  if (slideType === 'outro') return 'proud'
  if (feedbackKind === 'correct') return 'celebrate'
  if (feedbackKind === 'incorrect' || feedbackKind === 'reveal' || feedbackKind === 'invalid') return 'encourage'
  return 'thinking'
}
