import { afterEach, describe, expect, it, vi } from 'vitest'
import { speak } from '../../src/lib/speech.ts'

describe('read aloud', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('speaks English a little slower for children', () => {
    const spoken: Array<{ lang: string; rate: number }> = []
    class FakeUtterance {
      lang = ''
      rate = 1
      pitch = 1
      onend: (() => void) | null = null
      onerror: (() => void) | null = null
      constructor(public text: string) {}
    }
    vi.stubGlobal('SpeechSynthesisUtterance', FakeUtterance)
    vi.stubGlobal('speechSynthesis', {
      cancel: () => {},
      speak: (utterance: FakeUtterance) => {
        spoken.push({ lang: utterance.lang, rate: utterance.rate })
      },
    })

    speak('Hello explorer')
    expect(spoken).toEqual([{ lang: 'en-US', rate: 0.9 }])
  })
})
