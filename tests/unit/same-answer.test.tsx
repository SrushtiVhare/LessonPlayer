import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { bundledLessons } from '../../src/features/lesson-library/catalog.ts'
import { TaskView } from '../../src/features/lesson-player/SlideViews.tsx'
import { createInitialTaskState } from '../../src/schemas/progress.schema.ts'
import type { TaskSlide } from '../../src/schemas/lesson.schema.ts'

const lesson = bundledLessons[0]!
const slide = lesson.slides.find((item): item is TaskSlide => item.id === 'identify-fraction')!

describe('check answer', () => {
  it('says to change the answer before checking again', () => {
    render(
      <TaskView
        lesson={lesson}
        slide={slide}
        task={{
          ...createInitialTaskState(),
          attempts: 1,
          response: 'one-third',
          lastSubmittedResponse: 'one-third',
          feedbackKind: 'incorrect',
        }}
        soundEnabled={false}
        onChange={() => {}}
        onSubmit={() => {}}
        onHint={() => {}}
        onBack={() => {}}
        onNext={() => {}}
        canBack
        canNext={false}
        nextLabel="Next"
      />,
    )
    expect(screen.getByText('Change your answer, then check again.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Check Answer' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Check Answer' })).toHaveAttribute('aria-describedby', 'same-answer')
  })
})
