import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import { ThemedScreen } from '../../src/components/layout/Screens.tsx'
import { LessonPlayer } from '../../src/features/lesson-player/LessonPlayer.tsx'
import { bundledLessons } from '../../src/features/lesson-library/catalog.ts'

const lesson = bundledLessons[0]!

describe('fresh start notice', () => {
  it('focuses the message when a saved mission cannot be read', () => {
    localStorage.setItem(`wonderquest.progress.${lesson.id}`, '{not json')
    render(
      <MemoryRouter>
        <ThemedScreen theme={lesson.theme}>
          <LessonPlayer lesson={lesson} hasMoreLessons={false} />
        </ThemedScreen>
      </MemoryRouter>,
    )
    expect(screen.getByText('We started this mission fresh because the saved progress could not be read.')).toHaveFocus()
  })
})
