type SpeakOptions = { onEnd?: () => void }

let watchingHiddenTab = false

function watchHiddenTab(): void {
  if (watchingHiddenTab || typeof document === 'undefined') return
  watchingHiddenTab = true
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stopSpeaking()
  })
}

export function speechSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined'
}

export function stopSpeaking(): void {
  if (!speechSupported()) return
  window.speechSynthesis.cancel()
}

export function speak(text: string, options: SpeakOptions = {}): void {
  if (!speechSupported() || text.trim() === '') {
    options.onEnd?.()
    return
  }
  window.speechSynthesis.cancel()
  watchHiddenTab()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = 'en-US'
  utterance.rate = 0.9
  utterance.pitch = 1
  const finish = () => options.onEnd?.()
  utterance.onend = finish
  utterance.onerror = finish
  window.speechSynthesis.speak(utterance)
}
