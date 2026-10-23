import { motion, useReducedMotion } from 'framer-motion'

const colors = ['var(--wq-accent)', 'var(--wq-secondary)', 'var(--wq-primary)', 'var(--wq-success)', '#FF7AA2']

export function Confetti({ burst, count = 26 }: { burst: string | number; count?: number }) {
  const reduce = useReducedMotion()
  if (reduce) return null
  return (
    <div key={burst} className="pointer-events-none fixed inset-0 z-30 overflow-hidden" aria-hidden="true">
      {Array.from({ length: count }, (_, index) => {
        const left = (index * 37) % 100
        const drift = ((index * 53) % 120) - 60
        return (
          <motion.span
            key={index}
            className="absolute top-1/3 block h-3 w-2 rounded-sm"
            style={{ left: `${left}%`, background: colors[index % colors.length] }}
            initial={{ y: 0, x: 0, opacity: 1, rotate: 0 }}
            animate={{ y: [0, -160 - (index % 5) * 30, 420], x: drift, opacity: [1, 1, 0], rotate: 360 + index * 20 }}
            transition={{ duration: 1.4, ease: 'easeOut', delay: (index % 6) * 0.03 }}
          />
        )
      })}
    </div>
  )
}
