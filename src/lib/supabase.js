import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// null when Supabase isn't configured yet — the app then runs purely local,
// exactly as before sync existed.
export const supabase = url && anonKey ? createClient(url, anonKey) : null

export const syncConfigured = !!supabase
