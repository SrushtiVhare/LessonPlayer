import { Lock, Star } from 'lucide-react'

const lift = [0, -10, -16, -10, 0, 10, 16, 10]

export function StoryPath({ total, completed, solved }: { total: number; completed: number; solved: number }) {
  return (
    <ol className="flex flex-wrap justify-center gap-x-2 gap-y-6 py-4" aria-label={`Story path: ${completed} of ${total} chapters done`}>
      {Array.from({ length: total }, (_, index) => {
        const done = index < completed
        const current = index === completed
        return (
          <li key={index} className="relative" style={{ transform: `translateY(${lift[index % lift.length]}px)` }}>
            {current ? <span className="emoji-marker character-float absolute -top-9 left-1/2 -translate-x-1/2 text-3xl" aria-hidden="true" /> : null}
            <span
              className={`grid h-14 w-14 place-items-center rounded-full border-b-[5px] font-display text-xl ${
                done
                  ? 'border-black/25 bg-primary text-on-primary'
                  : current
                    ? 'pulse-ring border-black/20 bg-accent text-on-accent'
                    : 'border-black/10 bg-canvas text-muted'
              }`}
            >
              {done ? (
                <Star aria-hidden="true" size={24} fill={index < solved ? 'var(--wq-accent)' : 'none'} />
              ) : current ? (
                index + 1
              ) : (
                <Lock aria-hidden="true" size={18} />
              )}
              <span className="sr-only">
                Chapter {index + 1}: {done ? 'done' : current ? 'next' : 'locked'}
              </span>
            </span>
          </li>
        )
      })}
    </ol>
  )
}
