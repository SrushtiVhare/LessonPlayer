import type { CSSProperties } from 'react'
import type { Theme } from '../../schemas/theme.schema.ts'

const buttonRadius = {
  md: '0.75rem',
  lg: '1.25rem',
  pill: '999px',
} as const

const cardRadius = {
  lg: '1.25rem',
  xl: '1.75rem',
} as const

export function themeToStyle(theme: Theme): CSSProperties {
  const { colors } = theme
  return {
    '--wq-primary': colors.primary,
    '--wq-on-primary': colors.onPrimary,
    '--wq-secondary': colors.secondary,
    '--wq-background': colors.background,
    '--wq-surface': colors.surface,
    '--wq-accent': colors.accent,
    '--wq-on-accent': colors.onAccent,
    '--wq-text': colors.text,
    '--wq-text-muted': colors.textMuted,
    '--wq-success': colors.success,
    '--wq-success-surface': colors.successSurface,
    '--wq-hint': colors.hint,
    '--wq-hint-surface': colors.hintSurface,
    '--wq-reveal': colors.reveal,
    '--wq-reveal-surface': colors.revealSurface,
    '--wq-incorrect': colors.incorrect,
    '--wq-incorrect-surface': colors.incorrectSurface,
    '--wq-radius-button': buttonRadius[theme.buttons.radius],
    '--wq-radius-card': cardRadius[theme.cards.radius],
    '--wq-shadow': theme.cards.shadow === 'none' ? 'none' : '6px 6px 0 var(--wq-primary)',
  } as CSSProperties
}
