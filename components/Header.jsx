'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { ShoppingBag } from 'lucide-react'
import { useCart } from '@/lib/cart-store'
import { useStoreConfig } from './ConfigProvider'

export default function Header() {
  const { store_name } = useStoreConfig()
  const open = useCart((s) => s.open)
  const count = useCart((s) => s.items.reduce((n, i) => n + i.quantity, 0))
  const [hydrated, setHydrated] = useState(false)

  // Load the persisted cart from localStorage once on the client.
  useEffect(() => {
    useCart.persist.rehydrate()
    setHydrated(true)
  }, [])

  return (
    <header className="sticky top-0 z-30 border-b border-stone-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="text-lg font-bold tracking-tight">{store_name}</Link>
        <button onClick={open} className="relative rounded-full p-2 hover:bg-stone-100" aria-label={`Open cart (${count} items)`}>
          <ShoppingBag className="h-6 w-6" />
          {hydrated && count > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-stone-900 px-1 text-xs font-medium text-white">
              {count}
            </span>
          )}
        </button>
      </div>
    </header>
  )
}
