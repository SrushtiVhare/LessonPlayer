import { describe, expect, it } from 'vitest'
import { sanitizeNumericAnswer } from '../../src/lib/numeric-answer.ts'

describe('number answers', () => {
  it('drops letters and keeps a single fraction bar or decimal point', () => {
    expect(sanitizeNumericAnswer('3a/4b', { allowFraction: true, allowDecimal: true })).toBe('3/4')
    expect(sanitizeNumericAnswer('1//2', { allowFraction: true, allowDecimal: false })).toBe('1/2')
    expect(sanitizeNumericAnswer('0..75', { allowFraction: false, allowDecimal: true })).toBe('0.75')
    expect(sanitizeNumericAnswer('abc', { allowFraction: true, allowDecimal: true })).toBe('')
  })

  it('stops a very long answer at 12 characters', () => {
    expect(sanitizeNumericAnswer('123456789012345', { allowFraction: false, allowDecimal: true })).toBe('123456789012')
  })
})
