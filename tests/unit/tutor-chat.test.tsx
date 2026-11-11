import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { bundledLessons } from '../../src/features/lesson-library/catalog.ts'
import { TutorChat } from '../../src/features/lesson-player/TutorChat.tsx'
import { createInitialTaskState } from '../../src/schemas/progress.schema.ts'
import type { TaskSlide } from '../../src/schemas/lesson.schema.ts'

const lesson = bundledLessons[0]!
const slide = lesson.slides.find((item): item is TaskSlide => item.id === 'identify-fraction')!

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('tutor chat', () => {
  it('stays on this question and does not say the answer', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')))
    const user = userEvent.setup()
    render(<TutorChat lesson={lesson} slide={slide} task={createInitialTaskState()} />)
    await user.click(screen.getByTestId('tutor-open'))
    expect(screen.getByTestId('tutor-panel')).toHaveTextContent(/look at the picture first/i)
    await user.click(screen.getByRole('button', { name: 'Give me a hint' }))
    await user.click(screen.getByRole('button', { name: 'Explain this' }))
    expect(await screen.findByText(/let's read it slowly/i)).toBeInTheDocument()
    expect(screen.getByTestId('tutor-panel').textContent).not.toContain('1/4')
  })

  it('puts focus back on Chat when the tutor closes', async () => {
    const user = userEvent.setup()
    render(<TutorChat lesson={lesson} slide={slide} task={createInitialTaskState()} />)
    await user.click(screen.getByTestId('tutor-open'))
    await user.click(screen.getByRole('button', { name: 'Close tutor' }))
    expect(screen.getByTestId('tutor-open')).toHaveFocus()
  })

  it('says when a note is as long as it can be', async () => {
    const user = userEvent.setup()
    render(<TutorChat lesson={lesson} slide={slide} task={createInitialTaskState()} />)
    await user.click(screen.getByTestId('tutor-open'))
    fireEvent.change(screen.getByLabelText(/ask astro about this question/i), { target: { value: 'a'.repeat(200) } })
    expect(screen.getByText('That note is as long as it can be.')).toBeInTheDocument()
  })
})
