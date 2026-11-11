import { useState } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { ShadeInput } from '../../src/components/interactions/ShadeInput.tsx'

const interaction = {
  type: 'shade' as const,
  prompt: 'Color pieces to show 1/2.',
  segments: 4,
  correct: { numerator: 1, denominator: 2 },
}

function Harness() {
  const [value, setValue] = useState<string | null>(null)
  return <ShadeInput interaction={interaction} name="shade" value={value} disabled={false} revealed={false} onChange={setValue} />
}

describe('shade keys', () => {
  it('moves between pieces with the arrow keys', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    screen.getByTestId('piece-0').focus()
    await user.keyboard('{ArrowRight}')
    expect(screen.getByTestId('piece-1')).toHaveFocus()
    expect(screen.getByTestId('piece-1')).toHaveAttribute('aria-pressed', 'false')
  })
})
