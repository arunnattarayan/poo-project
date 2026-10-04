'use client'
import { useState } from 'react'
import { ImageOff } from 'lucide-react'

/** <img> with a graceful fallback. Plain <img> so any admin-supplied URL works without next.config domains. */
export default function ProductImage({ src, alt, className = '' }) {
  const [failed, setFailed] = useState(false)
  if (!src || failed) {
    return (
      <div className={`flex items-center justify-center bg-stone-100 text-stone-400 ${className}`}>
        <ImageOff className="h-8 w-8" />
      </div>
    )
  }
  return <img src={src} alt={alt} loading="lazy" className={className} onError={() => setFailed(true)} />
}
