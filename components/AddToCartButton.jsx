'use client'
import { useState } from 'react'
import { Minus, Plus, ShoppingBag, Check } from 'lucide-react'
import { useCart } from '@/lib/cart-store'

export default function AddToCartButton({ product }) {
  const add = useCart((s) => s.add)
  const open = useCart((s) => s.open)
  const [qty, setQty] = useState(1)
  const [added, setAdded] = useState(false)

  if (!product.in_stock) {
    return (
      <button disabled className="w-full cursor-not-allowed rounded-lg bg-stone-200 px-6 py-3 font-medium text-stone-500">
        Out of stock
      </button>
    )
  }

  function handleAdd() {
    add(product, qty)
    setAdded(true)
    setTimeout(() => setAdded(false), 1500)
    open()
  }

  return (
    <div className="flex gap-3">
      <div className="flex items-center rounded-lg border border-stone-300">
        <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="p-3 hover:bg-stone-100" aria-label="Decrease quantity">
          <Minus className="h-4 w-4" />
        </button>
        <span className="w-8 text-center font-medium" aria-live="polite">{qty}</span>
        <button onClick={() => setQty((q) => Math.min(50, q + 1))} className="p-3 hover:bg-stone-100" aria-label="Increase quantity">
          <Plus className="h-4 w-4" />
        </button>
      </div>
      <button
        onClick={handleAdd}
        className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-stone-900 px-6 py-3 font-medium text-white transition hover:bg-stone-700"
      >
        {added ? <Check className="h-5 w-5" /> : <ShoppingBag className="h-5 w-5" />}
        {added ? 'Added' : 'Add to cart'}
      </button>
    </div>
  )
}
