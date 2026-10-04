import { createBrowserClient } from '@supabase/ssr'

/**
 * Browser Supabase client (Client Components only).
 * Stores the auth session in cookies so middleware and server code can read it.
 * `createBrowserClient` returns a singleton, so calling this repeatedly is cheap.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
}
