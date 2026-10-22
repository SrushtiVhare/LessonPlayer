import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { AudioLines, Volume2, VolumeX } from 'lucide-react'
import { speak, speechSupported, stopSpeaking } from '../../lib/speech.ts'
import type { SyncStatus } from './useLessonSession.ts'

const statusCopy: Record<SyncStatus, string> = {
  local: 'Saved on this device',
  online: 'Saved on this device and online',
  pending: 'Saved on this device',
}

export function SaveStatus({ status }: { status: SyncStatus }) {
  return (
    <p data-testid="save-status" className="text-sm font-semibold text-muted">
      {statusCopy[status]}
    </p>
  )
}

export function SoundControls({ text, enabled, onToggle }: { text: string; enabled: boolean; onToggle: () => void }) {
  const [spokenFor, setSpokenFor] = useState<string | null>(null)
  const speaking = spokenFor === text
  const supported = speechSupported()

  useEffect(() => {
    stopSpeaking()
  }, [text])

  return (
    <div className="flex gap-2">
      <button
        type="button"
        className="inline-flex min-h-12 min-w-12 items-center justify-center rounded-2xl bg-surface px-3 font-bold text-ink shadow-[var(--wq-shadow)] disabled:text-muted"
        aria-pressed={speaking}
        disabled={!supported}
        aria-label={supported ? (speaking ? 'Stop read aloud' : 'Read aloud') : 'Read aloud is not available in this browser'}
        onClick={() => {
          if (speaking) {
            stopSpeaking()
            setSpokenFor(null)
            return
          }
          speak(text)
          setSpokenFor(text)
          window.setTimeout(() => setSpokenFor(null), Math.min(15000, text.length * 70))
        }}
      >
        <AudioLines aria-hidden="true" />
      </button>
      <button
        type="button"
        className="inline-flex min-h-12 min-w-12 items-center justify-center rounded-2xl bg-surface px-3 font-bold text-ink shadow-[var(--wq-shadow)]"
        aria-pressed={enabled}
        aria-label={enabled ? 'Turn celebration sound off' : 'Turn celebration sound on'}
        onClick={onToggle}
      >
        {enabled ? <Volume2 aria-hidden="true" /> : <VolumeX aria-hidden="true" />}
      </button>
    </div>
  )
}

export function AdventuresLink() {
  return (
    <Link to="/" className="inline-flex min-h-12 items-center font-bold text-ink">
      Adventures
    </Link>
  )
}
