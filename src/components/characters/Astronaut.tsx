import { Face } from './Face.tsx'
import type { CharacterMood } from './mood.ts'

const INK = '#1A2340'

export function Astronaut({ mood }: { mood: CharacterMood }) {
  return (
    <svg viewBox="0 0 160 180" className="h-full w-full" aria-hidden="true">
      <ellipse cx="80" cy="170" rx="42" ry="7" fill={INK} opacity="0.12" />
      <rect x="40" y="150" width="28" height="18" rx="9" fill="#F2F0FF" stroke={INK} strokeWidth="4" />
      <rect x="92" y="150" width="28" height="18" rx="9" fill="#F2F0FF" stroke={INK} strokeWidth="4" />
      <path d="M44 112 h72 a16 16 0 0 1 16 16 v14 a14 14 0 0 1 -14 14 H42 a14 14 0 0 1 -14 -14 v-14 a16 16 0 0 1 16 -16z" fill="#F2F0FF" stroke={INK} strokeWidth="4" />
      <rect x="62" y="122" width="36" height="22" rx="7" fill="var(--wq-primary)" stroke={INK} strokeWidth="3" />
      <circle cx="72" cy="133" r="4" fill="var(--wq-accent)" />
      <circle cx="88" cy="133" r="4" fill="#FF6B6B" />
      <path d="M30 124 l-12 18" stroke={INK} strokeWidth="18" strokeLinecap="round" />
      <path d="M30 124 l-12 18" stroke="#F2F0FF" strokeWidth="11" strokeLinecap="round" />
      <g className="wave-right">
        <path d={mood === 'celebrate' ? 'M130 122 l16 -26' : 'M130 122 l14 -16'} stroke={INK} strokeWidth="18" strokeLinecap="round" />
        <path d={mood === 'celebrate' ? 'M130 122 l16 -26' : 'M130 122 l14 -16'} stroke="#F2F0FF" strokeWidth="11" strokeLinecap="round" />
      </g>
      <path d="M80 14 v12" stroke={INK} strokeWidth="4" />
      <path d="M80 2 l3.5 7 l7.5 1 l-5.5 5 l1.5 7.5 l-7 -3.5 l-7 3.5 l1.5 -7.5 l-5.5 -5 l7.5 -1z" fill="var(--wq-accent)" stroke={INK} strokeWidth="2.5" strokeLinejoin="round" />
      <circle cx="80" cy="70" r="48" fill="#F2F0FF" stroke={INK} strokeWidth="4" />
      <circle cx="80" cy="72" r="38" fill="#BFE6FF" stroke={INK} strokeWidth="3.5" />
      <circle cx="80" cy="76" r="30" fill="#FFE3C4" />
      <Face x={80} y={72} mood={mood} spread={12} />
      <path d="M54 50 a30 30 0 0 1 18 -12" fill="none" stroke="#FFFFFF" strokeWidth="6" strokeLinecap="round" opacity="0.9" />
    </svg>
  )
}
