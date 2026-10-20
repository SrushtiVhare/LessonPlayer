import { useState } from 'react'
import { readSoundEnabled, writeSoundEnabled } from '../lib/storage.ts'

export function useSoundPreference() {
  const [enabled, setEnabled] = useState(() => readSoundEnabled())
  const toggle = () => {
    setEnabled((current) => {
      const next = !current
      writeSoundEnabled(next)
      return next
    })
  }
  return { enabled, toggle }
}
