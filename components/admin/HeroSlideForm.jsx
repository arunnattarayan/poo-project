'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, Send, Loader2, Smartphone, Monitor } from 'lucide-react'
import Link from 'next/link'
import HeroImageUploader from './HeroImageUploader'
import HeroSlide from '@/components/HeroSlide'
import { saveHeroSlide, discardUploadedHeroImage } from '@/app/admin/hero/actions'

/** ISO (UTC) → value for <input type="datetime-local"> in the admin's local timezone. */
function toLocalInput(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/** datetime-local value (browser local time) → ISO (UTC). Done in the browser so the server's TZ never matters. */
function localInputToIso(value) {
  if (!value) return null
  const d = new Date(value)
  return isNaN(d.getTime()) ? null : d.toISOString()
}

export default function HeroSlideForm({ initialSlide = {} }) {
  const router = useRouter()

  const [formData, setFormData] = useState({
    id: initialSlide.id || undefined,
    title: initialSlide.title || '',
    subtitle: initialSlide.subtitle || '',
    image_url: initialSlide.image_url || '',
    image_path: initialSlide.image_path || '',
    mobile_image_url: initialSlide.mobile_image_url || '',
    mobile_image_path: initialSlide.mobile_image_path || '',
    image_alt: initialSlide.image_alt || '',
    offer_badge: initialSlide.offer_badge || '',
    button_text: initialSlide.button_text || '',
    button_url: initialSlide.button_url || '',
    text_alignment: initialSlide.text_alignment || 'center',
    text_position: initialSlide.text_position || 'middle',
    overlay_opacity: initialSlide.overlay_opacity !== undefined ? initialSlide.overlay_opacity : 40,
    status: initialSlide.status || 'draft',
    starts_at: toLocalInput(initialSlide.starts_at),
    ends_at: toLocalInput(initialSlide.ends_at),
  })

  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [previewDevice, setPreviewDevice] = useState('desktop') // 'desktop' | 'mobile'

  // Files uploaded in this editing session that are not yet saved on the slide.
  const unsavedUploads = useRef(new Set())

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }))
    }
  }

  /** Swap an image field; if the outgoing file was never saved, delete it. */
  function setImage(urlKey, pathKey, next) {
    const oldPath = formData[pathKey]
    if (oldPath && unsavedUploads.current.has(oldPath)) {
      unsavedUploads.current.delete(oldPath)
      discardUploadedHeroImage(oldPath)
    }
    if (next?.path) unsavedUploads.current.add(next.path)
    setFormData((prev) => ({ ...prev, [urlKey]: next?.url || '', [pathKey]: next?.path || '' }))
    setErrors((prev) => ({ ...prev, image: undefined, mobile_image: undefined }))
  }

  function handleCancel() {
    unsavedUploads.current.forEach((p) => discardUploadedHeroImage(p))
    unsavedUploads.current.clear()
  }

  async function handleSubmit(e, isPublish) {
    if (e) e.preventDefault()
    setSubmitting(true)
    setErrors({})

    try {
      const res = await saveHeroSlide(
        {
          ...formData,
          starts_at: localInputToIso(formData.starts_at),
          ends_at: localInputToIso(formData.ends_at),
        },
        { publish: isPublish }
      )
      if (!res.success) {
        if (res.errors) setErrors(res.errors)
        alert(res.message || 'Failed to save slide.')
      } else {
        unsavedUploads.current.clear()
        router.push('/admin/hero')
        router.refresh()
      }
    } catch (err) {
      alert(err.message || 'An unexpected error occurred.')
    } finally {
      setSubmitting(false)
    }
  }

  const isLive = initialSlide.status === 'published'

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-stone-200 pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/hero"
            onClick={handleCancel}
            aria-label="Back to slides"
            className="p-2 rounded-lg border border-stone-200 hover:bg-stone-100 text-stone-600 transition"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-stone-900">
              {formData.id ? 'Edit Hero Slide' : 'Create New Hero Slide'}
            </h1>
            <p className="text-xs text-stone-500">
              Configure copy, imagery, and call-to-actions for the storefront banner.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={submitting}
            onClick={(e) => handleSubmit(e, false)}
            className="inline-flex items-center gap-1.5 px-4 py-2 border border-stone-300 rounded-lg text-sm font-medium text-stone-700 bg-white hover:bg-stone-50 transition disabled:opacity-50"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {isLive ? 'Unpublish & Save as Draft' : 'Save Draft'}
          </button>
          <button
            type="button"
            disabled={submitting}
            onClick={(e) => handleSubmit(e, true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-white bg-stone-900 hover:bg-stone-800 transition disabled:opacity-50 shadow-sm"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            {isLive ? 'Save & Keep Published' : 'Publish to Store'}
          </button>
        </div>
      </div>

      {/* Main Grid: Form Left, Preview Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Form Column */}
        <div className="lg:col-span-7 space-y-6 bg-white p-6 rounded-xl border border-stone-200 shadow-sm">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
              Slide Title *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g. Wear Your Heritage. Express Your Soul."
              maxLength={120}
              className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-1 ${
                errors.title ? 'border-red-500 focus:ring-red-500' : 'border-stone-300 focus:ring-stone-900'
              }`}
            />
            {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}
          </div>

          {/* Subtitle */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
              Subtitle or Description
            </label>
            <textarea
              name="subtitle"
              value={formData.subtitle}
              onChange={handleChange}
              rows={3}
              placeholder="e.g. Discover premium apparel, meticulously crafted to honor cultural traditions."
              maxLength={300}
              className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-stone-900"
            />
            {errors.subtitle && <p className="text-xs text-red-500 mt-1">{errors.subtitle}</p>}
          </div>

          {/* Images Section */}
          <div className="space-y-4 pt-2 border-t border-stone-100">
            <HeroImageUploader
              label="Desktop Banner Image *"
              variant="desktop"
              imageUrl={formData.image_url}
              imagePath={formData.image_path}
              onChange={(next) => setImage('image_url', 'image_path', next)}
              onClear={() => setImage('image_url', 'image_path', null)}
            />
            {errors.image && <p className="text-xs text-red-500">{errors.image}</p>}

            <HeroImageUploader
              label="Mobile Banner Image (Optional)"
              variant="mobile"
              imageUrl={formData.mobile_image_url}
              imagePath={formData.mobile_image_path}
              onChange={(next) => setImage('mobile_image_url', 'mobile_image_path', next)}
              onClear={() => setImage('mobile_image_url', 'mobile_image_path', null)}
            />
            {errors.mobile_image && <p className="text-xs text-red-500">{errors.mobile_image}</p>}

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
                Image Alt Text (Accessibility) *
              </label>
              <input
                type="text"
                name="image_alt"
                value={formData.image_alt}
                onChange={handleChange}
                placeholder="e.g. Models posing in traditional hand-woven festival clothing"
                className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-1 ${
                  errors.image_alt ? 'border-red-500 focus:ring-red-500' : 'border-stone-300 focus:ring-stone-900'
                }`}
              />
              {errors.image_alt && <p className="text-xs text-red-500 mt-1">{errors.image_alt}</p>}
            </div>
          </div>

          {/* Badges & Call-To-Action */}
          <div className="pt-2 border-t border-stone-100 space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
                Offer / Highlight Badge (Optional)
              </label>
              <input
                type="text"
                name="offer_badge"
                value={formData.offer_badge}
                onChange={handleChange}
                placeholder="e.g. FESTIVAL SPECIAL or NEW ARRIVAL"
                maxLength={30}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-stone-900"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
                  Button Text
                </label>
                <input
                  type="text"
                  name="button_text"
                  value={formData.button_text}
                  onChange={handleChange}
                  placeholder="e.g. Explore Collection"
                  maxLength={40}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-stone-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
                  Button Destination URL
                </label>
                <input
                  type="text"
                  name="button_url"
                  value={formData.button_url}
                  onChange={handleChange}
                  placeholder="e.g. /#products or https://..."
                  className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-1 ${
                    errors.button_url || errors.button
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-stone-300 focus:ring-stone-900'
                  }`}
                />
              </div>
            </div>
            {(errors.button || errors.button_url) && (
              <p className="text-xs text-red-500">{errors.button || errors.button_url}</p>
            )}
          </div>

          {/* Visual Presentation Config */}
          <div className="pt-2 border-t border-stone-100 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
                  Text Alignment
                </label>
                <select
                  name="text_alignment"
                  value={formData.text_alignment}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-stone-900 bg-white"
                >
                  <option value="left">Left</option>
                  <option value="center">Center</option>
                  <option value="right">Right</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
                  Vertical Position
                </label>
                <select
                  name="text_position"
                  value={formData.text_position}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-stone-900 bg-white"
                >
                  <option value="top">Top</option>
                  <option value="middle">Middle</option>
                  <option value="bottom">Bottom</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
                  Dim Overlay ({formData.overlay_opacity}%)
                </label>
                <input
                  type="range"
                  name="overlay_opacity"
                  min="0"
                  max="90"
                  step="5"
                  value={formData.overlay_opacity}
                  onChange={handleChange}
                  className="w-full mt-2 accent-stone-900"
                />
              </div>
            </div>
          </div>

          {/* Schedule Settings */}
          <div className="pt-2 border-t border-stone-100 space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-700">
              Publication Schedule (Optional)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] text-stone-600 mb-1">Starts At</label>
                <input
                  type="datetime-local"
                  name="starts_at"
                  value={formData.starts_at}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-stone-900"
                />
              </div>

              <div>
                <label className="block text-[11px] text-stone-600 mb-1">Ends At</label>
                <input
                  type="datetime-local"
                  name="ends_at"
                  value={formData.ends_at}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-stone-900"
                />
              </div>
            </div>
            {errors.schedule && <p className="text-xs text-red-500">{errors.schedule}</p>}
          </div>
        </div>

        {/* Live Preview Column */}
        <div className="lg:col-span-5 sticky top-20 space-y-4">
          <div className="flex items-center justify-between bg-white px-4 py-2.5 rounded-lg border border-stone-200">
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-700">
              Live Preview
            </span>
            <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-md">
              <button
                type="button"
                onClick={() => setPreviewDevice('desktop')}
                className={`p-1.5 rounded transition ${
                  previewDevice === 'desktop' ? 'bg-white shadow-sm text-stone-900' : 'text-stone-500'
                }`}
                title="Desktop Preview"
              >
                <Monitor className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setPreviewDevice('mobile')}
                className={`p-1.5 rounded transition ${
                  previewDevice === 'mobile' ? 'bg-white shadow-sm text-stone-900' : 'text-stone-500'
                }`}
                title="Mobile Preview"
              >
                <Smartphone className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div
            className={`border border-stone-300 rounded-xl overflow-hidden shadow-lg bg-stone-900 transition-all mx-auto ${
              previewDevice === 'mobile' ? 'max-w-[340px] aspect-[9/16]' : 'w-full'
            }`}
          >
            {formData.image_url ? (
              <div className="transform origin-top scale-[0.8] sm:scale-100">
                <HeroSlide
                  slide={{
                    ...formData,
                    image_url:
                      previewDevice === 'mobile' && formData.mobile_image_url
                        ? formData.mobile_image_url
                        : formData.image_url,
                  }}
                  priority
                />
              </div>
            ) : (
              <div className="h-64 flex flex-col items-center justify-center p-6 text-center text-stone-400">
                <Monitor className="h-10 w-10 mb-2 opacity-40" />
                <p className="text-xs font-medium">Upload a desktop image to see preview</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
