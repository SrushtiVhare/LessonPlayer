import { useState } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { NumericInput } from '../../src/components/interactions/NumericInput.tsx'
import { bundledLessons } from '../../src/features/lesson-library/catalog.ts'
import type { TaskSlide } from '../../src/schemas/lesson.schema.ts'

const slide = bundledLessons[0]!.slides.find((item): item is TaskSlide => item.id === 'type-eighths')!
const interaction = slide.interaction
if (interaction.type !== 'numeric-input') throw new Error('expected a typed question')

function Harness() {
  const [value, setValue] = useState<string | null>(null)
  return <NumericInput interaction={interaction} name="type" value={value} disabled={false} revealed={false} onChange={setValue} />
}

describe('typed answer', () => {
  it('says when the answer is as long as it can be', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await user.type(screen.getByTestId('numeric-input'), '123456789012')
    expect(screen.getByText('That answer is as long as it can be.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '1' })).toBeDisabled()
    await user.click(screen.getByRole('button', { name: 'Delete last' }))
    expect(screen.queryByText('That answer is as long as it can be.')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: '1' })).toBeEnabled()
  })
})
