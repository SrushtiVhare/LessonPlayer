import { Face } from './Face.tsx'
import type { CharacterMood } from './mood.ts'

const INK = '#1A2340'

export function Dino({ mood }: { mood: CharacterMood }) {
  return (
    <svg viewBox="0 0 160 180" className="h-full w-full" aria-hidden="true">
      <ellipse cx="80" cy="170" rx="44" ry="7" fill={INK} opacity="0.12" />
      <path d="M112 138 C138 136 152 118 150 100 C146 116 132 124 110 122 Z" fill="#5CC97A" stroke={INK} strokeWidth="4" strokeLinejoin="round" />
      <path d="M46 26 l10 -16 l8 18 M66 20 l12 -16 l8 18 M90 24 l12 -12 l4 18" fill="var(--wq-accent)" stroke={INK} strokeWidth="3.5" strokeLinejoin="round" />
      <ellipse cx="80" cy="126" rx="42" ry="38" fill="#7DDE92" stroke={INK} strokeWidth="4" />
      <ellipse cx="80" cy="134" rx="26" ry="24" fill="#E9F9C9" />
      <path d="M68 124 h24 M66 136 h28 M70 148 h20" stroke="#BFE59E" strokeWidth="3" strokeLinecap="round" />
      <rect x="52" y="154" width="22" height="16" rx="8" fill="#5CC97A" stroke={INK} strokeWidth="4" />
      <rect x="86" y="154" width="22" height="16" rx="8" fill="#5CC97A" stroke={INK} strokeWidth="4" />
      <circle cx="80" cy="66" r="46" fill="#7DDE92" stroke={INK} strokeWidth="4" />
      <circle cx="112" cy="44" r="6" fill="#5CC97A" />
      <circle cx="48" cy="40" r="4" fill="#5CC97A" />
      <Face x={80} y={62} mood={mood} spread={15} />
      <path
        d={mood === 'celebrate' ? 'M42 112 l-16 -22' : 'M42 118 l-12 10'}
        stroke="#5CC97A"
        strokeWidth="10"
        strokeLinecap="round"
        className={mood === 'celebrate' ? 'wave-left' : undefined}
      />
      <path d="M118 118 l12 10" stroke="#5CC97A" strokeWidth="10" strokeLinecap="round" />
    </svg>
  )
}
