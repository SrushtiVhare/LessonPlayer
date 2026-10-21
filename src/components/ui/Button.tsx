import type { ButtonHTMLAttributes } from 'react'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'accent' | 'ghost'
}

const variants = {
  primary: 'bg-primary text-on-primary',
  accent: 'bg-accent text-on-accent',
  ghost: 'bg-surface text-ink',
} as const

export function Button({ variant = 'primary', className = '', type = 'button', ...props }: ButtonProps) {
  return (
    <button
      type={type}
      className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-[var(--wq-radius-button)] border-4 border-ink px-5 py-3 text-lg font-bold shadow-[var(--wq-shadow)] transition active:translate-x-1 active:translate-y-1 active:shadow-none disabled:cursor-not-allowed disabled:border-ink/15 disabled:bg-surface disabled:text-muted disabled:shadow-none ${variants[variant]} ${className}`}
      {...props}
    />
  )
}
