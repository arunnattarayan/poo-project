'use client'

import { useState, useRef } from 'react'
import { Upload, X, Loader2, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { HERO_ASPECT_CONFIG } from '@/lib/hero-validation'

export default function HeroImageUploader({
  label,
  variant = 'desktop', // 'desktop' | 'mobile'
  imageUrl,
  imagePath,
  onChange,
  onClear,
}) {
  const [supabase] = useState(() => createClient())
  const [uploading, setUploading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [aspectWarning, setAspectWarning] = useState('')
  const fileInputRef = useRef(null)

  const config = HERO_ASPECT_CONFIG[variant]

  async function handleFileSelected(e) {
    const file = e.target.files?.[0]
    if (!file) return

    setErrorMsg('')
    setAspectWarning('')

    // 1. MIME Validation
    if (!HERO_ASPECT_CONFIG.allowedMimeTypes.includes(file.type)) {
      setErrorMsg(`Invalid file type (${file.type}). Supported formats: JPEG, PNG, WebP.`)
      return
    }

    // 2. Size Validation
    if (file.size > HERO_ASPECT_CONFIG.maxSizeBytes) {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(1)
      setErrorMsg(`File size (${sizeMb} MB) exceeds maximum allowed size of 5 MB.`)
      return
    }

    // 3. Image Dimension & Aspect Ratio Check
    try {
      const objectUrl = URL.createObjectURL(file)
      const img = new Image()
      await new Promise((resolve, reject) => {
        img.onload = resolve
        img.onerror = () => reject(new Error('Failed to decode image.'))
        img.src = objectUrl
      })

      const { naturalWidth: width, naturalHeight: height } = img
      URL.revokeObjectURL(objectUrl)

      if (width < config.minWidth) {
        setErrorMsg(
          `Image width (${width}px) is too small. Minimum required width for ${variant} is ${config.minWidth}px.`
        )
        return
      }

      const ratio = width / height
      if (ratio < config.minRatio || ratio > config.maxRatio) {
        setAspectWarning(
          `Image aspect ratio (${ratio.toFixed(2)}:1) differs from recommended ${config.targetRatioLabel}. It will be fitted automatically with cover cropping.`
        )
      }
    } catch (err) {
      setErrorMsg('Could not read image dimensions. Please try another image file.')
      return
    }

    // 4. Upload to Supabase Storage
    setUploading(true)
    try {
      const ext = file.name.split('.').pop()?.toLowerCase() || 'webp'
      const uniqueName = `slides/${variant}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('hero-images')
        .upload(uniqueName, file, { cacheControl: '3600', upsert: false })

      if (uploadError) {
        throw new Error(uploadError.message)
      }

      const { data: { publicUrl } } = supabase.storage
        .from('hero-images')
        .getPublicUrl(uniqueName)

      onChange({
        url: publicUrl,
        path: uniqueName,
      })
    } catch (err) {
      setErrorMsg(`Upload failed: ${err.message}`)
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold uppercase tracking-wider text-stone-700">
          {label}
        </label>
        <span className="text-[11px] text-stone-500">
          Recommended: {config.recommendedWidth}×{config.recommendedHeight}px ({config.targetRatioLabel})
        </span>
      </div>

      {imageUrl ? (
        <div className="relative group rounded-lg border border-stone-200 overflow-hidden bg-stone-100">
          <div
            className={`w-full ${
              variant === 'mobile' ? 'h-56 max-w-xs mx-auto' : 'h-44'
            } relative overflow-hidden`}
          >
            <img
              src={imageUrl}
              alt="Uploaded preview"
              className="w-full h-full object-cover object-center"
            />
          </div>

          <div className="p-2.5 flex items-center justify-between bg-white border-t border-stone-200">
            <span className="text-xs text-stone-500 truncate max-w-[280px]">
              {imagePath || imageUrl}
            </span>
            <button
              type="button"
              onClick={onClear}
              className="inline-flex items-center gap-1 text-xs text-red-600 hover:text-red-700 font-medium px-2 py-1 rounded hover:bg-red-50 transition"
            >
              <X className="h-3.5 w-3.5" /> Remove
            </button>
          </div>
        </div>
      ) : (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-stone-300 hover:border-stone-900 rounded-lg p-6 text-center cursor-pointer transition bg-stone-50/50 hover:bg-stone-50 group"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileSelected}
            className="hidden"
          />

          <div className="flex flex-col items-center justify-center gap-2">
            {uploading ? (
              <Loader2 className="h-8 w-8 text-stone-600 animate-spin" />
            ) : (
              <div className="h-10 w-10 rounded-full bg-white shadow-sm border border-stone-200 flex items-center justify-center text-stone-700 group-hover:scale-105 transition-transform">
                <Upload className="h-5 w-5" />
              </div>
            )}
            <p className="text-sm font-medium text-stone-800">
              {uploading ? 'Uploading image...' : 'Click to select or upload image'}
            </p>
            <p className="text-xs text-stone-500">
              JPEG, PNG or WebP up to 5 MB
            </p>
          </div>
        </div>
      )}

      {/* Warnings & Errors */}
      {aspectWarning && (
        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded p-2 flex items-start gap-1.5">
          <AlertCircle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
          <span>{aspectWarning}</span>
        </p>
      )}
      {errorMsg && (
        <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded p-2 flex items-start gap-1.5">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
          <span>{errorMsg}</span>
        </p>
      )}
    </div>
  )
}
