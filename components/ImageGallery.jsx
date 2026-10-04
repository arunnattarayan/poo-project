'use client'

import { useState, useCallback, useEffect } from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import ProductImage from './ProductImage'

export default function ImageGallery({ images, title }) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true })
  const [selectedIndex, setSelectedIndex] = useState(0)

  const scrollPrev = useCallback(() => emblaApi && emblaApi.scrollPrev(), [emblaApi])
  const scrollNext = useCallback(() => emblaApi && emblaApi.scrollNext(), [emblaApi])
  const scrollTo = useCallback((index) => emblaApi && emblaApi.scrollTo(index), [emblaApi])

  const onSelect = useCallback(() => {
    if (!emblaApi) return
    setSelectedIndex(emblaApi.selectedScrollSnap())
  }, [emblaApi, setSelectedIndex])

  useEffect(() => {
    if (!emblaApi) return
    onSelect()
    emblaApi.on('select', onSelect)
    emblaApi.on('reInit', onSelect)
    return () => {
      emblaApi.off('select', onSelect)
      emblaApi.off('reInit', onSelect)
    }
  }, [emblaApi, onSelect])

  if (!images || images.length === 0) {
    return (
      <div className="aspect-square overflow-hidden rounded-2xl bg-stone-100 ring-1 ring-stone-200">
        <ProductImage src={null} alt={title} className="h-full w-full object-cover" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="group relative aspect-square overflow-hidden rounded-2xl bg-stone-100 ring-1 ring-stone-200">
        <div className="overflow-hidden h-full" ref={emblaRef}>
          <div className="flex h-full touch-pan-y touch-pinch-zoom">
            {images.map((img, i) => (
              <div className="relative min-w-0 flex-[0_0_100%] h-full" key={i}>
                <ProductImage src={img} alt={`${title} - Image ${i + 1}`} className="h-full w-full object-cover" />
              </div>
            ))}
          </div>
        </div>

        {images.length > 1 && (
          <>
            <button
              onClick={scrollPrev}
              className="absolute left-3 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-stone-700 shadow-md backdrop-blur-md transition-transform hover:scale-110 opacity-0 group-hover:opacity-100"
              aria-label="Previous image"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button
              onClick={scrollNext}
              className="absolute right-3 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-stone-700 shadow-md backdrop-blur-md transition-transform hover:scale-110 opacity-0 group-hover:opacity-100"
              aria-label="Next image"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </>
        )}
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="grid grid-cols-5 gap-3">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => scrollTo(i)}
              className={`relative aspect-square overflow-hidden rounded-xl bg-stone-100 ring-1 transition-all ${
                i === selectedIndex
                  ? 'ring-2 ring-stone-900 ring-offset-2 opacity-100'
                  : 'ring-stone-200 opacity-60 hover:opacity-100 hover:ring-stone-400'
              }`}
              aria-label={`Go to slide ${i + 1}`}
            >
              <ProductImage src={img} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
