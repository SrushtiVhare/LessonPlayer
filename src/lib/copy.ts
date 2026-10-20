export const COPY = {
  incorrect: 'Not quite! Have another look.',
  hint: "Here's a little clue!",
  correctFirst: 'Amazing! You figured it out.',
  correctRetry: 'You found another way to learn!',
  chooseAnswer: 'Choose an answer first.',
  tapMark: 'Tap one of the marks on the line.',
  typeAnswer: 'Type an answer first.',
} as const

export function revealMessage(answerLabel: string, explanation: string): string {
  return `The answer is ${answerLabel}. ${explanation}`
}
