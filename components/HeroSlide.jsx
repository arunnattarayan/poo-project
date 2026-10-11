import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export default function HeroSlide({ slide, priority = false, headingLevel = 'h2', onImageError }) {
  const Heading = headingLevel === 'h1' ? 'h1' : 'h2'
  const {
    title,
    subtitle,
    image_url,
    mobile_image_url,
    image_alt = '',
    offer_badge,
    button_text,
    button_url,
    text_alignment = 'center',
    text_position = 'middle',
    overlay_opacity = 40,
  } = slide

  const alignClass =
    text_alignment === 'left'
      ? 'text-left items-start'
      : text_alignment === 'right'
      ? 'text-right items-end'
      : 'text-center items-center'

  const positionClass =
    text_position === 'top'
      ? 'justify-start pt-16 md:pt-20'
      : text_position === 'bottom'
      ? 'justify-end pb-16 md:pb-20'
      : 'justify-center'

  return (
    <div className="relative w-full h-[520px] sm:h-[600px] md:h-[700px] overflow-hidden select-none">
      {/* Background Picture with Responsive Art Direction */}
      <picture>
        {mobile_image_url && (
          <source media="(max-width: 767px)" srcSet={mobile_image_url} />
        )}
        <img
          src={image_url}
          alt={image_alt || title || 'Hero slide'}
          fetchPriority={priority ? 'high' : 'auto'}
          loading={priority ? 'eager' : 'lazy'}
          onError={onImageError}
          className="absolute inset-0 w-full h-full object-cover object-center"
        />
      </picture>

      {/* Dim / Readability Overlay */}
      <div
        className="absolute inset-0 bg-stone-900 transition-opacity pointer-events-none"
        style={{ opacity: (overlay_opacity ?? 40) / 100 }}
      />

      {/* Slide Content */}
      <div
        className={`relative z-10 flex flex-col h-full max-w-5xl mx-auto px-6 sm:px-12 ${positionClass} ${alignClass}`}
      >
        {offer_badge && (
          <span className="inline-block uppercase tracking-widest text-[11px] sm:text-xs font-bold text-amber-300 bg-amber-950/60 border border-amber-400/40 px-3 py-1 rounded-full mb-4 shadow-sm backdrop-blur-sm">
            {offer_badge}
          </span>
        )}

        <Heading className="text-3xl sm:text-5xl md:text-6xl font-serif font-bold tracking-tight leading-[1.2] text-white drop-shadow-md max-w-3xl whitespace-pre-line">
          {title}
        </Heading>

        {subtitle && (
          <p className="mt-4 text-sm sm:text-base md:text-lg leading-relaxed text-stone-100 font-light max-w-xl drop-shadow whitespace-pre-line">
            {subtitle}
          </p>
        )}

        {button_text && button_url && (
          <div className="mt-8">
            <Link
              href={button_url}
              className="group inline-flex items-center justify-center gap-2 rounded bg-white px-8 py-3.5 text-xs font-bold uppercase tracking-widest text-stone-900 transition hover:bg-stone-100 shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              {button_text}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
