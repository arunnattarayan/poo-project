'use client'
import { useState, useEffect } from 'react'
import Image from 'next/image'

export default function ProductImage({ src, alt, className = '', ...props }) {
  const [imgSrc, setImgSrc] = useState(src)

  useEffect(() => {
    setImgSrc(src)
  }, [src])

  return (
    <Image
      src={imgSrc || '/placeholder-tee.svg'}
      onError={() => setImgSrc('/placeholder-tee.svg')}
      alt={alt}
      className={className}
      width={400}
      height={500}
      unoptimized
      {...props}
    />
  )
}
