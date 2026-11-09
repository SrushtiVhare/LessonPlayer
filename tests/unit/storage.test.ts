import { describe, expect, it } from 'vitest'
import { readLocalProgress, writeAdventureId, writeLatestLessonId } from '../../src/lib/storage.ts'

describe('saved on this device', () => {
  it('refuses an adventure or lesson id that is not a simple name', () => {
    writeAdventureId('../secret')
    writeLatestLessonId('bad id')
    expect(localStorage.getItem('wonderquest.adventure')).toBeNull()
    expect(localStorage.getItem('wonderquest.latest-lesson')).toBeNull()
    writeAdventureId('dino')
    writeLatestLessonId('space-fractions')
    expect(localStorage.getItem('wonderquest.adventure')).toBe('dino')
    expect(localStorage.getItem('wonderquest.latest-lesson')).toBe('space-fractions')
  })

  it('throws away a saved mission that cannot be read', () => {
    localStorage.setItem('wonderquest.progress.star-pieces', '{not json')
    expect(readLocalProgress('star-pieces').status).toBe('invalid')
    expect(localStorage.getItem('wonderquest.progress.star-pieces')).toBeNull()
  })
})
