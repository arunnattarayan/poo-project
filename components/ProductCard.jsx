'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ShoppingBag, Check } from 'lucide-react'
import { useCart } from '@/lib/cart-store'
import ProductImage from './ProductImage'

export default function ProductCard({ product, currency }) {
  const add = useCart((s) => s.add)
  const open = useCart((s) => s.open)

  function handleAddToCart(e) {
    e.preventDefault()
    e.stopPropagation()
    add(product, 1)
    open('cart')
  }

  return (
    <article className="group relative flex flex-col justify-between rounded-md bg-[#fdfbf6] p-4 border border-black/10 shadow-sm transition-transform duration-300 hover:-translate-y-1">
      <div>
        {/* Clickable Image */}
        <Link
          href={`/product/${product.id}`}
          className="relative block aspect-[4/5] w-full overflow-hidden focus:outline-none"
          aria-label={`View details for ${product.title}`}
        >
          <ProductImage
            src={product.image_url}
            alt={product.title}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105 rounded-sm"
          />
        </Link>

        {/* Product Info */}
        <div className="mt-4 text-left">
          <Link
            href={`/product/${product.id}`}
            className="block focus:outline-none"
          >
            <h3 className="line-clamp-2 text-sm font-medium text-stone-900">
              {product.title}
            </h3>
          </Link>
          <div className="mt-1 flex items-center justify-between">
            <span className="text-sm font-semibold text-stone-700">{currency}{product.price}</span>
            <div className="flex text-[#d4af37] gap-0.5">
              {[...Array(5)].map((_, i) => <svg key={i} className="w-3 h-3 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>)}
            </div>
          </div>
        </div>
      </div>

      {/* Action Button */}
      <div className="mt-4">
        {!product.in_stock ? (
          <button
            disabled
            className="w-full cursor-not-allowed rounded-md bg-stone-200 py-2.5 text-xs font-medium text-stone-500 uppercase tracking-widest"
          >
            Out of Stock
          </button>
        ) : (
          <button
            type="button"
            onClick={handleAddToCart}
            className="opacity-100 lg:opacity-0 group-hover:opacity-100 absolute bottom-4 left-4 right-4 rounded bg-white/90 backdrop-blur-sm py-2.5 text-xs font-medium uppercase tracking-wider text-stone-900 shadow-sm transition-opacity hover:bg-white focus:outline-none focus:ring-2 focus:ring-stone-500 focus:ring-offset-2"
          >
            Add to Bag
          </button>
        )}
      </div>
    </article>
  )
}

