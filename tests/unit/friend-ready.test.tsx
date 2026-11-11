import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import { HomePage } from '../../src/pages/HomePage.tsx'

describe('chosen friend', () => {
  it('says which friend is ready to play', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    )
    expect(screen.getByText('Astro is ready to play.')).toBeInTheDocument()
    await user.click(screen.getByTestId('theme-dino'))
    expect(screen.getByText('Rex is ready to play.')).toBeInTheDocument()
  })
})
