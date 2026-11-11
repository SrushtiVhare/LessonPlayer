import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { ThemedScreen } from '../../src/components/layout/Screens.tsx'
import { bundledLessons } from '../../src/features/lesson-library/catalog.ts'

describe('skip link', () => {
  it('lands on the mission', async () => {
    const user = userEvent.setup()
    render(
      <ThemedScreen theme={bundledLessons[0]!.theme}>
        <h1>Star Pieces</h1>
      </ThemedScreen>,
    )
    await user.click(screen.getByRole('link', { name: 'Skip to the mission' }))
    expect(document.getElementById('main')).toHaveFocus()
  })
})
