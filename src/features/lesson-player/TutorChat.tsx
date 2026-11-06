import { useEffect, useRef, useState } from 'react'
import { buildTutorContext } from '../../lib/tutor-context.ts'
import { localTutorReply } from '../../lib/tutor-reply.ts'
import { requestTutorReply } from '../../lib/tutor-client.ts'
import { speak, speechSupported } from '../../lib/speech.ts'
import type { TutorAction } from '../../lib/tutor-context.ts'
import type { Lesson, Slide } from '../../schemas/lesson.schema.ts'
import type { TaskState } from '../../schemas/progress.schema.ts'

type ChatLine = { from: 'tutor' | 'child'; text: string }

const QUICK: { action: TutorAction; label: string }[] = [
  { action: 'hint', label: 'Give me a hint' },
  { action: 'explain', label: 'Explain this' },
  { action: 'example', label: 'Show me an example' },
]

function opening(lesson: Lesson, slide: Slide, task: TaskState | undefined): ChatLine {
  return { from: 'tutor', text: localTutorReply(buildTutorContext(lesson, slide, task, 0), 'chat') }
}

export function TutorChat({ lesson, slide, task }: { lesson: Lesson; slide: Slide; task?: TaskState }) {
  const name = lesson.theme.character.name
  const emoji = lesson.theme.character.emoji ?? '⭐'
  const [open, setOpen] = useState(false)
  const [helpCount, setHelpCount] = useState(0)
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [lines, setLines] = useState<ChatLine[]>(() => [opening(lesson, slide, task)])
  const [trackedSlide, setTrackedSlide] = useState(slide.id)
  const endRef = useRef<HTMLDivElement>(null)
  const solvedMark = task?.solved ? 'solved' : task?.revealed ? 'revealed' : ''
  const [celebrated, setCelebrated] = useState(solvedMark)

  if (slide.id !== trackedSlide) {
    setTrackedSlide(slide.id)
    setHelpCount(0)
    setNote('')
    setLines([opening(lesson, slide, task)])
    setCelebrated(solvedMark)
  } else if (solvedMark && celebrated !== solvedMark) {
    setCelebrated(solvedMark)
    const cheer = opening(lesson, slide, task).text
    setLines((current) => (current.at(-1)?.text === cheer ? current : [...current, { from: 'tutor', text: cheer }]))
  }

  useEffect(() => {
    endRef.current?.scrollIntoView?.({ block: 'nearest' })
  }, [lines, open])

  useEffect(() => {
    if (!open) return
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  async function ask(action: TutorAction) {
    const typed = note.trim()
    if (busy) return
    if (action === 'chat' && !typed) return
    const childText = QUICK.find((item) => item.action === action)?.label ?? typed
    const usedHelp = helpCount
    setLines((current) => [...current, { from: 'child', text: childText }])
    if (action === 'chat') setNote('')
    if (action === 'hint') setHelpCount((count) => count + 1)
    setBusy(true)
    const reply = await requestTutorReply({
      context: buildTutorContext(lesson, slide, task, usedHelp),
      action,
      note: action === 'chat' ? typed : '',
    })
    setLines((current) => [...current, { from: 'tutor', text: reply }])
    setBusy(false)
  }

  const launcher = (
    <button
      type="button"
      data-testid="tutor-open"
      className="inline-flex min-h-14 items-center gap-2 rounded-full border-b-8 border-black/15 bg-white px-5 font-display text-xl text-ink shadow-lg active:translate-y-1 active:border-b-2"
      onClick={() => setOpen(true)}
    >
      <span aria-hidden="true" className="text-2xl">
        {emoji}
      </span>
      Chat with {name}
    </button>
  )

  const panel = (
    <section className="grid gap-3 rounded-[2rem] border-b-8 border-black/10 bg-white p-4 text-ink shadow-xl" aria-label={`${name} the tutor`} data-testid="tutor-panel">
      <div className="flex items-center justify-between gap-3">
        <p className="font-display text-2xl">
          <span aria-hidden="true" className="mr-1">
            {emoji}
          </span>
          {name} can help
        </p>
        <button type="button" className="min-h-12 rounded-full bg-canvas px-4 font-extrabold" onClick={() => setOpen(false)} aria-label="Close tutor">
          I'm done
        </button>
      </div>
      <div className="grid max-h-52 gap-2 overflow-y-auto" aria-live="polite">
        {lines.map((line, index) => (
          <div key={`${line.from}-${index}`} className={`flex items-end gap-2 ${line.from === 'tutor' ? 'justify-self-start' : 'justify-self-end'}`}>
            <p
              data-testid={line.from === 'tutor' ? 'tutor-reply' : 'tutor-child'}
              className={`max-w-[95%] rounded-3xl px-4 py-2 text-lg font-bold ${line.from === 'tutor' ? 'bg-hint-surface text-hint' : 'bg-primary text-on-primary'}`}
            >
              {line.text}
            </p>
            {line.from === 'tutor' && index === lines.length - 1 && speechSupported() ? (
              <button type="button" className="min-h-12 min-w-12 rounded-full bg-canvas text-xl" aria-label="Hear that" onClick={() => speak(line.text)}>
                🔊
              </button>
            ) : null}
          </div>
        ))}
        {busy ? <p className="text-base font-bold text-muted">Thinking with you...</p> : null}
        <div ref={endRef} />
      </div>
      <div className="flex flex-wrap gap-2">
        {QUICK.map((item) => (
          <button
            key={item.action}
            type="button"
            data-testid={`tutor-${item.action}`}
            disabled={busy}
            className="min-h-12 rounded-full border-b-4 border-black/10 bg-canvas px-4 font-extrabold active:translate-y-0.5 disabled:opacity-60"
            onClick={() => ask(item.action)}
          >
            {item.label}
          </button>
        ))}
      </div>
      <form
        className="flex gap-2"
        onSubmit={(event) => {
          event.preventDefault()
          void ask('chat')
        }}
      >
        <label className="sr-only" htmlFor="tutor-note">
          Ask {name} about this question
        </label>
        <input
          id="tutor-note"
          value={note}
          maxLength={200}
          disabled={busy}
          placeholder="Ask me anything here"
          className="min-h-12 min-w-0 flex-1 rounded-full border-2 border-black/10 px-4 text-lg font-bold outline-none focus:border-primary"
          onChange={(event) => setNote(event.target.value)}
        />
        <button type="submit" disabled={busy || note.trim().length === 0} className="min-h-12 rounded-full bg-accent px-4 font-display text-lg text-on-accent disabled:opacity-60">
          Send it
        </button>
      </form>
    </section>
  )

  return (
    <div className={`fixed right-3 bottom-24 z-40 ${open ? 'w-[min(22rem,calc(100vw-1.5rem))]' : ''}`}>{open ? panel : launcher}</div>
  )
}
