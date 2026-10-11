'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react'
import HeroSlide from './HeroSlide'

export default function HeroSlideshow({ slides = [], autoplayInterval = 5000, fallback = null }) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(true)
  const [isHovered, setIsHovered] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const [userInteracted, setUserInteracted] = useState(false)
  const [failedImageIds, setFailedImageIds] = useState(new Set())
  const touchStartX = useRef(0)
  const touchEndX = useRef(0)

  // Filter out any slides whose images failed to load on client
  const activeSlides = slides.filter((s) => !failedImageIds.has(s.id))
  const count = activeSlides.length

  const goToNext = useCallback(() => {
    if (count <= 1) return
    setCurrentIndex((prev) => (prev + 1) % count)
  }, [count])

  const goToPrev = useCallback(() => {
    if (count <= 1) return
    setCurrentIndex((prev) => (prev - 1 + count) % count)
  }, [count])

  // Respect user's reduced-motion preference
  useEffect(() => {
    if (typeof window === 'undefined') return
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (mq.matches) {
      setIsPlaying(false)
    }
  }, [])

  // Autoplay timer: advances slide when playing, tab is active, not hovered
  useEffect(() => {
    if (!isPlaying || isHovered || isFocused || count <= 1) return

    const interval = setInterval(() => {
      // Pause if document tab is hidden
      if (document.hidden) return
      goToNext()
    }, autoplayInterval)

    return () => clearInterval(interval)
  }, [isPlaying, isHovered, isFocused, count, autoplayInterval, goToNext])

  // Reset index if active count shrank
  useEffect(() => {
    if (currentIndex >= count && count > 0) {
      setCurrentIndex(0)
    }
  }, [currentIndex, count])

  // Touch Swipe handlers
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX
    touchEndX.current = e.touches[0].clientX // reset, so a plain tap is never read as a swipe
  }

  const handleTouchMove = (e) => {
    touchEndX.current = e.touches[0].clientX
  }

  const handleTouchEnd = () => {
    const diff = touchStartX.current - touchEndX.current
    const threshold = 50
    if (diff > threshold) {
      setUserInteracted(true)
      goToNext()
    } else if (diff < -threshold) {
      setUserInteracted(true)
      goToPrev()
    }
  }

  // Keyboard navigation
  const handleKeyDown = (e) => {
    if (e.key === 'ArrowLeft') {
      setUserInteracted(true)
      goToPrev()
    } else if (e.key === 'ArrowRight') {
      setUserInteracted(true)
      goToNext()
    }
  }

  if (count === 0) {
    return fallback
  }

  return (
    <section
      role="region"
      aria-roledescription="carousel"
      aria-label="Promotional Banners"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => setIsFocused(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setIsFocused(false)
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="relative w-full overflow-hidden bg-stone-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
    >
      {/* Screen Reader live announcement when user navigates */}
      <div
        className="sr-only"
        aria-live={userInteracted ? 'polite' : 'off'}
        aria-atomic="true"
      >
        {activeSlides[currentIndex]?.title
          ? `Slide ${currentIndex + 1} of ${count}: ${activeSlides[currentIndex].title}`
          : `Slide ${currentIndex + 1} of ${count}`}
      </div>

      {/* Slide Stack Container */}
      <div className="relative w-full h-[520px] sm:h-[600px] md:h-[700px]">
        {activeSlides.map((slide, index) => {
          const isActive = index === currentIndex
          return (
            <div
              key={slide.id}
              role="group"
              aria-roledescription="slide"
              aria-label={`${index + 1} of ${count}`}
              aria-hidden={!isActive}
              inert={!isActive}
              className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                isActive ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
              }`}
            >
              <HeroSlide
                slide={slide}
                priority={index === 0}
                headingLevel={index === 0 ? 'h1' : 'h2'}
                onImageError={() =>
                  setFailedImageIds((prev) => new Set(prev).add(slide.id))
                }
              />
            </div>
          )
        })}
      </div>

      {/* Controls Overlay: Only if more than 1 slide */}
      {count > 1 && (
        <>
          {/* Previous Arrow */}
          <button
            type="button"
            onClick={() => {
              setUserInteracted(true)
              goToPrev()
            }}
            aria-label="Previous slide"
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 flex h-11 w-11 items-center justify-center rounded-full bg-black/30 hover:bg-black/60 text-white backdrop-blur-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>

          {/* Next Arrow */}
          <button
            type="button"
            onClick={() => {
              setUserInteracted(true)
              goToNext()
            }}
            aria-label="Next slide"
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 flex h-11 w-11 items-center justify-center rounded-full bg-black/30 hover:bg-black/60 text-white backdrop-blur-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
          >
            <ChevronRight className="h-6 w-6" />
          </button>

          {/* Bottom Bar: Dots + Pause/Play */}
          <div className="absolute bottom-6 inset-x-0 z-20 flex items-center justify-center gap-3">
            {/* Dots */}
            <div className="flex items-center gap-2 bg-black/30 backdrop-blur-sm px-3 py-1.5 rounded-full">
              {activeSlides.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setUserInteracted(true)
                    setCurrentIndex(idx)
                  }}
                  aria-label={`Go to slide ${idx + 1}`}
                  aria-current={idx === currentIndex ? 'true' : undefined}
                  className={`transition-all rounded-full h-2.5 ${
                    idx === currentIndex
                      ? 'w-7 bg-white'
                      : 'w-2.5 bg-white/50 hover:bg-white/80'
                  }`}
                />
              ))}

              {/* Autoplay Pause / Play Toggle Button */}
              <button
                type="button"
                onClick={() => setIsPlaying((p) => !p)}
                aria-label={isPlaying ? 'Pause slideshow' : 'Play slideshow'}
                aria-pressed={!isPlaying}
                className="ml-2 text-white/80 hover:text-white transition p-0.5 rounded focus-visible:outline focus-visible:outline-1 focus-visible:outline-white"
              >
                {isPlaying ? (
                  <Pause className="h-3.5 w-3.5" />
                ) : (
                  <Play className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
          </div>
        </>
      )}
    </section>
  )
}
