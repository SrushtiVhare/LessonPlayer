/**
 * Exact rational arithmetic using integer numerator/denominator pairs.
 * Fractions are reduced by their greatest common divisor so 1/2 and 2/4 compare equal
 * without floating-point rounding.
 */

export type Rational = {
  numerator: number
  denominator: number
}

export const MAX_RATIONAL_PART = 1_000_000

export function gcd(a: number, b: number): number {
  let x = Math.abs(a)
  let y = Math.abs(b)
  while (y !== 0) {
    const next = x % y
    x = y
    y = next
  }
  return x || 1
}

export function normalizeRational(
  numerator: number,
  denominator: number,
): Rational | null {
  if (!Number.isSafeInteger(numerator) || !Number.isSafeInteger(denominator)) {
    return null
  }
  if (denominator === 0) return null
  if (
    Math.abs(numerator) > MAX_RATIONAL_PART ||
    Math.abs(denominator) > MAX_RATIONAL_PART
  ) {
    return null
  }

  let nextNumerator = numerator
  let nextDenominator = denominator
  if (nextDenominator < 0) {
    nextNumerator = -nextNumerator
    nextDenominator = -nextDenominator
  }
  if (nextNumerator === 0) nextNumerator = 0

  const divisor = gcd(nextNumerator, nextDenominator)
  return {
    numerator: nextNumerator / divisor,
    denominator: nextDenominator / divisor,
  }
}

export function rationalsEqual(a: Rational, b: Rational): boolean {
  const left = normalizeRational(a.numerator, a.denominator)
  const right = normalizeRational(b.numerator, b.denominator)
  if (!left || !right) return false
  return left.numerator === right.numerator && left.denominator === right.denominator
}

function safeProduct(left: number, right: number): number | null {
  if (!Number.isSafeInteger(left) || !Number.isSafeInteger(right)) return null
  const product = left * right
  if (!Number.isSafeInteger(product)) return null
  return product
}

export function addRationals(a: Rational, b: Rational): Rational | null {
  const left = normalizeRational(a.numerator, a.denominator)
  const right = normalizeRational(b.numerator, b.denominator)
  if (!left || !right) return null
  const leftPart = safeProduct(left.numerator, right.denominator)
  const rightPart = safeProduct(right.numerator, left.denominator)
  const denominator = safeProduct(left.denominator, right.denominator)
  if (leftPart === null || rightPart === null || denominator === null) return null
  const numerator = leftPart + rightPart
  if (!Number.isSafeInteger(numerator)) return null
  return normalizeRational(numerator, denominator)
}

/** Value of an evenly spaced tick: start + (end - start) * index / partitions. */
export function rationalAtTick(
  start: Rational,
  end: Rational,
  partitions: number,
  index: number,
): Rational | null {
  if (!Number.isInteger(partitions) || partitions <= 0) return null
  if (!Number.isInteger(index) || index < 0 || index > partitions) return null
  const spanNumerator = end.numerator * start.denominator - start.numerator * end.denominator
  const spanDenominator = end.denominator * start.denominator
  const step = normalizeRational(spanNumerator * index, spanDenominator * partitions)
  if (!step) return null
  return addRationals(start, step)
}

export function formatRational(value: Rational): string {
  const normalized = normalizeRational(value.numerator, value.denominator)
  if (!normalized) return ''
  if (normalized.denominator === 1) return String(normalized.numerator)
  return `${normalized.numerator}/${normalized.denominator}`
}
