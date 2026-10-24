import type { CSSProperties } from 'react'
import type { Theme } from '../../schemas/theme.schema.ts'

const INK = '#1A2340'

function Cloud({ className, style }: { className: string; style?: CSSProperties }) {
  return (
    <svg viewBox="0 0 120 60" className={className} style={style}>
      <path d="M22 52 a18 18 0 0 1 2 -36 a24 24 0 0 1 44 -6 a18 18 0 0 1 30 12 a16 16 0 0 1 0 30z" fill="#FFFFFF" opacity="0.95" />
    </svg>
  )
}

function Sun() {
  return (
    <svg viewBox="0 0 120 120" className="absolute top-24 -right-6 h-28 w-28 sm:h-36 sm:w-36">
      <g className="spin-slow" style={{ transformOrigin: '60px 60px' }}>
        {Array.from({ length: 12 }, (_, index) => (
          <rect key={index} x="56" y="2" width="8" height="18" rx="4" fill="#FFC93C" transform={`rotate(${index * 30} 60 60)`} />
        ))}
      </g>
      <circle cx="60" cy="60" r="34" fill="#FFD84D" stroke="#F4A91F" strokeWidth="4" />
      <circle cx="49" cy="56" r="3.5" fill={INK} />
      <circle cx="71" cy="56" r="3.5" fill={INK} />
      <ellipse cx="42" cy="66" rx="5" ry="3" fill="#FF8FA3" opacity="0.7" />
      <ellipse cx="78" cy="66" rx="5" ry="3" fill="#FF8FA3" opacity="0.7" />
      <path d="M50 68 Q60 77 70 68" fill="none" stroke={INK} strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

function Planet() {
  return (
    <svg viewBox="0 0 140 100" className="float-slow absolute top-24 -right-8 h-24 w-32 sm:h-32 sm:w-44">
      <circle cx="70" cy="50" r="30" fill="#FF9DD6" stroke={INK} strokeWidth="3" />
      <circle cx="60" cy="40" r="6" fill="#FFC2E8" />
      <circle cx="80" cy="60" r="4" fill="#FFC2E8" />
      <ellipse cx="70" cy="54" rx="62" ry="13" fill="none" stroke="#FFD84D" strokeWidth="6" transform="rotate(-12 70 54)" />
    </svg>
  )
}

function Ground({ world }: { world: Theme['background'] }) {
  if (world === 'starfield') {
    return (
      <svg viewBox="0 0 1440 160" preserveAspectRatio="none" className="absolute inset-x-0 bottom-0 h-20 w-full sm:h-28">
        <path d="M0 80 Q360 20 720 70 T1440 60 V160 H0z" fill="#C9B8FF" />
        <path d="M0 110 Q420 70 820 110 T1440 100 V160 H0z" fill="#B19CFF" />
        <ellipse cx="240" cy="120" rx="40" ry="10" fill="#9F86F5" />
        <ellipse cx="1100" cy="128" rx="54" ry="12" fill="#9F86F5" />
      </svg>
    )
  }
  const far = world === 'pitch' ? '#8EDB7A' : '#9BE58A'
  const near = world === 'pitch' ? '#5DC25A' : '#6BCF63'
  return (
    <svg viewBox="0 0 1440 160" preserveAspectRatio="none" className="absolute inset-x-0 bottom-0 h-24 w-full sm:h-32">
      <path d="M0 70 Q240 10 520 60 T1040 40 T1440 60 V160 H0z" fill={far} />
      <path d="M0 110 Q300 60 640 100 T1440 90 V160 H0z" fill={near} />
      {world === 'pitch' ? <path d="M0 140 H1440" stroke="#FFFFFF" strokeWidth="6" opacity="0.7" /> : null}
    </svg>
  )
}

const floaters = [
  ['18%', '4%', '0s', 'text-4xl'],
  ['52%', '92%', '0.8s', 'text-5xl'],
  ['70%', '3%', '1.4s', 'text-3xl'],
] as const

const extras: Record<Theme['background'], string> = {
  starfield: '⭐',
  jungle: '🌴',
  pitch: '🏆',
  plain: '✨',
}

export function LessonBackground({ theme }: { theme: Theme }) {
  const world = theme.background
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true" data-background={world}>
      {world === 'starfield' ? <Planet /> : <Sun />}
      <Cloud className="drift absolute top-[12%] h-12 w-24 sm:h-16 sm:w-32" style={{ animationDuration: '60s' }} />
      <Cloud className="drift absolute top-[34%] h-10 w-20 opacity-80 sm:h-14 sm:w-28" style={{ animationDuration: '85s', animationDelay: '-30s' }} />
      <Cloud className="drift absolute top-[58%] h-12 w-24 opacity-70" style={{ animationDuration: '110s', animationDelay: '-70s' }} />
      {floaters.map(([top, left, delay, size], index) => (
        <span key={top} className={`float-slow absolute ${size}`} style={{ top, left, animationDelay: delay }} data-decoration={theme.decorations[index % 2]}>
          {index === 1 ? extras[world] : theme.character.emoji ?? '⭐'}
        </span>
      ))}
      <Ground world={world} />
    </div>
  )
}
