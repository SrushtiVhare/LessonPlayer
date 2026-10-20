import { useEffect, useState } from 'react'
import { useParams } from 'react-router'
import { LoadingMission, MissingAdventure, ThemedScreen } from '../components/layout/Screens.tsx'
import { LessonPlayer } from '../features/lesson-player/LessonPlayer.tsx'
import { bundledLessons, resolveLesson } from '../features/lesson-library/catalog.ts'
import { isSupabaseConfigured } from '../services/supabase/client.ts'
import { refreshRemoteLesson } from '../services/supabase/lessons.repository.ts'
import type { Lesson } from '../schemas/lesson.schema.ts'

export function LessonPage() {
  const { lessonId } = useParams()
  const id = lessonId ?? ''
  const [lesson, setLesson] = useState<Lesson | null>(() => (id ? resolveLesson(id) : null))
  const [phase, setPhase] = useState<'ready' | 'loading' | 'missing'>(() => {
    if (!id) return 'missing'
    if (resolveLesson(id)) return 'ready'
    return isSupabaseConfigured ? 'loading' : 'missing'
  })

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

  return (
    <ThemedScreen theme={lesson.theme}>
      <LessonPlayer lesson={lesson} hasMoreLessons={bundledLessons.length > 1} />
    </ThemedScreen>
  )
}
