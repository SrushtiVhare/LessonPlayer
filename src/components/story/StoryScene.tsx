import { useEffect, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { Character } from '../characters/Character.tsx'
import type { CharacterMood } from '../characters/mood.ts'
import type { Theme } from '../../schemas/theme.schema.ts'

export function TypedText({ text }: { text: string }) {
  const reduce = useReducedMotion()
  const [shown, setShown] = useState(reduce ? text.length : 0)
  useEffect(() => {
    if (reduce) return
    const timer = window.setInterval(() => {
      setShown((count) => {
        if (count >= text.length) {
          window.clearInterval(timer)
          return count
        }
        return count + 2
      })
    }, 22)
    return () => window.clearInterval(timer)
  }, [reduce, text])
  return (
    <span>
      {text.slice(0, shown)}
      <span className="opacity-0">{text.slice(shown)}</span>
    </span>
  )
}

const reactions: Record<CharacterMood, { y?: number[]; x?: number[]; rotate?: number[] }> = {
  welcome: { y: [0, -10, 0] },
  thinking: { rotate: [0, -4, 4, 0] },
  encourage: { x: [0, -10, 10, -6, 6, 0] },
  celebrate: { y: [0, -40, 0, -18, 0], rotate: [0, -10, 10, 0] },
  proud: { y: [0, -20, 0] },
}

export function StoryScene({
  theme,
  mood,
  chapterLabel,
  chapterTitle,
  story,
  speech,
}: {
  theme: Theme
  mood: CharacterMood
  chapterLabel: string
  chapterTitle?: string
  story?: string
  speech: string
}) {
  const reduce = useReducedMotion()
  const line = story ?? speech
  return (
    <section className="flex items-end gap-2 sm:gap-4" aria-label="Story">
      <motion.div
        key={mood}
        className="relative w-24 shrink-0 sm:w-32"
        animate={reduce ? undefined : reactions[mood]}
        transition={{ duration: mood === 'celebrate' ? 0.9 : 0.6 }}
      >
        <div className="aspect-square overflow-hidden rounded-full bg-white/95 p-1.5 shadow-xl ring-4 ring-accent">
          <Character theme={theme} mood={mood} compact size="aspect-square w-full" />
        </div>
        {mood === 'celebrate' && !reduce ? (
          <span className="piece-pop absolute -top-3 -right-2 text-3xl" aria-hidden="true">
            🎉
          </span>
        ) : null}
      </motion.div>
      <div className="relative grid min-w-0 flex-1 gap-1.5 rounded-[1.75rem] rounded-bl-md bg-surface px-4 py-3 shadow-xl">
        <p className="inline-flex w-fit items-center gap-1.5 rounded-full bg-accent px-3 py-0.5 text-sm font-extrabold text-on-accent">
          <span className="emoji-marker" aria-hidden="true" />
          {chapterLabel}
          {chapterTitle ? <span>· {chapterTitle}</span> : null}
        </p>
        <p className="text-lg leading-snug font-bold text-ink sm:text-xl">
          <span className="sr-only">{theme.character.name} says: </span>
          <TypedText key={line} text={line} />
        </p>
      </div>
    </section>
  )
}
