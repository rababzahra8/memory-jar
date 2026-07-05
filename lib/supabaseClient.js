import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

let _client = null

export function getSupabase() {
  if (!url || !anonKey) return null
  if (!_client) {
    _client = createClient(url, anonKey, {
      auth: { persistSession: false },
    })
  }
  return _client
}

export function supabaseConfigured() {
  return Boolean(url && anonKey)
}
