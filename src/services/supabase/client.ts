import { createClient, type SupabaseClient } from '@supabase/supabase-js'

export type SupabaseConfig = {
  url: string
  anonKey: string
}

export function readSupabaseConfig(env: { url?: string; anonKey?: string }): SupabaseConfig | null {
  const url = env.url?.trim() ?? ''
  const anonKey = env.anonKey?.trim() ?? ''
  if (!url || !anonKey) return null
  try {
    const parsed = new URL(url)
    if (parsed.protocol !== 'https:' || parsed.username || parsed.password) return null
  } catch {
    return null
  }
  if (anonKey.split('.').length < 3) return null
  return { url, anonKey }
}

export function createSupabaseClient(config: SupabaseConfig | null): SupabaseClient | null {
  if (!config) return null
  return createClient(config.url, config.anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  })
}

const config = readSupabaseConfig({
  url: import.meta.env.VITE_SUPABASE_URL,
  anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
})

export const supabase = createSupabaseClient(config)
export const isSupabaseConfigured = supabase !== null
