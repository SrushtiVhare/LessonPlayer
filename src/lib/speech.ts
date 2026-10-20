export function speechSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined'
}

export function stopSpeaking(): void {
  if (!speechSupported()) return
  window.speechSynthesis.cancel()
}

export function speak(text: string): void {
  if (!speechSupported() || text.trim() === '') return
  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.rate = 0.95
  utterance.pitch = 1
  window.speechSynthesis.speak(utterance)
}
