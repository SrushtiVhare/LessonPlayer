import { useState } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { NumberLineInput } from '../../src/components/interactions/NumberLineInput.tsx'
import { bundledLessons } from '../../src/features/lesson-library/catalog.ts'
import type { TaskSlide } from '../../src/schemas/lesson.schema.ts'

const slide = bundledLessons[0]!.slides.find((item): item is TaskSlide => item.id === 'number-line-fourths')!
const interaction = slide.interaction
if (interaction.type !== 'number-line') throw new Error('expected a number line')

function Harness() {
  const [value, setValue] = useState<string | null>(null)
  return <NumberLineInput interaction={interaction} name="line" value={value} disabled={false} revealed={false} onChange={setValue} />
}

describe('number line keys', () => {
  it('moves along the line with the arrow keys', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await user.click(screen.getByTestId('tick-0'))
    await user.keyboard('{ArrowRight}')
    expect(screen.getByTestId('tick-1')).toHaveFocus()
    expect(screen.getByText('You chose 1/4')).toBeInTheDocument()
  })
})
