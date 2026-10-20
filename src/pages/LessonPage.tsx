import { useEffect, useMemo, useState } from 'react'
import { useParams, useSearchParams } from 'react-router'
import { LoadingMission, MissingAdventure, ThemedScreen } from '../components/layout/Screens.tsx'
import { LessonPlayer } from '../features/lesson-player/LessonPlayer.tsx'
import { lessonWithAdventure } from '../features/lesson-library/adventures.ts'
import { bundledLessons, resolveLesson } from '../features/lesson-library/catalog.ts'
import { readAdventureId, writeAdventureId } from '../lib/storage.ts'
import { isSupabaseConfigured } from '../services/supabase/client.ts'
import { refreshRemoteLesson } from '../services/supabase/lessons.repository.ts'
import type { Lesson } from '../schemas/lesson.schema.ts'

export function LessonPage() {
  const { lessonId } = useParams()
  const [searchParams] = useSearchParams()
  const id = lessonId ?? ''
  const adventureId = searchParams.get('adventure') ?? readAdventureId() ?? 'space'
  const [lesson, setLesson] = useState<Lesson | null>(() => (id ? resolveLesson(id) : null))
  const [phase, setPhase] = useState<'ready' | 'loading' | 'missing'>(() => {
    if (!id) return 'missing'
    if (resolveLesson(id)) return 'ready'
    return isSupabaseConfigured ? 'loading' : 'missing'
  })

  useEffect(() => {
    writeAdventureId(adventureId)
  }, [adventureId])

  const skinned = useMemo(() => (lesson ? lessonWithAdventure(lesson, adventureId) : null), [adventureId, lesson])

  useEffect(() => {
    if (!id) return
    let cancelled = false
    void refreshRemoteLesson(id).then((remote) => {
      if (cancelled) return
      if (!lesson && remote) {
        setLesson(remote)
        setPhase('ready')
        return
      }
      if (!lesson && !remote) setPhase('missing')
    })
    return () => {
      cancelled = true
    }
  }, [id, lesson])

  if (phase === 'loading') {
    return (
      <div className="bg-canvas text-ink">
        <LoadingMission />
      </div>
    )
  }
  if (!lesson || phase === 'missing') return <MissingAdventure />

  if (!skinned) return <MissingAdventure />

  return (
    <ThemedScreen theme={skinned.theme}>
      <LessonPlayer lesson={skinned} hasMoreLessons={bundledLessons.length > 1} />
    </ThemedScreen>
  )
}
