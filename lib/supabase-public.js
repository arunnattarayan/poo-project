import { createClient } from '@supabase/supabase-js'

/**
 * Stateless anon client for public storefront reads on the server.
 * No cookies → pages stay cacheable (ISR), which keeps Vercel + Supabase usage low.
 */
export const supabasePublic = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } }
)
