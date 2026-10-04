'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ShoppingBag, Zap, Check } from 'lucide-react'
import { useCart } from '@/lib/cart-store'
import { formatPrice } from '@/lib/utils'
import ProductImage from './ProductImage'

export default function ProductCard({ product, currency }) {
  const buyNow = useCart((s) => s.buyNow)
  const add = useCart((s) => s.add)
  const open = useCart((s) => s.open)
  const [added, setAdded] = useState(false)

  function handleAddToCart(e) {
    e.preventDefault()
    e.stopPropagation()
    add(product, 1)
    setAdded(true)
    setTimeout(() => setAdded(false), 1500)
    open('cart')
  }

  function handleCheckout(e) {
    e.preventDefault()
    e.stopPropagation()
    buyNow(product, 1)
  }

  return (
    <article className="group relative flex flex-col justify-between rounded-none border border-heritage-gold/20 bg-white p-3 sm:p-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-heritage-gold/50 hover:shadow-md">
      <div>
        {/* Clickable Image */}
        <Link
          href={`/product/${product.id}`}
          className="relative block aspect-square w-full overflow-hidden bg-heritage-light focus:outline-none focus:ring-2 focus:ring-heritage-gold"
          aria-label={`View details for ${product.title}`}
        >
          <ProductImage
            src={product.image_url}
            alt={product.title}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />

          {!product.in_stock ? (
            <span className="absolute left-2.5 top-2.5 rounded-none bg-heritage-dark/85 px-2.5 py-0.5 text-[11px] font-medium tracking-wide text-white backdrop-blur-xs uppercase">
              Sold out
            </span>
          ) : (
            <span className="absolute right-2.5 top-2.5 rounded-none bg-heritage-light/90 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-heritage-dark shadow-xs backdrop-blur-xs border border-heritage-gold/20">
              In Stock
            </span>
          )}
        </Link>

        {/* Product Info */}
        <div className="mt-4 text-center">
          <Link
            href={`/product/${product.id}`}
            className="block focus:outline-none"
          >
            <h3 className="line-clamp-2 text-sm font-serif font-semibold tracking-wide text-heritage-dark transition-colors group-hover:text-heritage-accent sm:text-base">
              {product.title}
            </h3>
          </Link>
          <p className="mt-1 text-sm font-bold text-heritage-dark/80 sm:text-base">
            {formatPrice(product.price, currency)}
          </p>
        </div>
      </div>

      {/* Direct Actions from List Page */}
      <div className="mt-5 pt-3 border-t border-heritage-gold/10">
        {!product.in_stock ? (
          <button
            disabled
            className="w-full cursor-not-allowed rounded-none bg-heritage-light py-2.5 text-xs font-medium text-heritage-dark/40 sm:text-sm uppercase tracking-wider border border-heritage-gold/10"
          >
            Out of Stock
          </button>
        ) : (
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={handleCheckout}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-none bg-heritage-dark py-2.5 px-2 text-xs font-semibold uppercase tracking-wider text-heritage-gold shadow-xs transition hover:bg-heritage-dark/90 active:scale-[0.98] sm:px-3 sm:text-sm border border-heritage-dark"
              title="Instant checkout for this item"
            >
              <Zap className="h-3.5 w-3.5 fill-heritage-gold text-heritage-gold" />
              <span>Buy Now</span>
            </button>

            <button
              type="button"
              onClick={handleAddToCart}
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-none border transition active:scale-[0.98] sm:h-10 sm:w-10 ${
                added
                  ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                  : 'border-heritage-gold/30 bg-heritage-light text-heritage-dark hover:border-heritage-gold hover:bg-heritage-gold/5'
              }`}
              title={added ? 'Added to Cart' : 'Add to Cart'}
              aria-label={`Add ${product.title} to cart`}
            >
              {added ? <Check className="h-4 w-4 text-emerald-600" /> : <ShoppingBag className="h-4 w-4" />}
            </button>
          </div>
        )}
      </div>
    </article>
  )
}
