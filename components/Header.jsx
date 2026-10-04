'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { ShoppingCart } from 'lucide-react'
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

  return (
    <header className="sticky top-0 z-30 bg-[#f9f8f4] text-black border-b border-black/10">
      <div className="mx-auto flex h-20 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2 text-xl font-serif font-bold tracking-widest text-[#d4af37]">
          {store_logo ? (
            <img src={store_logo} alt={store_name} className="h-10 w-auto object-contain" />
          ) : (
            <div className="flex flex-col">
              <span className="text-2xl font-serif text-[#d4af37]">{store_name || 'NORRAI'}</span>
              <span className="text-[10px] tracking-[0.2em] uppercase font-sans text-black/70">Clothing</span>
            </div>
          )}
        </Link>
        


        <button onClick={open} className="relative rounded-full p-2 text-black hover:text-[#d4af37] transition-colors" aria-label={`Open cart (${count} items)`}>
          <ShoppingCart className="h-5 w-5" />
          {hydrated && count > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#d4af37] px-1 text-xs font-bold text-black">
              {count}
            </span>
          )}
        </button>
      </div>
    </header>
  )
}
