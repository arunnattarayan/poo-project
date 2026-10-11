'use server'

import { revalidatePath } from 'next/cache'
import { createServerSupabase } from '@/lib/supabase-server'
import {
  HERO_BUCKET,
  isValidImagePath,
  validateDraft,
  validateForPublish,
} from '@/lib/hero-validation'

class AuthError extends Error {}

/**
 * Server-side authorization guard ensuring only admins can invoke these actions.
 * Returns the cookie-aware client so RLS also applies to every query.
 */
async function requireAdmin() {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new AuthError('You must be signed in to perform this action.')
  const { data: isAdmin } = await supabase.rpc('is_admin')
  if (isAdmin !== true) throw new AuthError('Not authorized. Admin privileges required.')
  return supabase
}

/**
 * Wraps an action so auth / unexpected errors come back as `{ success:false, message }`
 * (thrown errors have their message redacted by Next.js in production).
 */
function guarded(fn) {
  return async (...args) => {
    try {
      const supabase = await requireAdmin()
      return await fn(supabase, ...args)
    } catch (err) {
      if (!(err instanceof AuthError)) console.error('[hero action]', err)
      return { success: false, message: err?.message || 'Unexpected error' }
    }
  }
}

function revalidateHero() {
  revalidatePath('/')
  revalidatePath('/admin/hero')
}

/** Confirms the uploaded object really exists in the hero bucket. */
async function imageExists(supabase, path) {
  if (!isValidImagePath(path)) return false
  const [folder, name] = path.split('/')
  const { data, error } = await supabase.storage.from(HERO_BUCKET).list(folder, { search: name, limit: 10 })
  return !error && Array.isArray(data) && data.some((o) => o.name === name)
}

async function validatePublishable(supabase, slide) {
  const validation = validateForPublish(slide)
  if (!validation.isValid) return validation
  const errors = {}
  if (!(await imageExists(supabase, slide.image_path))) {
    errors.image = 'Desktop image file was not found in storage. Please re-upload it.'
  }
  if (slide.mobile_image_path && !(await imageExists(supabase, slide.mobile_image_path))) {
    errors.mobile_image = 'Mobile image file was not found in storage. Please re-upload it.'
  }
  return { isValid: Object.keys(errors).length === 0, errors }
}

function toIsoOrNull(value) {
  if (!value) return null
  const d = new Date(value)
  return isNaN(d.getTime()) ? null : d.toISOString()
}

const trimOrNull = (v) => (typeof v === 'string' && v.trim() ? v.trim() : null)

/**
 * Save a slide.
 *  - publish=true  → status 'published', full publish validation (incl. storage existence)
 *  - publish=false → status 'draft' (takes it off the homepage), relaxed validation
 * Dates must arrive as ISO strings (the client converts from the admin's local time).
 */
export const saveHeroSlide = guarded(async (supabase, input, { publish = false } = {}) => {
  const status = publish ? 'published' : 'draft'

  const row = {
    title: trimOrNull(input.title) ?? '',
    subtitle: trimOrNull(input.subtitle),
    image_url: trimOrNull(input.image_url),
    image_path: trimOrNull(input.image_path),
    mobile_image_url: trimOrNull(input.mobile_image_url),
    mobile_image_path: trimOrNull(input.mobile_image_path),
    image_alt: trimOrNull(input.image_alt),
    offer_badge: trimOrNull(input.offer_badge),
    button_text: trimOrNull(input.button_text),
    button_url: trimOrNull(input.button_url),
    text_alignment: input.text_alignment || 'center',
    text_position: input.text_position || 'middle',
    overlay_opacity: Number.isFinite(Number(input.overlay_opacity)) ? Number(input.overlay_opacity) : 40,
    status,
    starts_at: toIsoOrNull(input.starts_at),
    ends_at: toIsoOrNull(input.ends_at),
  }

  // Image paths must stay inside slides/ (DB constraint enforces this too).
  for (const key of ['image_path', 'mobile_image_path']) {
    if (row[key] && !isValidImagePath(row[key])) {
      return { success: false, message: 'Invalid image path.', errors: { image: 'Invalid image path.' } }
    }
  }

  const validation = publish ? await validatePublishable(supabase, row) : validateDraft(row)
  if (!validation.isValid) {
    return {
      success: false,
      errors: validation.errors,
      message: 'Validation failed. Please correct the highlighted errors.',
    }
  }

  let saved
  let previous = null

  if (input.id) {
    const { data: existing, error: fetchErr } = await supabase
      .from('homepage_hero_slides')
      .select('image_path, mobile_image_path')
      .eq('id', input.id)
      .single()
    if (fetchErr || !existing) return { success: false, message: 'Slide not found.' }
    previous = existing

    const { data, error } = await supabase
      .from('homepage_hero_slides')
      .update(row)
      .eq('id', input.id)
      .select()
      .single()
    if (error) return { success: false, message: error.message }
    saved = data
  } else {
    const { data: last } = await supabase
      .from('homepage_hero_slides')
      .select('display_order')
      .order('display_order', { ascending: false })
      .limit(1)
    row.display_order = last?.length ? last[0].display_order + 1 : 0

    const { data, error } = await supabase
      .from('homepage_hero_slides')
      .insert(row)
      .select()
      .single()
    if (error) return { success: false, message: error.message }
    saved = data
  }

  // Replaced images: queue the old files for cleanup (only after the row no longer references them).
  const replaced = [
    previous?.image_path !== row.image_path && previous?.image_path,
    previous?.mobile_image_path !== row.mobile_image_path && previous?.mobile_image_path,
  ].filter(Boolean)
  if (replaced.length) {
    await enqueueCleanup(supabase, replaced)
    await runCleanup(supabase)
  }

  revalidateHero()
  return { success: true, data: saved }
})

/** Toggle publication. Publishing re-runs full publish validation. */
export const setHeroSlideStatus = guarded(async (supabase, id, newStatus) => {
  if (!['draft', 'published', 'inactive'].includes(newStatus)) {
    return { success: false, message: 'Invalid status.' }
  }

  if (newStatus === 'published') {
    const { data: slide, error } = await supabase
      .from('homepage_hero_slides')
      .select('*')
      .eq('id', id)
      .single()
    if (error || !slide) return { success: false, message: 'Slide not found.' }

    const validation = await validatePublishable(supabase, slide)
    if (!validation.isValid) {
      return {
        success: false,
        message: `Cannot publish: ${Object.values(validation.errors).join(' ')}`,
        errors: validation.errors,
      }
    }
  }

  const { error } = await supabase
    .from('homepage_hero_slides')
    .update({ status: newStatus })
    .eq('id', id)
  if (error) return { success: false, message: error.message }

  revalidateHero()
  return { success: true }
})

/** Atomic reorder via transactional RPC (validates ids, locks table). */
export const reorderHeroSlides = guarded(async (supabase, ids) => {
  if (!Array.isArray(ids) || ids.length === 0) return { success: false, message: 'Nothing to reorder.' }
  const { error } = await supabase.rpc('reorder_hero_slides', { p_ids: ids })
  if (error) return { success: false, message: error.message }
  revalidateHero()
  return { success: true }
})

/**
 * Delete a slide. Paths are queued BEFORE the row is deleted so they can never be lost;
 * storage removal is then attempted and retried later if it fails.
 */
export const deleteHeroSlide = guarded(async (supabase, id) => {
  const { data: slide, error: fetchErr } = await supabase
    .from('homepage_hero_slides')
    .select('image_path, mobile_image_path')
    .eq('id', id)
    .single()
  if (fetchErr || !slide) return { success: false, message: 'Slide not found.' }

  const paths = [slide.image_path, slide.mobile_image_path].filter(Boolean)
  const queued = await enqueueCleanup(supabase, paths)
  if (!queued.ok) return { success: false, message: `Could not schedule image cleanup: ${queued.message}` }

  const { error: delErr } = await supabase.from('homepage_hero_slides').delete().eq('id', id)
  if (delErr) {
    // Row still exists → its images are still in use; un-queue them.
    await supabase.from('storage_cleanup_queue').delete().eq('bucket_id', HERO_BUCKET).in('object_path', paths)
    return { success: false, message: delErr.message }
  }

  const cleanup = await runCleanup(supabase)
  revalidateHero()
  return {
    success: true,
    warning: cleanup.failed ? `${cleanup.failed} image(s) could not be removed yet — use Retry cleanup.` : undefined,
  }
})

/**
 * Called when an admin removes/replaces an image that was uploaded in the editor
 * but never saved on a slide, so the file doesn't become orphaned.
 */
export const discardUploadedHeroImage = guarded(async (supabase, path) => {
  if (!isValidImagePath(path)) return { success: false, message: 'Invalid image path.' }
  await enqueueCleanup(supabase, [path])
  await runCleanup(supabase)
  return { success: true }
})

export const retryHeroImageCleanup = guarded(async (supabase) => {
  const result = await runCleanup(supabase)
  return { success: true, ...result }
})

export const getPendingCleanupCount = guarded(async (supabase) => {
  const { count, error } = await supabase
    .from('storage_cleanup_queue')
    .select('*', { count: 'exact', head: true })
  if (error) return { success: false, message: error.message }
  return { success: true, count: count || 0 }
})

// ---------------------------------------------------------------------------
// Internal helpers (not exported → cannot be invoked from the client)
// ---------------------------------------------------------------------------

async function enqueueCleanup(supabase, paths) {
  if (!paths.length) return { ok: true }
  const { error } = await supabase
    .from('storage_cleanup_queue')
    .upsert(
      paths.map((object_path) => ({ bucket_id: HERO_BUCKET, object_path })),
      { onConflict: 'bucket_id,object_path', ignoreDuplicates: true }
    )
  return error ? { ok: false, message: error.message } : { ok: true }
}

async function runCleanup(supabase) {
  const { data: items } = await supabase
    .from('storage_cleanup_queue')
    .select('*')
    .eq('bucket_id', HERO_BUCKET)
    .order('id')
    .limit(50)
  if (!items?.length) return { processed: 0, failed: 0 }

  let failed = 0
  for (const item of items) {
    // Never delete a file that some slide still references.
    const { count } = await supabase
      .from('homepage_hero_slides')
      .select('id', { count: 'exact', head: true })
      .or(`image_path.eq.${item.object_path},mobile_image_path.eq.${item.object_path}`)
    if (count) {
      await supabase.from('storage_cleanup_queue').delete().eq('id', item.id)
      continue
    }

    const { error } = await supabase.storage.from(item.bucket_id).remove([item.object_path])
    if (!error) {
      await supabase.from('storage_cleanup_queue').delete().eq('id', item.id)
    } else {
      failed++
      await supabase
        .from('storage_cleanup_queue')
        .update({ attempts: item.attempts + 1, last_error: error.message })
        .eq('id', item.id)
    }
  }
  return { processed: items.length, failed }
}
