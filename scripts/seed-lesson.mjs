import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'

const url = process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !serviceRoleKey) {
  console.error('Add VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to .env, then run npm run seed.')
  process.exit(1)
}

const lesson = JSON.parse(readFileSync(new URL('../src/lessons/space-fractions.json', import.meta.url), 'utf8'))
const supabase = createClient(url, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})

const { error } = await supabase.from('lessons').upsert(
  {
    id: lesson.id,
    title: lesson.title,
    topic: lesson.topic,
    grade: lesson.grade,
    version: lesson.version,
    theme: lesson.theme,
    lesson_data: lesson,
    published: true,
  },
  { onConflict: 'id' },
)

if (error) {
  console.error(`Seed failed: ${error.message}`)
  process.exit(1)
}

console.log(`Seeded ${lesson.id} version ${lesson.version}.`)
