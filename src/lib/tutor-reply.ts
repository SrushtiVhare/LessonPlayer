import type { TutorAction, TutorContext } from './tutor-context.ts'

const SPOKEN: Record<number, string> = {
  1: 'one',
  2: 'two',
  3: 'three',
  4: 'four',
  5: 'five',
  6: 'six',
  7: 'seven',
  8: 'eight',
  9: 'nine',
  10: 'ten',
  12: 'twelve',
}

const ORDINALS: Record<number, string> = {
  2: 'half',
  3: 'third',
  4: 'fourth',
  5: 'fifth',
  6: 'sixth',
  7: 'seventh',
  8: 'eighth',
  9: 'ninth',
  10: 'tenth',
  12: 'twelfth',
}

function spokenSecret(label: string): string | null {
  const match = /^(\d+)\s*\/\s*(\d+)$/.exec(label.trim())
  if (!match) return null
  const numerator = SPOKEN[Number(match[1])]
  const denominator = ORDINALS[Number(match[2])]
  if (!numerator || !denominator) return null
  const plural = Number(match[1]) === 1 ? denominator : `${denominator}s`
  return `${numerator} ${plural}`
}

function fractionsIn(text: string): string[] {
  return text.match(/\d+\s*\/\s*\d+/g)?.map((fraction) => fraction.replace(/\s/g, '')) ?? []
}

/** True when a reply says the answer early, or invents a fraction the lesson did not use. */
export function replyLeaks(reply: string, context: TutorContext, grounded: string): boolean {
  if (!context.maySayAnswer) {
    const compact = reply.toLowerCase().replace(/\s+/g, ' ')
    if (/the answer is/.test(compact)) return true
    for (const phrase of context.secretPhrases) {
      const secret = phrase.toLowerCase().replace(/\s+/g, ' ').trim()
      if (secret.length >= 2 && compact.includes(secret)) return true
      const spoken = spokenSecret(phrase)
      if (spoken && compact.includes(spoken)) return true
    }
  }

  const secretFractions = new Set(
    context.maySayAnswer ? [] : context.secretPhrases.flatMap((phrase) => fractionsIn(phrase)),
  )
  const allowed = new Set(
    fractionsIn(
      [grounded, context.prompt, context.supporting ?? '', context.picture ?? '', context.clue ?? '', context.secondClue ?? '', ...context.choices].join(' '),
    ).filter((fraction) => !secretFractions.has(fraction)),
  )
  if (context.maySayAnswer) {
    for (const phrase of context.secretPhrases) {
      for (const fraction of fractionsIn(phrase)) allowed.add(fraction)
    }
  }
  return fractionsIn(reply).some((fraction) => !allowed.has(fraction))
}

function wantsTheAnswer(note: string): boolean {
  return /\b(answer|tell me|just (say|tell)|give (it|me) the)\b/i.test(note)
}

function asSentence(text: string): string {
  const trimmed = text.trim()
  return /[.!?]$/.test(trimmed) ? trimmed : `${trimmed}.`
}

function guiding(context: TutorContext): string {
  if (context.picture) return `Look at the picture first. ${asSentence(context.picture)} What do you notice?`
  if (context.choices.length > 0) return 'Read each tile. Which one matches the story, and which ones are tricks?'
  return `Read it once more: ${context.prompt}`
}

function hintFor(context: TutorContext): string {
  const fresh = context.helpCount <= 0 && context.attempts <= 0 && !context.sawClue
  if (fresh) return guiding(context)
  if (context.helpCount <= 0 && !context.sawClue && context.clue) return context.clue
  if (context.secondClue) return `One more clue. ${context.secondClue}`
  if (context.clue) return `Look again. ${context.clue}`
  return guiding(context)
}

function explain(context: TutorContext): string {
  if (context.maySayAnswer && context.explanation) return context.explanation
  const parts = [context.prompt, context.supporting, context.picture, context.howToAnswer].filter((part) => part && part.length > 0)
  return `Let's read it slowly. ${parts.join(' ')}`
}

function exampleFor(context: TutorContext): string {
  const samples = [
    'Here is a different snack. One piece of three, plus one more piece of three, is two pieces of three. The bottom number stays the same. Try those same steps on your question.',
    'A different bar has four equal pieces and one is colored. Count the colored pieces, then count all the pieces. Do that with your picture.',
    'On a different path, four equal hops go from zero to one. The first hop is the first mark. Find the mark that matches your question.',
  ]
  const blocked = context.maySayAnswer ? [] : context.secretPhrases.map((phrase) => phrase.toLowerCase())
  const safe = samples.find((sample) => blocked.every((phrase) => !sample.toLowerCase().includes(phrase)))
  return safe ?? 'Use the same steps as a smaller question you already know, then come back to this one.'
}

/** A reply built only from this lesson, so it can stand in when the model is quiet or unsafe. */
export function localTutorReply(context: TutorContext, action: TutorAction, note = ''): string {
  const name = context.characterName
  if (context.status === 'welcome') {
    return `Hi! I'm ${name}. I'll help you think. I won't just tell you the answer.`
  }
  if (context.status === 'done') {
    return `You finished ${context.lessonTitle}! I loved solving it with you.`
  }
  if (context.status === 'correct') {
    const because = context.explanation ? ` ${context.explanation}` : ''
    return `Yes! You found it.${because}`
  }
  if (context.status === 'revealed') {
    return `We found this one together. ${context.explanation ?? 'Remember the step, and the next one will feel easier.'}`
  }
  if (action === 'chat' && wantsTheAnswer(note)) {
    return `I want you to find it yourself. ${guiding(context)}`
  }
  if (action === 'explain') return explain(context)
  if (action === 'example') return exampleFor(context)
  if (context.status === 'trying' && action === 'chat' && !note.trim()) {
    return `Good try. ${hintFor(context)}`
  }
  return hintFor(context)
}
