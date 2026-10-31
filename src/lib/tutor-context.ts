import type { Lesson, Slide, TaskSlide } from '../schemas/lesson.schema.ts'
import type { TaskState } from '../schemas/progress.schema.ts'

export type TutorAction = 'hint' | 'explain' | 'example' | 'chat'

export type TutorStatus = 'welcome' | 'new' | 'trying' | 'correct' | 'revealed' | 'done'

/** Facts the tutor is allowed to use. The secret phrases are for the spoiler check, not for the reply. */
export type TutorContext = {
  characterName: string
  lessonTitle: string
  topic: string
  grade: number
  slideId: string
  slideKind: Slide['type']
  prompt: string
  supporting: string | null
  picture: string | null
  choices: string[]
  howToAnswer: string
  attempts: number
  lastTry: string | null
  sawClue: boolean
  helpCount: number
  status: TutorStatus
  maySayAnswer: boolean
  answerLabel: string | null
  explanation: string | null
  clue: string | null
  secondClue: string | null
  secretPhrases: string[]
}

function pictureOf(slide: TaskSlide): string | null {
  if (!slide.visual) return null
  const captions = slide.visual.bars.map((bar) => bar.caption)
  return captions.length > 0 ? captions.join(' ') : null
}

function choicesOf(slide: Slide): string[] {
  if (slide.type !== 'task' || slide.interaction.type !== 'multiple-choice') return []
  return slide.interaction.options.map((option) => option.label)
}

function howToAnswer(slide: Slide): string {
  if (slide.type === 'intro') return 'Tap the big start button when you are ready.'
  if (slide.type === 'outro') return 'You can play again or pick another adventure.'
  switch (slide.interaction.type) {
    case 'multiple-choice':
      return 'Tap one answer tile, then Check Answer.'
    case 'numeric-input':
      return 'Type a fraction or a decimal, then Check Answer.'
    case 'number-line':
      return 'Tap a mark on the line, then Check Answer.'
    case 'shade':
      return 'Tap pieces to color them, then Check Answer.'
  }
}

function statusOf(slide: Slide, task: TaskState | undefined): TutorStatus {
  if (slide.type === 'intro') return 'welcome'
  if (slide.type === 'outro') return 'done'
  if (task?.solved || task?.feedbackKind === 'correct') return 'correct'
  if (task?.revealed) return 'revealed'
  if ((task?.attempts ?? 0) > 0 || task?.feedbackKind === 'incorrect' || task?.feedbackKind === 'hint' || task?.feedbackKind === 'invalid') {
    return 'trying'
  }
  return 'new'
}

function secretPhrases(slide: TaskSlide): string[] {
  const phrases = [slide.answerLabel]
  const interaction = slide.interaction
  if (interaction.type === 'multiple-choice') {
    const correct = interaction.options.find((option) => option.id === interaction.correctOptionId)
    if (correct) phrases.push(correct.label, correct.accessibleLabel)
  }
  return [...new Set(phrases.map((phrase) => phrase.trim()).filter((phrase) => phrase.length >= 2))]
}

export function buildTutorContext(lesson: Lesson, slide: Slide, task: TaskState | undefined, helpCount = 0): TutorContext {
  const taskSlide = slide.type === 'task' ? slide : null
  const status = statusOf(slide, task)
  const maySayAnswer = status === 'correct' || status === 'revealed'
  const prompt =
    slide.type === 'intro'
      ? `${slide.story} ${slide.objective}`
      : slide.type === 'outro'
        ? `${slide.message} ${slide.conceptSummary}`
        : slide.interaction.prompt

  return {
    characterName: lesson.theme.character.name,
    lessonTitle: lesson.title,
    topic: lesson.topic,
    grade: lesson.grade,
    slideId: slide.id,
    slideKind: slide.type,
    prompt,
    supporting: taskSlide?.supportingText ?? null,
    picture: taskSlide ? pictureOf(taskSlide) : null,
    choices: choicesOf(slide),
    howToAnswer: howToAnswer(slide),
    attempts: task?.attempts ?? 0,
    lastTry: task?.lastSubmittedResponse ?? null,
    sawClue: task?.hintVisible ?? false,
    helpCount,
    status,
    maySayAnswer,
    answerLabel: taskSlide?.answerLabel ?? null,
    explanation: maySayAnswer && taskSlide ? taskSlide.explanation : null,
    clue: taskSlide?.hint ?? null,
    secondClue: taskSlide?.secondHint ?? null,
    secretPhrases: taskSlide ? secretPhrases(taskSlide) : [],
  }
}
