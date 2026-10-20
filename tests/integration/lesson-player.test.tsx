import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import { ThemedScreen } from '../../src/components/layout/Screens.tsx'
import { LessonProblem } from '../../src/components/layout/Screens.tsx'
import { LessonPlayer } from '../../src/features/lesson-player/LessonPlayer.tsx'
import { bundledLessons } from '../../src/features/lesson-library/catalog.ts'
import { HomePage } from '../../src/pages/HomePage.tsx'
import { parseLesson } from '../../src/schemas/lesson.schema.ts'

const lesson = bundledLessons[0]!

function renderPlayer() {
  return render(
    <MemoryRouter>
      <ThemedScreen theme={lesson.theme}>
        <LessonPlayer lesson={lesson} hasMoreLessons={false} />
      </ThemedScreen>
    </MemoryRouter>,
  )
}

async function startMission() {
  const user = userEvent.setup()
  renderPlayer()
  expect(screen.getByText(/stars have broken into pieces/i)).toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: 'Start Mission' }))
  expect(screen.getByRole('heading', { name: /which fraction matches it/i })).toBeInTheDocument()
  expect(screen.getByText('Challenge 1 of 5')).toBeInTheDocument()
  return user
}

describe('lesson player', () => {
  it('renders the intro and the first multiple-choice challenge', async () => {
    const user = await startMission()
    expect(screen.getByRole('radio', { name: '1 out of 4' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Check Answer' }))
    expect(screen.getByTestId('feedback')).toHaveTextContent('Choose an answer first.')
  })

  it('celebrates a correct answer and unlocks next', async () => {
    const user = await startMission()
    await user.click(screen.getByRole('radio', { name: '1 out of 4' }))
    await user.click(screen.getByRole('button', { name: 'Check Answer' }))
    expect(screen.getByTestId('feedback')).toHaveTextContent('Amazing! You figured it out.')
    expect(screen.getByRole('button', { name: 'Next' })).toBeEnabled()
  })

  it('shows a hint after two misses and the answer after three', async () => {
    const user = await startMission()
    await user.click(screen.getByRole('radio', { name: '1 out of 3' }))
    await user.click(screen.getByRole('button', { name: 'Check Answer' }))
    expect(screen.getByTestId('feedback')).toHaveTextContent('Not quite! Have another look.')

    await user.click(screen.getByRole('radio', { name: '4 out of 1' }))
    await user.click(screen.getByRole('button', { name: 'Check Answer' }))
    expect(screen.getByTestId('feedback')).toHaveTextContent("Here's a little clue!")
    expect(screen.getByText(/count the equal pieces/i)).toBeInTheDocument()

    await user.click(screen.getByRole('radio', { name: '3 out of 4' }))
    await user.click(screen.getByRole('button', { name: 'Check Answer' }))
    expect(screen.getByTestId('feedback')).toHaveTextContent('The answer is 1/4.')
    expect(screen.getByRole('button', { name: 'Next' })).toBeEnabled()
    await user.click(screen.getByRole('button', { name: 'Next' }))
    expect(screen.getByText('Challenge 2 of 5')).toBeInTheDocument()
  })

  it('keeps a finished challenge finished when going back', async () => {
    const user = await startMission()
    await user.click(screen.getByRole('radio', { name: '1 out of 4' }))
    await user.click(screen.getByRole('button', { name: 'Check Answer' }))
    await user.click(screen.getByRole('button', { name: 'Next' }))
    await user.click(screen.getByRole('button', { name: 'Back' }))
    expect(screen.getByTestId('feedback')).toHaveTextContent('Amazing! You figured it out.')
    expect(screen.queryByRole('button', { name: 'Check Answer' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Next' })).toBeEnabled()
  })

  it('completes the mission and shows a first-try score of 5 out of 5', async () => {
    const user = await startMission()
    await user.click(screen.getByRole('radio', { name: '1 out of 4' }))
    await user.click(screen.getByRole('button', { name: 'Check Answer' }))
    await user.click(screen.getByRole('button', { name: 'Next' }))

    await user.click(screen.getByRole('radio', { name: '3 out of 5' }))
    await user.click(screen.getByRole('button', { name: 'Check Answer' }))
    await user.click(screen.getByRole('button', { name: 'Next' }))

    await user.type(screen.getByTestId('numeric-input'), '0.625')
    await user.click(screen.getByRole('button', { name: 'Check Answer' }))
    await user.click(screen.getByRole('button', { name: 'Next' }))

    await user.click(screen.getByTestId('tick-3'))
    await user.click(screen.getByRole('button', { name: 'Check Answer' }))
    await user.click(screen.getByRole('button', { name: 'Next' }))

    await user.click(screen.getByRole('radio', { name: '7 out of 10' }))
    await user.click(screen.getByRole('button', { name: 'Check Answer' }))
    await user.click(screen.getByRole('button', { name: 'Finish Mission' }))

    expect(screen.getByTestId('score')).toHaveTextContent('You solved 5 out of 5 on your first try.')
    expect(screen.getByText('You finished 5 challenges.')).toBeInTheDocument()
    expect(screen.getByText(/denominator stays the same/i)).toBeInTheDocument()
  })
})

describe('home and malformed lessons', () => {
  it('shows the bundled mission when Supabase is not configured', () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    )
    expect(screen.getByRole('heading', { name: 'Hi, explorer!' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Star Pieces' })).toBeInTheDocument()
    expect(screen.getByText(/Grade 4/)).toBeInTheDocument()
    expect(screen.getByTestId('save-status')).toHaveTextContent('Saved on this device')
    expect(screen.getByTestId('start-learning')).toHaveTextContent('Start Learning')
  })

  it('explains malformed lesson data without crashing', () => {
    expect(parseLesson({ id: 'nope' }).ok).toBe(false)
    render(<LessonProblem errors={['slides: A lesson needs 4 or 5 challenges.']} />)
    expect(screen.getByRole('alert')).toHaveTextContent('This mission needs a fix')
  })
})
