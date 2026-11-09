import { describe, expect, it } from 'vitest'
import { writeAdventureId, writeLatestLessonId } from '../../src/lib/storage.ts'

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
})
