// Shared between server and client code.

export const DEFAULT_CONFIG = {
  store_name: 'Nanjai Clothing',
  store_tagline: 'Tamil & spiritual printed T-shirts',
  whatsapp_number: '',
  currency_symbol: '₹',
  delivery_fee: '0',
}

export function formatPrice(amount, symbol = '₹') {
  const n = Number(amount) || 0
  return `${symbol}${n.toLocaleString('en-IN', {
    minimumFractionDigits: Number.isInteger(n) ? 0 : 2,
    maximumFractionDigits: 2,
  })}`
}

/** Keep digits only — wa.me requires the number without "+", spaces or dashes. */
export function normalizeWhatsapp(number) {
  return String(number || '').replace(/\D/g, '')
}

export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** Ordered, de-duplicated gallery for a product (falls back to the single cover image). */
export function getProductImages(product) {
  const list = Array.isArray(product?.images) && product.images.length ? product.images : [product?.image_url]
  return [...new Set(list.filter(Boolean))]
}

/** Absolute site origin used for canonical URLs, sitemap and Open Graph. */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL && `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`) ||
  'http://localhost:3000'
).replace(/\/$/, '')

/** Trim text to a clean meta-description length. */
export function truncate(text, max = 160) {
  const s = String(text || '').replace(/\s+/g, ' ').trim()
  return s.length > max ? `${s.slice(0, max - 1).trimEnd()}…` : s
}
