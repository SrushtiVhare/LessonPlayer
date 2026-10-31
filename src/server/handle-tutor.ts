import { localTutorReply, replyLeaks } from '../lib/tutor-reply.ts'
import type { TutorAction, TutorContext, TutorStatus } from '../lib/tutor-context.ts'
import type { Slide } from '../schemas/lesson.schema.ts'

const DEFAULT_MODEL = 'gemini-3.5-flash-lite'
const ACTIONS: TutorAction[] = ['hint', 'explain', 'example', 'chat']
const STATUSES: TutorStatus[] = ['welcome', 'new', 'trying', 'correct', 'revealed', 'done']
const KINDS: Slide['type'][] = ['intro', 'task', 'outro']

type TutorResult = { status: number; body: { reply: string; source: 'lesson' | 'tutor' } | { error: string } }

function clip(value: unknown, max: number): string {
  return typeof value === 'string' ? value.replace(/\s+/g, ' ').trim().slice(0, max) : ''
}

function clipOrNull(value: unknown, max: number): string | null {
  const text = clip(value, max)
  return text.length > 0 ? text : null
}

function stringList(value: unknown, maxItems: number, maxLength: number): string[] {
  if (!Array.isArray(value)) return []
  return value.slice(0, maxItems).map((item) => clip(item, maxLength)).filter((item) => item.length > 0)
}

function readContext(value: unknown): TutorContext | null {
  if (value === null || typeof value !== 'object') return null
  const raw = value as Record<string, unknown>
  const characterName = clip(raw.characterName, 40)
  const prompt = clip(raw.prompt, 500)
  if (!characterName || !prompt) return null
  const status = STATUSES.find((item) => item === raw.status) ?? 'new'
  const slideKind = KINDS.find((item) => item === raw.slideKind) ?? 'task'
  const attempts = typeof raw.attempts === 'number' && Number.isInteger(raw.attempts) ? Math.min(3, Math.max(0, raw.attempts)) : 0
  const helpCount = typeof raw.helpCount === 'number' && Number.isInteger(raw.helpCount) ? Math.min(8, Math.max(0, raw.helpCount)) : 0
  return {
    characterName,
    lessonTitle: clip(raw.lessonTitle, 80) || 'this lesson',
    topic: clip(raw.topic, 80),
    grade: typeof raw.grade === 'number' ? Math.min(8, Math.max(1, Math.round(raw.grade))) : 4,
    slideId: clip(raw.slideId, 48) || 'slide',
    slideKind,
    prompt,
    supporting: clipOrNull(raw.supporting, 180),
    picture: clipOrNull(raw.picture, 280),
    choices: stringList(raw.choices, 4, 24),
    howToAnswer: clip(raw.howToAnswer, 120),
    attempts,
    lastTry: clipOrNull(raw.lastTry, 40),
    sawClue: raw.sawClue === true,
    helpCount,
    status,
    maySayAnswer: raw.maySayAnswer === true && (status === 'correct' || status === 'revealed'),
    answerLabel: clipOrNull(raw.answerLabel, 24),
    explanation: clipOrNull(raw.explanation, 240),
    clue: clipOrNull(raw.clue, 200),
    secondClue: clipOrNull(raw.secondClue, 200),
    secretPhrases: stringList(raw.secretPhrases, 6, 80),
  }
}

function readRequest(body: unknown): { context: TutorContext; action: TutorAction; note: string } | null {
  if (body === null || typeof body !== 'object') return null
  const raw = body as Record<string, unknown>
  const context = readContext(raw.context)
  const action = ACTIONS.find((item) => item === raw.action)
  if (!context || !action) return null
  return { context, action, note: clip(raw.note, 200) }
}

function modelText(payload: unknown): string {
  const root = payload !== null && typeof payload === 'object' ? (payload as { candidates?: unknown }) : null
  const candidate = Array.isArray(root?.candidates) ? root.candidates[0] : null
  const content = candidate !== null && typeof candidate === 'object' ? (candidate as { content?: { parts?: unknown } }).content : null
  const parts = Array.isArray(content?.parts) ? content.parts : []
  return parts
    .map((part) => (part !== null && typeof part === 'object' && typeof (part as { text?: unknown }).text === 'string' ? (part as { text: string }).text : ''))
    .join('')
}

function tutorPrompt(context: TutorContext, action: TutorAction, note: string, grounded: string): string {
  const card = {
    character: context.characterName,
    grade: context.grade,
    topic: context.topic,
    status: context.status,
    maySayAnswer: context.maySayAnswer,
    question: context.prompt,
    picture: context.picture,
    choices: context.choices,
    clue: context.clue,
    secondClue: context.secondClue,
    attempts: context.attempts,
    lastTry: context.lastTry,
    knownExplanation: context.maySayAnswer ? context.explanation : null,
  }
  return [
    `You are ${context.characterName}, a kind tutor for a child in grade ${context.grade}.`,
    'Help them discover the idea. Give one small step or ask one small question.',
    'Use only the lesson card and the safe reply. Do not invent a new fraction or a new answer.',
    'If maySayAnswer is false, never say which choice is right, even if the child asks for the answer.',
    'If status is correct, celebrate in one happy sentence and you may use knownExplanation.',
    'Two short sentences. Simple words. No markdown.',
    'Return JSON only: {"reply":"..."}',
    `Action: ${action}`,
    note ? `Child says: ${note}` : 'The child tapped a help button.',
    `Safe reply to rephrase: ${grounded}`,
    `Lesson card: ${JSON.stringify(card)}`,
  ].join('\n')
}

async function postTutor(key: string, model: string, prompt: string, fast: boolean): Promise<Response | null> {
  try {
    return await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: 'POST',
      signal: AbortSignal.timeout(8000),
      headers: { 'content-type': 'application/json', 'x-goog-api-key': key },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: 400,
          responseMimeType: 'application/json',
          ...(fast ? { thinkingConfig: { thinkingLevel: 'minimal' } } : {}),
        },
      }),
    })
  } catch {
    return null
  }
}

async function callTutor(key: string, model: string, prompt: string): Promise<string | null> {
  let response = await postTutor(key, model, prompt, true)
  if (response?.status === 400) response = await postTutor(key, model, prompt, false)
  if (!response?.ok) return null
  const text = modelText(await response.json().catch(() => null)).trim().replace(/^```(?:json)?/i, '').replace(/```$/i, '').trim()
  try {
    const start = text.indexOf('{')
    const end = text.lastIndexOf('}')
    const parsed: unknown = JSON.parse(start >= 0 && end > start ? text.slice(start, end + 1) : text)
    const reply = parsed !== null && typeof parsed === 'object' ? (parsed as { reply?: unknown }).reply : null
    return typeof reply === 'string' ? reply.replace(/\s+/g, ' ').trim() : null
  } catch {
    return null
  }
}

export async function handleTutor(body: unknown, env: Record<string, string>): Promise<TutorResult> {
  const request = readRequest(body)
  if (!request) return { status: 400, body: { error: 'Ask me about the question on the screen.' } }
  const grounded = localTutorReply(request.context, request.action, request.note)
  const key = env.GEMINI_API_KEY?.trim()
  if (!key) return { status: 200, body: { reply: grounded, source: 'lesson' } }

  const polished = await callTutor(key, env.GEMINI_MODEL?.trim() || DEFAULT_MODEL, tutorPrompt(request.context, request.action, request.note, grounded))
  const safe = polished && polished.length <= 320 && !replyLeaks(polished, request.context, grounded)
  return { status: 200, body: { reply: safe ? polished : grounded, source: safe ? 'tutor' : 'lesson' } }
}
