import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import { bundledLessons } from '../../src/features/lesson-library/catalog.ts'
import { createInitialState } from '../../src/features/lesson-player/lesson-reducer.ts'
import { OutroView } from '../../src/features/lesson-player/SlideViews.tsx'
import type { OutroSlide } from '../../src/schemas/lesson.schema.ts'

const lesson = bundledLessons[0]!
const slide = lesson.slides.find((item): item is OutroSlide => item.type === 'outro')!

function renderOutro() {
  return render(
    <MemoryRouter>
      <OutroView lesson={lesson} slide={slide} state={createInitialState(lesson)} hasMoreLessons={false} onReplay={() => {}} />
    </MemoryRouter>,
  )
}

describe('new story question', () => {
  it('moves focus to the question', async () => {
    const user = userEvent.setup()
    renderOutro()
    await user.click(screen.getByRole('button', { name: 'Play again!' }))
    expect(screen.getByRole('heading', { name: 'Want a new story?' })).toHaveFocus()
  })

  it('closes the question with Escape and returns to Play again', async () => {
    const user = userEvent.setup()
    renderOutro()
    await user.click(screen.getByRole('button', { name: 'Play again!' }))
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('heading', { name: 'Want a new story?' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Play again!' })).toHaveFocus()
  })
})
