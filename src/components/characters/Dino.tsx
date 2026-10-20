import type { CharacterMood } from './mood.ts'

export function Dino({ mood }: { mood: CharacterMood }) {
  const smile = mood === 'encourage' ? 'M68 86 Q80 80 92 86' : 'M66 82 Q80 96 94 82'
  return (
    <svg viewBox="0 0 160 180" className="h-36 w-36 sm:h-44 sm:w-44" aria-hidden="true">
      <ellipse cx="82" cy="168" rx="34" ry="8" fill="#1A2340" opacity="0.12" />
      <path d="M120 120 C148 110 150 150 124 146" fill="#3C3489" />
      <ellipse cx="78" cy="112" rx="40" ry="34" fill="#2A5BD7" />
      <circle cx="78" cy="70" r="32" fill="#7DDE92" stroke="#1A2340" strokeWidth="4" />
      <circle cx="68" cy="66" r="4" fill="#1A2340" />
      <circle cx="90" cy="66" r="4" fill="#1A2340" />
      <path d={smile} fill="none" stroke="#1A2340" strokeWidth="3" strokeLinecap="round" />
      <path d="M58 48 L66 28 L74 48" fill="#E6B325" />
      <path d="M74 46 L82 24 L90 46" fill="#E6B325" />
      {mood === 'celebrate' ? <path d="M40 70 h16" stroke="#E6B325" strokeWidth="4" strokeLinecap="round" /> : null}
    </svg>
  )
}
