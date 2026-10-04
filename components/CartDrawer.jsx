'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { X, Minus, Plus, Trash2, ShoppingBag, ArrowLeft } from 'lucide-react'
import { useCart } from '@/lib/cart-store'
import { formatPrice } from '@/lib/utils'
import { useStoreConfig } from './ConfigProvider'
import ProductImage from './ProductImage'
import CheckoutForm from './CheckoutForm'

export default function CartDrawer() {
  const { items, isOpen, close, setQuantity, remove, step, setStep } = useCart()
  const { currency_symbol, delivery_fee } = useStoreConfig()

  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0)
  const fee = items.length ? Number(delivery_fee) || 0 : 0

  // Escape to close + lock background scroll while open.
  useEffect(() => {
    if (!isOpen) return
    const onKey = (e) => e.key === 'Escape' && close()
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [isOpen, close])

  // Reset to the cart view when the drawer closes (not when the cart empties,
  // so the post-checkout "Open WhatsApp" fallback stays visible).
  useEffect(() => {
    if (!isOpen) setStep('cart')
  }, [isOpen, setStep])

  return (
    <div className={`fixed inset-0 z-50 ${isOpen ? '' : 'pointer-events-none'}`} aria-hidden={!isOpen}>
      <div onClick={close} className={`absolute inset-0 bg-black/40 transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0'}`} />

      <aside
        role="dialog" aria-label="Shopping cart"
        className={`absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-white shadow-xl transition-transform duration-300 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="flex items-center justify-between border-b border-stone-200 px-5 py-4">
          {step === 'checkout' ? (
            <button onClick={() => setStep('cart')} className="flex items-center gap-1 text-sm font-medium text-stone-600 hover:text-stone-900">
              <ArrowLeft className="h-4 w-4" /> Back to cart
            </button>
          ) : (
            <h2 className="text-lg font-semibold">Your cart</h2>
          )}
          <button onClick={close} className="rounded-full p-1.5 hover:bg-stone-100" aria-label="Close cart"><X className="h-5 w-5" /></button>
        </div>

        {step === 'checkout' ? (
          <div className="flex-1 overflow-y-auto p-5">
            <CheckoutForm subtotal={subtotal} deliveryFee={fee} />
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-stone-500">
            <ShoppingBag className="h-10 w-10" />
            <p>Your cart is empty</p>
            <Link href="/" onClick={close} className="text-sm font-medium text-stone-900 underline">Continue shopping</Link>
          </div>
        ) : (
          <>
            <ul className="flex-1 divide-y divide-stone-100 overflow-y-auto px-5">
              {items.map((item) => (
                <li key={item.id} className="flex gap-4 py-4">
                  <Link href={`/product/${item.id}`} onClick={close} className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-stone-100">
                    <ProductImage src={item.image_url} alt={item.title} className="h-full w-full object-cover" />
                  </Link>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex justify-between gap-2">
                      <p className="line-clamp-2 text-sm font-medium">{item.title}</p>
                      <button onClick={() => remove(item.id)} className="text-stone-400 hover:text-red-600" aria-label={`Remove ${item.title}`}>
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <p className="text-sm text-stone-500">{formatPrice(item.price, currency_symbol)}</p>
                    <div className="mt-auto flex items-center justify-between">
                      <div className="flex items-center rounded-md border border-stone-200">
                        <button onClick={() => setQuantity(item.id, item.quantity - 1)} className="p-1.5 hover:bg-stone-100" aria-label="Decrease"><Minus className="h-3.5 w-3.5" /></button>
                        <span className="w-7 text-center text-sm">{item.quantity}</span>
                        <button onClick={() => setQuantity(item.id, item.quantity + 1)} className="p-1.5 hover:bg-stone-100" aria-label="Increase"><Plus className="h-3.5 w-3.5" /></button>
                      </div>
                      <span className="text-sm font-semibold">{formatPrice(item.price * item.quantity, currency_symbol)}</span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <div className="space-y-2 border-t border-stone-200 p-5 text-sm">
              <Row label="Subtotal" value={formatPrice(subtotal, currency_symbol)} />
              <Row label="Delivery" value={fee ? formatPrice(fee, currency_symbol) : 'Free'} />
              <Row label="Total" value={formatPrice(subtotal + fee, currency_symbol)} bold />
              <button onClick={() => setStep('checkout')} className="mt-3 w-full rounded-lg bg-stone-900 py-3 font-medium text-white hover:bg-stone-700">
                Proceed to checkout
              </button>
            </div>
          </>
        )}
      </aside>
    </div>
  )
}

function Row({ label, value, bold }) {
  return (
    <div className={`flex justify-between ${bold ? 'pt-1 text-base font-semibold' : 'text-stone-600'}`}>
      <span>{label}</span><span>{value}</span>
    </div>
  )
}
