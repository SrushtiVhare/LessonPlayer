import { describe, expect, it } from 'vitest'
import { bundledLessons } from '../../src/features/lesson-library/catalog.ts'
import { adventures, lessonWithAdventure } from '../../src/features/lesson-library/adventures.ts'

const lesson = bundledLessons[0]!

describe('adventure skins', () => {
  it('offers space, dinosaurs, and soccer', () => {
    expect(adventures.map((adventure) => adventure.id)).toEqual(['space', 'dino', 'soccer'])
  })

  it('keeps the math when the story and colors change', () => {
    const dino = lessonWithAdventure(lesson, 'dino')
    const task = dino.slides.find((slide) => slide.id === 'add-fifths')

    expect(dino.title).toBe('Egg Pieces')
    expect(dino.theme.character.name).toBe('Rex')
    expect(dino.theme.character.illustration).toBe('dino')
    expect(dino.theme.background).toBe('jungle')
    expect(task?.type).toBe('task')
    if (task?.type !== 'task' || task.interaction.type !== 'multiple-choice') {
      throw new Error('Expected the fifths challenge to stay multiple choice.')
    }
    expect(task.instruction).toMatch(/Rex/)
    expect(task.hint).toBe('The pieces are all fifths. Add how many pieces you have: 1 plus 2.')
    expect(task.explanation).toMatch(/denominator stays 5/)
    expect(task.interaction.correctOptionId).toBe('three-fifths')
  })

  it('keeps the space story as the default skin', () => {
    const space = lessonWithAdventure(lesson, 'space')
    const intro = space.slides[0]
    expect(intro?.type).toBe('intro')
    if (intro?.type !== 'intro') return
    expect(intro.story).toMatch(/stars have broken into pieces/i)
  })
})
