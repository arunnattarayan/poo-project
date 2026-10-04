'use server'
import { revalidatePath } from 'next/cache'
import { createServerSupabase } from '@/lib/supabase-server'

/**
 * Purges the cached storefront so admin edits (products/settings) show up immediately
 * instead of waiting for the ISR window. Only admins may trigger it.
 */
export async function revalidateStorefront() {
  const supabase = await createServerSupabase()
  const { data: isAdmin } = await supabase.rpc('is_admin')
  if (isAdmin !== true) return { ok: false }
  revalidatePath('/', 'layout')
  return { ok: true }
}
