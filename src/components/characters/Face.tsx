import type { CharacterMood } from './mood.ts'

const INK = '#1A2340'

function Eye({ x, y, mood }: { x: number; y: number; mood: CharacterMood }) {
  if (mood === 'celebrate' || mood === 'proud') {
    return <path d={`M${x - 7} ${y + 2} Q${x} ${y - 8} ${x + 7} ${y + 2}`} fill="none" stroke={INK} strokeWidth="4" strokeLinecap="round" />
  }
  const look = mood === 'thinking' ? -2 : 0
  return (
    <g className="blink" style={{ transformOrigin: `${x}px ${y}px` }}>
      <ellipse cx={x} cy={y} rx="7" ry="8.5" fill={INK} />
      <circle cx={x - 2.2} cy={y - 3 + look} r="2.8" fill="#FFFFFF" />
      <circle cx={x + 2.4} cy={y + 2.6 + look} r="1.2" fill="#FFFFFF" />
    </g>
  )
}

function Mouth({ x, y, mood }: { x: number; y: number; mood: CharacterMood }) {
  if (mood === 'celebrate' || mood === 'proud') {
    return (
      <g>
        <path d={`M${x - 11} ${y - 2} Q${x} ${y + 18} ${x + 11} ${y - 2} Z`} fill="#8B2E3C" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
        <ellipse cx={x} cy={y + 7} rx="5" ry="3" fill="#FF8FA3" />
      </g>
    )
  }
  if (mood === 'encourage') {
    return <path d={`M${x - 8} ${y + 4} Q${x - 4} ${y} ${x} ${y + 4} Q${x + 4} ${y + 8} ${x + 8} ${y + 4}`} fill="none" stroke={INK} strokeWidth="3.5" strokeLinecap="round" />
  }
  if (mood === 'thinking') {
    return <path d={`M${x - 6} ${y + 3} Q${x + 2} ${y + 8} ${x + 9} ${y}`} fill="none" stroke={INK} strokeWidth="3.5" strokeLinecap="round" />
  }
  return <path d={`M${x - 10} ${y} Q${x} ${y + 12} ${x + 10} ${y}`} fill="none" stroke={INK} strokeWidth="3.5" strokeLinecap="round" />
}

/** A big-eyed cartoon face centred on (x, y): eyes sit on that line, the mouth below it. */
export function Face({ x, y, mood, spread = 14 }: { x: number; y: number; mood: CharacterMood; spread?: number }) {
  return (
    <g>
      <ellipse cx={x - spread - 9} cy={y + 12} rx="7" ry="4.5" fill="#FF8FA3" opacity="0.7" />
      <ellipse cx={x + spread + 9} cy={y + 12} rx="7" ry="4.5" fill="#FF8FA3" opacity="0.7" />
      <Eye x={x - spread} y={y} mood={mood} />
      <Eye x={x + spread} y={y} mood={mood} />
      <Mouth x={x} y={y + 16} mood={mood} />
    </g>
  )
}
