import type { Adventure } from '../schemas/adventure.schema.ts'
import { parseLesson, type Lesson } from '../schemas/lesson.schema.ts'

/** Dress the same math lesson in a chosen adventure. Answers and hints stay put. */
export function applyAdventure(lesson: Lesson, adventure: Adventure): Lesson {
  const next = structuredClone(lesson)
  next.theme = adventure.theme
  next.title = adventure.story.lessonTitle
  next.description = adventure.story.lessonDescription

  for (const slide of next.slides) {
    if (slide.type === 'intro') {
      slide.title = adventure.story.introTitle
      slide.story = adventure.story.introStory
      slide.objective = adventure.story.objective
      slide.readAloud = adventure.story.introReadAloud
    }
    if (slide.type === 'outro') {
      slide.title = adventure.story.outroTitle
      slide.message = adventure.story.outroMessage
      slide.badgeName = adventure.story.badgeName
      slide.readAloud = adventure.story.outroReadAloud
    }
    if (slide.type === 'task') {
      const skin = adventure.story.slides[slide.id]
      if (!skin) continue
      slide.instruction = skin.instruction
      slide.readAloud = skin.readAloud
      if (skin.supportingText) slide.supportingText = skin.supportingText
      slide.interaction = { ...slide.interaction, prompt: skin.instruction }
    }
  }

  const parsed = parseLesson(next)
  if (!parsed.ok) {
    throw new Error(`Adventure ${adventure.id} does not fit this lesson:\n${parsed.errors.join('\n')}`)
  }
  return parsed.lesson
}
