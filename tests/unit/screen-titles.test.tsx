import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import { LoadingMission, MissingAdventure } from '../../src/components/layout/Screens.tsx'

describe('screen titles', () => {
  it('names a missing adventure in the browser tab', () => {
    render(
      <MemoryRouter>
        <MissingAdventure />
      </MemoryRouter>,
    )
    expect(document.title).toBe("We can't find that adventure · WonderQuest Math")
  })

  it('names the waiting screen in the browser tab', () => {
    render(<LoadingMission />)
    expect(document.title).toBe('Getting your adventure ready · WonderQuest Math')
  })
})
