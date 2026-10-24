import { Face } from './Face.tsx'
import type { CharacterMood } from './mood.ts'

const INK = '#1A2340'

export function Player({ mood }: { mood: CharacterMood }) {
  return (
    <svg viewBox="0 0 160 180" className="h-full w-full" aria-hidden="true">
      <ellipse cx="80" cy="170" rx="42" ry="7" fill={INK} opacity="0.12" />
      <rect x="48" y="150" width="24" height="18" rx="9" fill="#FFFFFF" stroke={INK} strokeWidth="4" />
      <rect x="88" y="150" width="24" height="18" rx="9" fill="#FFFFFF" stroke={INK} strokeWidth="4" />
      <path d="M46 110 h68 a18 18 0 0 1 18 18 v14 a12 12 0 0 1 -12 12 H40 a12 12 0 0 1 -12 -12 v-14 a18 18 0 0 1 18 -18z" fill="var(--wq-primary)" stroke={INK} strokeWidth="4" />
      <path d="M68 110 l12 12 l12 -12" fill="none" stroke="#FFFFFF" strokeWidth="4" strokeLinejoin="round" />
      <text x="80" y="148" textAnchor="middle" fontFamily="Fredoka, sans-serif" fontSize="22" fontWeight="700" fill="#FFFFFF">
        4
      </text>
      <path
        d={mood === 'celebrate' ? 'M32 120 l-14 -26' : 'M32 122 l-12 16'}
        stroke="#FFE3C4"
        strokeWidth="12"
        strokeLinecap="round"
        className={mood === 'celebrate' ? 'wave-left' : undefined}
      />
      <g className="ball-spin" style={{ transformOrigin: '134px 146px' }}>
        <circle cx="134" cy="146" r="18" fill="#FFFFFF" stroke={INK} strokeWidth="4" />
        <path d="M134 137 l8 6 l-3 9 h-10 l-3 -9z" fill={INK} />
      </g>
      <circle cx="80" cy="66" r="44" fill="#FFE3C4" stroke={INK} strokeWidth="4" />
      <path d="M36 62 Q38 18 80 18 Q122 18 124 62 Q110 44 80 42 Q50 44 36 62z" fill="#6B3E26" stroke={INK} strokeWidth="4" strokeLinejoin="round" />
      <path d="M38 52 Q80 34 122 52" fill="none" stroke="var(--wq-accent)" strokeWidth="7" strokeLinecap="round" />
      <Face x={80} y={70} mood={mood} spread={14} />
    </svg>
  )
}
