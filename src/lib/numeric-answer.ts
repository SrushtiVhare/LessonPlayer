const MAX_LENGTH = 12

export function sanitizeNumericAnswer(
  raw: string,
  options: { allowFraction: boolean; allowDecimal: boolean },
): string {
  const allowed = options.allowFraction && options.allowDecimal ? /[^0-9./]/g : options.allowFraction ? /[^0-9/]/g : /[^0-9.]/g
  let text = raw.replace(allowed, '')
  const slash = text.indexOf('/')
  if (slash !== -1) text = text.slice(0, slash + 1) + text.slice(slash + 1).replaceAll('/', '')
  const dot = text.indexOf('.')
  if (dot !== -1) text = text.slice(0, dot + 1) + text.slice(dot + 1).replaceAll('.', '')
  return text.slice(0, MAX_LENGTH)
}
