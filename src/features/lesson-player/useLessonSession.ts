import { useCallback, useEffect, useReducer, useRef, useState } from 'react'
import { chooseProgressSource, reconcileProgress } from '../../lib/progress-reconcile.ts'
import { clearLocalProgress, readLocalProgress, writeLocalProgress } from '../../lib/storage.ts'
import type { Lesson } from '../../schemas/lesson.schema.ts'
import type { SavedProgress } from '../../schemas/progress.schema.ts'
import { isSupabaseConfigured } from '../../services/supabase/client.ts'
import { pullRemoteProgress, pushRemoteProgress } from '../../services/supabase/progress.repository.ts'
import { createInitialState, lessonReducer, type LessonAction, type LessonPlayerState } from './lesson-reducer.ts'

export type SyncStatus = 'local' | 'online' | 'pending'

const FRESH_NOTICE = 'We started this mission fresh because the saved progress could not be read.'

function loadBoot(lesson: Lesson): { state: LessonPlayerState; notice: string | null; restarted: boolean } {
  const restart = new URLSearchParams(window.location.search).get('restart') === '1'
  if (restart) {
    clearLocalProgress(lesson.id)
    return { state: createInitialState(lesson), notice: null, restarted: true }
  }
  const read = readLocalProgress(lesson.id)
  if (read.status === 'invalid') {
    return { state: createInitialState(lesson), notice: FRESH_NOTICE, restarted: false }
  }
  if (read.status === 'empty') return { state: createInitialState(lesson), notice: null, restarted: false }
  const reconciled = reconcileProgress(lesson, read.progress)
  return { ...reconciled, restarted: false }
}

export function useLessonSession(lesson: Lesson) {
  const [boot] = useState(() => loadBoot(lesson))
  const [notice, setNotice] = useState(boot.notice)
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(isSupabaseConfigured ? 'pending' : 'local')
  const userEdited = useRef(boot.restarted)
  const remoteBlocked = useRef(false)
  const pullSettled = useRef(!isSupabaseConfigured)
  const reduce = useCallback(
    (current: LessonPlayerState, action: LessonAction) => lessonReducer(lesson, current, action),
    [lesson],
  )
  const [state, dispatchBase] = useReducer(reduce, boot.state)
  const lessonRef = useRef(lesson)

  const dispatch = useCallback((action: LessonAction) => {
    if (action.type !== 'hydrate') userEdited.current = true
    dispatchBase(action)
  }, [dispatchBase])

  useEffect(() => {
    const saved: SavedProgress = {
      lessonId: lesson.id,
      lessonVersion: lesson.version,
      slideId: state.slideId,
      tasks: state.tasks,
      updatedAt: new Date().toISOString(),
    }
    if (!writeLocalProgress(saved)) {
      // Storage can fail in private browsing. Tell the child without losing the session.
      // oxlint-disable-next-line react/set-state-in-effect
      setNotice((current) => current ?? 'Progress may not be saved in this browser.')
    }
    if (!isSupabaseConfigured || !pullSettled.current || remoteBlocked.current) return
    const handle = window.setTimeout(() => {
      void pushRemoteProgress(lesson, saved).then((ok) => setSyncStatus(ok ? 'online' : 'pending'))
    }, 350)
    return () => window.clearTimeout(handle)
  }, [lesson, state])

  useEffect(() => {
    lessonRef.current = lesson
  }, [lesson])

  useEffect(() => {
    if (!isSupabaseConfigured) return
    let cancelled = false
    void (async () => {
      const currentLesson = lessonRef.current
      const remote = await pullRemoteProgress(currentLesson.id)
      if (cancelled) return
      pullSettled.current = true
      if (remote.status === 'disabled') {
        remoteBlocked.current = true
        setSyncStatus('pending')
        return
      }
      if (remote.status === 'error') {
        setSyncStatus('pending')
        return
      }
      const local = readLocalProgress(currentLesson.id)
      const localTime = local.status === 'ok' ? local.progress.updatedAt : null
      const remoteTime = remote.status === 'ok' ? remote.progress.updatedAt : null
      const choice = chooseProgressSource(localTime, remoteTime, userEdited.current)
      if (choice === 'remote' && remote.status === 'ok') {
        const reconciled = reconcileProgress(currentLesson, remote.progress)
        dispatchBase({ type: 'hydrate', state: reconciled.state })
        if (reconciled.notice) setNotice(reconciled.notice)
        setSyncStatus('online')
        return
      }
      if (local.status === 'ok') {
        const ok = await pushRemoteProgress(currentLesson, local.progress)
        if (!cancelled) setSyncStatus(ok ? 'online' : 'pending')
        return
      }
      if (!cancelled) setSyncStatus('online')
    })()
    return () => {
      cancelled = true
    }
  }, [dispatchBase, lesson.id])

  return {
    state,
    dispatch,
    notice,
    syncStatus,
    dismissNotice: () => setNotice(null),
  }
}
