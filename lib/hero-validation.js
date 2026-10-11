export const HERO_BUCKET = 'hero-images'

export function isValidImagePath(path) {
  return typeof path === 'string' && /^slides\/[A-Za-z0-9._-]+$/.test(path)
}

export const HERO_ASPECT_CONFIG = {
  desktop: {
    recommendedWidth: 2400,
    recommendedHeight: 900,
    minWidth: 1200,
    minRatio: 2.2,
    maxRatio: 3.2,
    targetRatioLabel: '16:6 (~2.67:1)',
  },
  mobile: {
    recommendedWidth: 1080,
    recommendedHeight: 1350,
    minWidth: 600,
    minRatio: 0.65,
    maxRatio: 0.95,
    targetRatioLabel: '4:5 (0.8:1)',
  },
  maxSizeBytes: 5 * 1024 * 1024, // 5 MB
  allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
}

/**
 * Validates destination URL safety
 */
export function isValidCtaUrl(url) {
  if (!url) return true
  const trimmed = url.trim()
  if (trimmed.startsWith('/')) {
    // `//host` and `/\host` are both treated as protocol-relative by browsers.
    return !/^\/[\/\\]/.test(trimmed) && !/\s/.test(trimmed)
  }
  try {
    const parsed = new URL(trimmed)
    return parsed.protocol === 'https:'
  } catch {
    return false
  }
}

/**
 * Validates a slide payload for publishing
 */
export function validateForPublish(slide) {
  const errors = {}

  if (!slide.title || !slide.title.trim()) {
    errors.title = 'Title is required'
  } else if (slide.title.trim().length > 120) {
    errors.title = 'Title cannot exceed 120 characters'
  }

  if (slide.subtitle && slide.subtitle.trim().length > 300) {
    errors.subtitle = 'Subtitle cannot exceed 300 characters'
  }

  if (!slide.image_url || !slide.image_path) {
    errors.image = 'Desktop banner image is required for publishing'
  } else if (!isValidImagePath(slide.image_path)) {
    errors.image = 'Desktop image must be uploaded through the admin uploader'
  }

  if (slide.mobile_image_path && !isValidImagePath(slide.mobile_image_path)) {
    errors.mobile_image = 'Mobile image must be uploaded through the admin uploader'
  }

  if (slide.image_url && (!slide.image_alt || !slide.image_alt.trim())) {
    errors.image_alt = 'Alternative text (accessibility) is required when an image is uploaded'
  }

  const hasBtnText = Boolean(slide.button_text && slide.button_text.trim())
  const hasBtnUrl = Boolean(slide.button_url && slide.button_url.trim())

  if (hasBtnText !== hasBtnUrl) {
    errors.button = 'Both button text and button URL must be provided together'
  } else if (hasBtnUrl && !isValidCtaUrl(slide.button_url)) {
    errors.button_url = 'Button URL must be a valid relative path (e.g. /#products) or https:// link'
  }

  if (slide.starts_at && slide.ends_at) {
    const start = new Date(slide.starts_at).getTime()
    const end = new Date(slide.ends_at).getTime()
    if (isNaN(start) || isNaN(end)) {
      errors.schedule = 'Invalid schedule dates'
    } else if (end <= start) {
      errors.schedule = 'End date must be after start date'
    }
  }

  const validAlignments = ['left', 'center', 'right']
  if (slide.text_alignment && !validAlignments.includes(slide.text_alignment)) {
    errors.text_alignment = 'Invalid text alignment'
  }

  const validPositions = ['top', 'middle', 'bottom']
  if (slide.text_position && !validPositions.includes(slide.text_position)) {
    errors.text_position = 'Invalid text position'
  }

  if (slide.overlay_opacity !== undefined) {
    const op = Number(slide.overlay_opacity)
    if (isNaN(op) || op < 0 || op > 90) {
      errors.overlay_opacity = 'Overlay opacity must be between 0% and 90%'
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  }
}

/**
 * Validates a slide payload for draft saving (relaxed)
 */
export function validateDraft(slide) {
  const errors = {}

  if (!slide.title || !slide.title.trim()) {
    errors.title = 'Title is required even for drafts'
  }

  if (slide.button_url && !isValidCtaUrl(slide.button_url)) {
    errors.button_url = 'Button URL must be a valid relative path or https:// link'
  }

  if (slide.starts_at && slide.ends_at) {
    const start = new Date(slide.starts_at).getTime()
    const end = new Date(slide.ends_at).getTime()
    if (start && end && end <= start) {
      errors.schedule = 'End date must be after start date'
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  }
}
