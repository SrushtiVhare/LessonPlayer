import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { Cloud, CloudCheck, Volume2, VolumeX, X } from 'lucide-react'
import { speak, speechSupported, stopSpeaking } from '../../lib/speech.ts'
import type { SyncStatus } from './useLessonSession.ts'

const statusCopy: Record<SyncStatus, string> = {
  local: 'Saved on this device',
  online: 'Saved on this device and online',
  pending: 'Saved on this device',
}

const roundButton =
  'inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-b-4 border-black/15 bg-surface text-ink active:translate-y-0.5 active:border-b-2 disabled:opacity-50'

export function SaveStatus({ status }: { status: SyncStatus }) {
  const Icon = status === 'online' ? CloudCheck : Cloud
  return (
    <p data-testid="save-status" className="on-world inline-flex items-center" title={statusCopy[status]}>
      <Icon aria-hidden="true" size={22} />
      <span className="sr-only">{statusCopy[status]}</span>
    </p>
  )
}

export function ReadAloudButton({ text, large = false }: { text: string; large?: boolean }) {
  const [spokenFor, setSpokenFor] = useState<string | null>(null)
  const speaking = spokenFor === text
  const supported = speechSupported()
  const timer = useRef<number | null>(null)
  const generation = useRef(0)

  function clearTimer() {
    if (timer.current === null) return
    window.clearTimeout(timer.current)
    timer.current = null
  }

  useEffect(() => {
    setSpokenFor(null)
    return () => {
      generation.current += 1
      clearTimer()
      stopSpeaking()
    }
  }, [text])

  return (
    <button
      type="button"
      data-testid="read-aloud"
      className={`${roundButton} ${large ? 'h-14 w-14 bg-secondary text-white' : ''} ${speaking ? 'pulse-ring' : ''}`}
      aria-pressed={speaking}
      disabled={!supported}
      aria-label={supported ? (speaking ? 'Stop reading' : 'Read aloud') : 'Read aloud is not available in this browser'}
      onClick={() => {
        if (speaking) {
          stopSpeaking()
          clearTimer()
          setSpokenFor(null)
          return
        }
        const ticket = generation.current
        setSpokenFor(text)
        timer.current = window.setTimeout(() => setSpokenFor(null), Math.min(60_000, Math.max(8_000, text.length * 90)))
        speak(text, {
          onEnd: () => {
            clearTimer()
            if (generation.current === ticket) setSpokenFor(null)
          },
        })
      }}
    >
      <span aria-hidden="true" className={large ? 'text-2xl' : 'text-xl'}>
        🔊
      </span>
    </button>
  )
}

export function SoundToggle({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      className={roundButton}
      aria-pressed={enabled}
      aria-label={enabled ? 'Turn celebration sound off' : 'Turn celebration sound on'}
      onClick={onToggle}
    >
      {enabled ? <Volume2 aria-hidden="true" /> : <VolumeX aria-hidden="true" />}
    </button>
  )
}

export function AdventuresLink() {
  return (
    <Link to="/" className={roundButton} aria-label="Back to Adventures">
      <X aria-hidden="true" size={26} strokeWidth={3} />
    </Link>
  )
}
