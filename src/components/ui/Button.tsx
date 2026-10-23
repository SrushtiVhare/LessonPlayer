import type { ButtonHTMLAttributes } from 'react'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'accent' | 'ghost'
}

const variants = {
  primary: 'border-black/25 bg-primary text-on-primary',
  accent: 'border-black/20 bg-accent text-on-accent',
  ghost: 'border-black/10 bg-surface text-ink',
} as const

export function Button({ variant = 'primary', className = '', type = 'button', ...props }: ButtonProps) {
  return (
    <button
      type={type}
      className={`inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl border-2 border-b-[6px] px-5 py-3 text-lg font-extrabold transition active:translate-y-0.5 active:border-b-2 disabled:cursor-not-allowed disabled:border-black/10 disabled:bg-black/5 disabled:text-muted ${variants[variant]} ${className}`}
      {...props}
    />
  )
}
