import { describe, expect, it } from 'vitest'
import { parseNumberInput } from '../../src/lib/fraction-parser.ts'
import { addRationals, rationalsEqual } from '../../src/lib/rational.ts'

const both = { allowFraction: true, allowDecimal: true, allowNegative: false }
const signed = { allowFraction: true, allowDecimal: true, allowNegative: true }

describe('fraction and decimal parsing', () => {
  it('treats equivalent fractions as the same value', () => {
    const half = parseNumberInput('1/2', both)
    const twoQuarters = parseNumberInput('2/4', both)
    expect(half.ok && twoQuarters.ok).toBe(true)
    if (half.ok && twoQuarters.ok) expect(rationalsEqual(half.rational, twoQuarters.rational)).toBe(true)
  })

  it('treats decimals and fractions as the same value', () => {
    for (const input of ['0.5', '.5', '0.50', '1/2']) {
      const parsed = parseNumberInput(input, both)
      expect(parsed.ok, input).toBe(true)
      if (parsed.ok) expect(parsed.rational).toEqual({ numerator: 1, denominator: 2 })
    }
    expect(parseNumberInput('0.75', both)).toEqual({ ok: true, rational: { numerator: 3, denominator: 4 } })
  })

  it('accepts a trailing decimal point and trims spaces', () => {
    expect(parseNumberInput('5.', both)).toEqual({ ok: true, rational: { numerator: 5, denominator: 1 } })
    expect(parseNumberInput('  5 / 8  ', both).ok).toBe(true)
  })

  it('rejects malformed strings, zero denominators, and non-finite values', () => {
    expect(parseNumberInput('', both).ok).toBe(false)
    expect(parseNumberInput('abc', both).ok).toBe(false)
    expect(parseNumberInput('1/2/3', both).ok).toBe(false)
    expect(parseNumberInput('1/0', both)).toMatchObject({ ok: false, reason: 'zero-denominator' })
    expect(parseNumberInput('Infinity', both)).toMatchObject({ ok: false, reason: 'non-finite' })
    expect(parseNumberInput('NaN', both)).toMatchObject({ ok: false, reason: 'non-finite' })
  })

  it('handles negatives only when the lesson allows them', () => {
    expect(parseNumberInput('-1/2', both)).toMatchObject({ ok: false, reason: 'negative-not-allowed' })
    expect(parseNumberInput('-1/2', signed)).toEqual({ ok: true, rational: { numerator: -1, denominator: 2 } })
    expect(parseNumberInput('-1/-2', both)).toEqual({ ok: true, rational: { numerator: 1, denominator: 2 } })
  })

  it('rejects values that are too large and keeps 5/8 exact', () => {
    expect(parseNumberInput('1000001/1', both)).toMatchObject({ ok: false, reason: 'too-large' })
    expect(parseNumberInput('0.625', both)).toEqual({ ok: true, rational: { numerator: 5, denominator: 8 } })
    const sum = addRationals({ numerator: 2, denominator: 8 }, { numerator: 3, denominator: 8 })
    expect(sum).toEqual({ numerator: 5, denominator: 8 })
  })
})
