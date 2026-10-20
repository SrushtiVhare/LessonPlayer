import type { CharacterMood } from './mood.ts'

export function Player({ mood }: { mood: CharacterMood }) {
  const smile =
    mood === 'celebrate' || mood === 'proud'
      ? 'M68 84 Q80 98 92 84'
      : mood === 'encourage'
        ? 'M70 88 Q80 80 90 88'
        : 'M68 84 Q80 94 92 84'
  const eyeY = mood === 'thinking' ? 70 : 74

  return (
    <svg viewBox="0 0 160 180" className="h-full w-full" aria-hidden="true">
      <ellipse cx="80" cy="168" rx="36" ry="8" fill="#1A2340" opacity="0.12" />
      <circle cx="118" cy="132" r="16" fill="var(--wq-accent)" stroke="#1A2340" strokeWidth="3" />
      <path d="M112 126 h12 M118 120 v12" stroke="#1A2340" strokeWidth="2" />
      <path d="M48 118 h64 a20 20 0 0 1 20 20 v16 H28 v-16 a20 20 0 0 1 20-20z" fill="var(--wq-primary)" />
      <rect x="46" y="136" width="68" height="16" rx="6" fill="#FFFFFF" stroke="#1A2340" strokeWidth="3" />
      <circle cx="80" cy="74" r="32" fill="#FFE3C4" stroke="#1A2340" strokeWidth="4" />
      <path d="M52 70 Q80 48 108 70" fill="var(--wq-secondary)" stroke="#1A2340" strokeWidth="3" />
      <circle cx="70" cy={eyeY} r="3.5" fill="#1A2340" />
      <circle cx="90" cy={eyeY} r="3.5" fill="#1A2340" />
      <path d={smile} fill="none" stroke="#1A2340" strokeWidth="3" strokeLinecap="round" />
      <path d="M108 124 l18 20" stroke="var(--wq-accent)" strokeWidth="8" strokeLinecap="round" className="astro-arm" />
    </svg>
  )
}
