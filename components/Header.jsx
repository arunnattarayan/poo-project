'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { ShoppingBag } from 'lucide-react'
import { useCart } from '@/lib/cart-store'
import { useStoreConfig } from './ConfigProvider'

export default function Header() {
  const { store_name, store_logo } = useStoreConfig()
  const open = useCart((s) => s.open)
  const count = useCart((s) => s.items.reduce((n, i) => n + i.quantity, 0))
  const [hydrated, setHydrated] = useState(false)

  // Load the persisted cart from localStorage once on the client.
  useEffect(() => {
    useCart.persist.rehydrate()
    setHydrated(true)
  }, [])

  const rawName = (store_name || 'Nanjai Clothing').trim()
  const isClothingEnding = / clothing$/i.test(rawName)
  const brandTitle = isClothingEnding ? rawName.replace(/ clothing$/i, '').trim() : rawName
  const brandSubtitle = 'CLOTHING'
  const logoUrl = store_logo || '/logo.png'

  return (
    <header className="sticky top-0 z-30 bg-[#f9f8f4] text-black border-b border-black/10">
      <div className="mx-auto flex h-16 md:h-20 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand identity: Logo on left + Store name beside it */}
        <div className="flex items-center justify-start">
          <Link
            href="/"
            className="group flex items-center gap-2.5 sm:gap-3.5 focus:outline-none"
            aria-label={`${brandTitle} ${brandSubtitle}`}
          >
            {logoUrl && (
              <img
                src={logoUrl}
                alt={brandTitle}
                className="h-12 sm:h-14 md:h-[56px] w-auto object-contain shrink-0 transition-transform group-hover:scale-[1.02]"
              />
            )}
            <div className="flex flex-col justify-center leading-none">
              <span className="font-serif font-bold text-lg sm:text-2xl md:text-[1.65rem] tracking-wider text-stone-900 uppercase group-hover:text-black transition-colors">
                {brandTitle}
              </span>
              <span className="font-sans text-[8px] sm:text-[10px] md:text-[11px] font-semibold tracking-[0.25em] sm:tracking-[0.3em] text-stone-500 uppercase mt-0.5 sm:mt-1">
                {brandSubtitle}
              </span>
            </div>
          </Link>
        </div>

        {/* Minimal shopping bag on right */}
        <div className="flex items-center justify-end">
          <button
            onClick={open}
            className="relative rounded-full p-2 text-stone-900 hover:text-[#d4af37] transition-colors focus:outline-none"
            aria-label={`Open cart (${count} items)`}
          >
            <ShoppingBag className="h-5 w-5 sm:h-6 sm:w-6" />
            {hydrated && count > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#d4af37] px-1 text-xs font-bold text-black shadow-sm">
                {count}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  )
}
