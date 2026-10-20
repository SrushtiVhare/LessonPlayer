export function playSoftChime(): void {
  const AudioContextClass = window.AudioContext ?? window.webkitAudioContext
  if (!AudioContextClass) return
  const context = new AudioContextClass()
  const now = context.currentTime
  const notes = [523.25, 659.25, 783.99]
  for (const [index, frequency] of notes.entries()) {
    const oscillator = context.createOscillator()
    const gain = context.createGain()
    oscillator.type = 'sine'
    oscillator.frequency.value = frequency
    gain.gain.setValueAtTime(0.0001, now)
    gain.gain.exponentialRampToValueAtTime(0.04, now + 0.02 + index * 0.08)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.28 + index * 0.08)
    oscillator.connect(gain)
    gain.connect(context.destination)
    oscillator.start(now + index * 0.08)
    oscillator.stop(now + 0.32 + index * 0.08)
  }
  window.setTimeout(() => {
    void context.close()
  }, 900)
}

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext
  }
}
