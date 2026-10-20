import {
  MAX_RATIONAL_PART,
  normalizeRational,
  type Rational,
} from './rational.ts'

const MAX_DECIMAL_PLACES = 6

const DECIMAL_PATTERN = /^[+-]?(?:\d+\.\d*|\.\d+|\d+)$/
const FRACTION_PATTERN = /^[+-]?\d+\s*\/\s*[+-]?\d+$/

export type ParseSuccess = { ok: true; rational: Rational }
export type ParseFailure = { ok: false; reason: ParseFailureReason; message: string }
export type ParseResult = ParseSuccess | ParseFailure

export type ParseFailureReason =
  | 'empty'
  | 'malformed'
  | 'zero-denominator'
  | 'non-finite'
  | 'too-large'
  | 'too-many-decimals'
  | 'negative-not-allowed'
  | 'format-not-allowed'

export type ParseOptions = {
  allowFraction: boolean
  allowDecimal: boolean
  allowNegative: boolean
}

const INVALID_MESSAGE =
  "I can't read that yet. Try a fraction like 3/4 or a decimal like 0.5."

function failure(reason: ParseFailureReason, message = INVALID_MESSAGE): ParseFailure {
  return { ok: false, reason, message }
}

function parseInteger(token: string): number | null {
  if (!/^[+-]?\d+$/.test(token)) return null
  const value = Number(token)
  if (!Number.isSafeInteger(value)) return null
  return value
}

function decimalToRational(text: string): ParseResult {
  const negative = text.startsWith('-')
  const unsigned = text.replace(/^[+-]/, '')
  const [whole = '', fraction = ''] = unsigned.split('.')
  if (fraction.length > MAX_DECIMAL_PLACES) {
    return failure(
      'too-many-decimals',
      'That decimal is too long. Try up to 6 digits after the dot, or use a fraction.',
    )
  }

  const digits = `${whole === '' ? '0' : whole}${fraction}`
  if (digits.length > 15) return failure('too-large', 'That number is too big for this mission.')
  const numerator = Number(digits)
  if (!Number.isFinite(numerator) || Number.isNaN(numerator)) {
    return failure('non-finite')
  }
  if (!Number.isSafeInteger(numerator) || numerator > MAX_RATIONAL_PART) {
    return failure('too-large', 'That number is too big for this mission.')
  }

  const denominator = 10 ** fraction.length
  const signed = negative ? -numerator : numerator
  const rational = normalizeRational(signed, denominator)
  if (!rational) return failure('too-large', 'That number is too big for this mission.')
  return { ok: true, rational }
}

function fractionToRational(text: string): ParseResult {
  const [numeratorText, denominatorText] = text.split('/').map((part) => part.trim())
  if (!numeratorText || !denominatorText) return failure('malformed')
  const numerator = parseInteger(numeratorText)
  const denominator = parseInteger(denominatorText)
  if (numerator === null || denominator === null) return failure('too-large', 'That number is too big for this mission.')
  if (denominator === 0) {
    return failure('zero-denominator', "The bottom number can't be 0. Try a fraction like 3/4.")
  }
  const rational = normalizeRational(numerator, denominator)
  if (!rational) return failure('too-large', 'That number is too big for this mission.')
  return { ok: true, rational }
}

/**
 * Parse a child-entered fraction or decimal into a reduced rational.
 * Does not use eval or floating-point conversion for the stored value.
 */
export function parseNumberInput(raw: string, options: ParseOptions): ParseResult {
  const text = raw.trim()
  if (text === '') return failure('empty', 'Type an answer first.')
  if (/infinity|nan/i.test(text)) return failure('non-finite')

  const isFraction = text.includes('/')
  if (isFraction) {
    if (!options.allowFraction) {
      return failure('format-not-allowed', 'This mission wants a decimal, like 0.5.')
    }
    if (!FRACTION_PATTERN.test(text)) return failure('malformed')
    const parsed = fractionToRational(text)
    if (!parsed.ok) return parsed
    if (parsed.rational.numerator < 0 && !options.allowNegative) {
      return failure('negative-not-allowed', 'This mission uses zero or greater. Try a fraction like 3/4.')
    }
    return parsed
  }

  if (!options.allowDecimal) {
    return failure('format-not-allowed', 'This mission wants a fraction, like 3/4.')
  }
  if (!DECIMAL_PATTERN.test(text)) return failure('malformed')
  const parsed = decimalToRational(text)
  if (!parsed.ok) return parsed
  if (parsed.rational.numerator < 0 && !options.allowNegative) {
    return failure('negative-not-allowed', 'This mission uses zero or greater. Try a decimal like 0.5.')
  }
  return parsed
}
