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

  it('stops speaking when the tab is hidden', () => {
    const cancel = vi.fn()
    class FakeUtterance {
      lang = ''
      rate = 1
      pitch = 1
      onend: (() => void) | null = null
      onerror: (() => void) | null = null
      constructor(public text: string) {}
    }
    vi.stubGlobal('SpeechSynthesisUtterance', FakeUtterance)
    vi.stubGlobal('speechSynthesis', { cancel, speak: () => {} })
    speak('Hello explorer')
    const hidden = Object.getOwnPropertyDescriptor(document, 'hidden')
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => true })
    document.dispatchEvent(new Event('visibilitychange'))
    expect(cancel).toHaveBeenCalledTimes(2)
    if (hidden) Object.defineProperty(document, 'hidden', hidden)
    else delete (document as { hidden?: boolean }).hidden
  })
})
