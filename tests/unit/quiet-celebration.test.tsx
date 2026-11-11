import { render } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { bundledLessons } from '../../src/features/lesson-library/catalog.ts'
import { TaskView } from '../../src/features/lesson-player/SlideViews.tsx'
import { playSoftChime } from '../../src/lib/chime.ts'
import { createInitialTaskState } from '../../src/schemas/progress.schema.ts'
import type { TaskSlide } from '../../src/schemas/lesson.schema.ts'

vi.mock('../../src/lib/chime.ts', () => ({
  playSoftChime: vi.fn(),
}))

const lesson = bundledLessons[0]!
const slide = lesson.slides.find((item): item is TaskSlide => item.id === 'identify-fraction')!

function setMotion(reduce: boolean) {
  window.matchMedia = ((query: string) => ({
    matches: reduce && query.includes('reduce'),
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
    addListener: () => {},
    removeListener: () => {},
  })) as typeof window.matchMedia
}

function view(kind: 'incorrect' | 'correct' | null) {
  return (
    <TaskView
      lesson={lesson}
      slide={slide}
      task={{
        ...createInitialTaskState(),
        attempts: kind === null ? 0 : 1,
        completed: kind === 'correct',
        solved: kind === 'correct',
        feedbackKind: kind,
      }}
      soundEnabled
      onChange={() => {}}
      onSubmit={() => {}}
      onHint={() => {}}
      onBack={() => {}}
      onNext={() => {}}
      canBack
      canNext={false}
      nextLabel="Next"
    />
  )
}

describe('celebration sound', () => {
  beforeEach(() => {
    vi.mocked(playSoftChime).mockClear()
  })

  it('stays quiet when the child prefers less motion', () => {
    setMotion(true)
    const { rerender } = render(view(null))
    rerender(view('correct'))
    expect(playSoftChime).not.toHaveBeenCalled()
  })

  it('plays when motion is welcome', () => {
    setMotion(false)
    const { rerender } = render(view(null))
    rerender(view('correct'))
    expect(playSoftChime).toHaveBeenCalledOnce()
  })
})
