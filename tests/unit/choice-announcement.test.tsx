import { useState } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { MultipleChoice } from '../../src/components/interactions/MultipleChoice.tsx'
import { bundledLessons } from '../../src/features/lesson-library/catalog.ts'
import type { TaskSlide } from '../../src/schemas/lesson.schema.ts'

const slide = bundledLessons[0]!.slides.find((item): item is TaskSlide => item.id === 'identify-fraction')!
const interaction = slide.interaction
if (interaction.type !== 'multiple-choice') throw new Error('expected a multiple-choice question')

function Harness() {
  const [value, setValue] = useState<string | null>(null)
  return <MultipleChoice interaction={interaction} name="identify" value={value} disabled={false} revealed={false} onChange={setValue} />
}

describe('multiple choice', () => {
  it('says which answer was chosen', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await user.click(screen.getByRole('radio', { name: '1 out of 4' }))
    expect(screen.getByText('You chose 1 out of 4.')).toBeInTheDocument()
  })
})
