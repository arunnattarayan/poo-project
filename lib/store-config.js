import 'server-only'
import { cache } from 'react'
import { supabasePublic } from './supabase-public'
import { DEFAULT_CONFIG } from './utils'

/** Reads `store_config` into a { key: value } map, falling back to defaults. Deduped per request. */
export const getStoreConfig = cache(async () => {
  const { data, error } = await supabasePublic.from('store_config').select('key, value')
  if (error) {
    console.error('Failed to load store_config:', error.message)
    return { ...DEFAULT_CONFIG }
  }
  return { ...DEFAULT_CONFIG, ...Object.fromEntries(data.map((r) => [r.key, r.value])) }
})
