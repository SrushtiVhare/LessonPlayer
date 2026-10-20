import type { CharacterMood } from './mood.ts'

export function Astronaut({ mood }: { mood: CharacterMood }) {
  const smile =
    mood === 'celebrate' || mood === 'proud'
      ? 'M68 86 Q80 100 92 86'
      : mood === 'encourage'
        ? 'M70 90 Q80 82 90 90'
        : mood === 'thinking'
          ? 'M70 88 H90'
          : 'M68 86 Q80 96 92 86'
  const eyeY = mood === 'thinking' ? 70 : 76

  return (
    <svg viewBox="0 0 160 180" className="h-36 w-36 sm:h-44 sm:w-44" aria-hidden="true">
      <ellipse cx="80" cy="168" rx="36" ry="8" fill="#1A2340" opacity="0.12" />
      <rect x="28" y="118" width="24" height="34" rx="10" fill="#2A5BD7" />
      <path d="M52 104 h56 a26 26 0 0 1 26 26 v18 H26 v-18 a26 26 0 0 1 26-26z" fill="#3C3489" />
      <circle cx="80" cy="78" r="40" fill="#E7E4F6" stroke="#1A2340" strokeWidth="4" />
      <circle cx="80" cy="80" r="28" fill="#FFF8EA" stroke="#1A2340" strokeWidth="3" />
      <circle cx="70" cy={eyeY} r="3.5" fill="#1A2340" />
      <circle cx="90" cy={eyeY} r="3.5" fill="#1A2340" />
      <path d={smile} fill="none" stroke="#1A2340" strokeWidth="3" strokeLinecap="round" />
      <circle cx="66" cy="64" r="5" fill="#FFFFFF" opacity="0.85" />
      <path d="M112 112 c16 6 22 22 16 36" fill="none" stroke="#E6B325" strokeWidth="8" strokeLinecap="round" className="astro-arm" />
      <circle cx="80" cy="128" r="9" fill="#E6B325" stroke="#1A2340" strokeWidth="3" />
    </svg>
  )
}
