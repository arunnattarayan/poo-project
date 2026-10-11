'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  AlertCircle,
  GripVertical,
  Eye,
  EyeOff,
  Calendar,
  RotateCw,
} from 'lucide-react'
import { createClient } from '@/lib/supabase'
import {
  setHeroSlideStatus,
  reorderHeroSlides,
  deleteHeroSlide,
  retryHeroImageCleanup,
  getPendingCleanupCount,
} from './actions'

export default function AdminHeroPage() {
  const [supabase] = useState(() => createClient())
  const [slides, setSlides] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [cleanupCount, setCleanupCount] = useState(0)
  const [cleaning, setCleaning] = useState(false)
  const [draggedIdx, setDraggedIdx] = useState(null)
  const [reordering, setReordering] = useState(false)
  const orderAtDragStart = useRef('')

  const loadSlides = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const { data, error: err } = await supabase
        .from('homepage_hero_slides')
        .select('*')
        .order('display_order', { ascending: true })

      if (err) throw err
      setSlides(data || [])

      const res = await getPendingCleanupCount()
      setCleanupCount(res.success ? res.count : 0)
    } catch (err) {
      setError(err.message || 'Failed to load slides')
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    loadSlides()
  }, [loadSlides])

  // Status toggle handler
  async function handleToggleStatus(slide) {
    const nextStatus = slide.status === 'published' ? 'inactive' : 'published'
    const res = await setHeroSlideStatus(slide.id, nextStatus)
    if (!res.success) {
      alert(res.message || 'Failed to update status')
      return
    }
    loadSlides()
  }

  // Delete slide handler
  async function handleDelete(id, title) {
    if (!confirm(`Are you sure you want to delete the slide "${title}"?`)) return
    const res = await deleteHeroSlide(id)
    if (!res.success) {
      alert(res.message || 'Failed to delete slide')
      return
    }
    if (res.warning) alert(res.warning)
    loadSlides()
  }

  // Storage cleanup retry
  async function handleRetryCleanup() {
    setCleaning(true)
    try {
      await retryHeroImageCleanup()
      const res = await getPendingCleanupCount()
      setCleanupCount(res.success ? res.count : 0)
    } finally {
      setCleaning(false)
    }
  }

  // Drag and drop reordering
  const handleDragStart = (e, index) => {
    setDraggedIdx(index)
    orderAtDragStart.current = slides.map((s) => s.id).join(',')
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e, index) => {
    e.preventDefault()
    if (draggedIdx === null || draggedIdx === index) return

    const newSlides = [...slides]
    const draggedItem = newSlides[draggedIdx]
    newSlides.splice(draggedIdx, 1)
    newSlides.splice(index, 0, draggedItem)

    setSlides(newSlides)
    setDraggedIdx(index)
  }

  const handleDragEnd = async () => {
    setDraggedIdx(null)
    const ids = slides.map((s) => s.id)
    if (ids.join(',') === orderAtDragStart.current) return
    setReordering(true)
    try {
      const res = await reorderHeroSlides(ids)
      if (!res.success) {
        alert(res.message || 'Failed to reorder slides')
        loadSlides()
      }
    } finally {
      setReordering(false)
    }
  }

  const getStatusBadge = (slide) => {
    const now = new Date()
    const startsAt = slide.starts_at ? new Date(slide.starts_at) : null
    const endsAt = slide.ends_at ? new Date(slide.ends_at) : null

    if (slide.status === 'draft') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-stone-100 text-stone-800 border border-stone-200">
          Draft
        </span>
      )
    }
    if (slide.status === 'inactive') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200">
          Inactive
        </span>
      )
    }
    if (slide.status === 'published') {
      if (startsAt && startsAt > now) {
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
            Scheduled
          </span>
        )
      }
      if (endsAt && endsAt <= now) {
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
            Expired
          </span>
        )
      }
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
          Published
        </span>
      )
    }
    return null
  }

  return (
    <div className="space-y-6">
      {/* Page Title & Action Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-stone-200 pb-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-stone-900">
            Homepage Hero Slides
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Manage promotional banners and announcements displayed on the storefront.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {cleanupCount > 0 && (
            <button
              onClick={handleRetryCleanup}
              disabled={cleaning}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 transition disabled:opacity-50"
            >
              <RotateCw className={`h-3.5 w-3.5 ${cleaning ? 'animate-spin' : ''}`} />
              {cleanupCount} image{cleanupCount > 1 ? 's' : ''} pending cleanup (Retry)
            </button>
          )}

          <Link
            href="/admin/hero/new"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-white bg-stone-900 hover:bg-stone-800 transition shadow-sm"
          >
            <Plus className="h-4 w-4" /> Add New Slide
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-red-50 border border-red-200 flex items-center gap-2 text-sm text-red-700">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20 text-stone-400">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : slides.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-stone-200 p-8">
          <h3 className="text-base font-semibold text-stone-800">No slides created yet</h3>
          <p className="text-sm text-stone-500 mt-1 max-w-sm mx-auto">
            Create your first hero banner slide to replace the hardcoded fallback banner on the homepage.
          </p>
          <Link
            href="/admin/hero/new"
            className="inline-flex items-center gap-1.5 mt-5 px-4 py-2 rounded-lg text-sm font-medium text-white bg-stone-900 hover:bg-stone-800 transition"
          >
            <Plus className="h-4 w-4" /> Create Slide
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-stone-500 flex items-center gap-1">
            <GripVertical className="h-3.5 w-3.5 text-stone-400" /> Drag items to reorder display sequence on the homepage.
            {reordering && <span className="ml-2 text-stone-600 animate-pulse font-medium">Saving order...</span>}
          </p>

          <div className="space-y-2">
            {slides.map((slide, index) => (
              <div
                key={slide.id}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                className="flex items-center gap-4 bg-white border border-stone-200 p-3 rounded-xl shadow-sm hover:border-stone-300 transition group"
              >
                {/* Drag Handle */}
                <div className="cursor-move p-1 text-stone-300 group-hover:text-stone-600 transition">
                  <GripVertical className="h-5 w-5" />
                </div>

                {/* Thumbnail */}
                <div className="h-16 w-28 shrink-0 bg-stone-100 rounded-lg overflow-hidden border border-stone-200 relative">
                  {slide.image_url ? (
                    <img
                      src={slide.image_url}
                      alt={slide.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[10px] text-stone-400">
                      No Image
                    </div>
                  )}
                  {slide.offer_badge && (
                    <span className="absolute bottom-1 left-1 text-[9px] bg-amber-900/80 text-amber-200 px-1 py-0.2 rounded font-semibold backdrop-blur-xs">
                      {slide.offer_badge}
                    </span>
                  )}
                </div>

                {/* Slide Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-semibold text-stone-900 truncate">
                      {slide.title}
                    </h4>
                    {getStatusBadge(slide)}
                  </div>

                  <p className="text-xs text-stone-500 truncate mt-0.5">
                    {slide.subtitle || '(No description)'}
                  </p>

                  <div className="flex items-center gap-4 text-[11px] text-stone-400 mt-1.5">
                    <span>Order: #{slide.display_order + 1}</span>
                    {slide.button_text && (
                      <span>CTA: {slide.button_text} &rarr; {slide.button_url}</span>
                    )}
                    {(slide.starts_at || slide.ends_at) && (
                      <span className="flex items-center gap-1 text-stone-500">
                        <Calendar className="h-3 w-3" />
                        {slide.starts_at ? new Date(slide.starts_at).toLocaleDateString() : 'Now'} -{' '}
                        {slide.ends_at ? new Date(slide.ends_at).toLocaleDateString() : 'Forever'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleToggleStatus(slide)}
                    title={slide.status === 'published' ? 'Deactivate' : 'Publish'}
                    className={`p-2 rounded-lg border transition ${
                      slide.status === 'published'
                        ? 'border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                        : 'border-stone-200 text-stone-600 bg-stone-50 hover:bg-stone-100'
                    }`}
                  >
                    {slide.status === 'published' ? (
                      <Eye className="h-4 w-4" />
                    ) : (
                      <EyeOff className="h-4 w-4" />
                    )}
                  </button>

                  <Link
                    href={`/admin/hero/${slide.id}`}
                    className="p-2 rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-100 hover:text-stone-900 transition"
                    title="Edit Slide"
                  >
                    <Pencil className="h-4 w-4" />
                  </Link>

                  <button
                    type="button"
                    onClick={() => handleDelete(slide.id, slide.title)}
                    className="p-2 rounded-lg border border-stone-200 text-red-600 hover:bg-red-50 hover:border-red-200 transition"
                    title="Delete Slide"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
