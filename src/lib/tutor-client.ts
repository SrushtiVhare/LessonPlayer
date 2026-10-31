import type { TutorAction, TutorContext } from './tutor-context.ts'
import { localTutorReply, replyLeaks } from './tutor-reply.ts'

export async function requestTutorReply(input: { context: TutorContext; action: TutorAction; note?: string }): Promise<string> {
  const note = input.note ?? ''
  const grounded = localTutorReply(input.context, input.action, note)
  try {
    const response = await fetch('/api/tutor', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ context: input.context, action: input.action, note }),
      signal: AbortSignal.timeout(9000),
    })
    if (!response.ok) return grounded
    const body: unknown = await response.json()
    const reply = body !== null && typeof body === 'object' ? (body as { reply?: unknown }).reply : null
    if (typeof reply !== 'string') return grounded
    const text = reply.replace(/\s+/g, ' ').trim()
    if (!text || replyLeaks(text, input.context, grounded)) return grounded
    return text
  } catch {
    return grounded
  }
}
