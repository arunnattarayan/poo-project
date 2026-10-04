'use client'
import { useState } from 'react'
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { useCart } from '@/lib/cart-store'
import { formatPrice } from '@/lib/utils'
import { useStoreConfig } from './ConfigProvider'
import { useRouter } from 'next/navigation'

export default function CheckoutForm({ subtotal, deliveryFee }) {
  const items = useCart((s) => s.items)
  const clear = useCart((s) => s.clear)
  const close = useCart((s) => s.close)
  const { currency_symbol } = useStoreConfig()
  const router = useRouter()

  const [form, setForm] = useState({ name: '', phone: '', address: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const fmt = (n) => formatPrice(n, currency_symbol)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!form.name.trim() || !form.phone.trim() || !form.address.trim()) return setError('Please fill in all delivery details.')
    if (items.length === 0) return setError('Your cart is empty.')

    setLoading(true)
    try {
      const supabase = createClient()
      const { data: order, error: rpcError } = await supabase.rpc('create_order', {
        p_customer_name: form.name,
        p_customer_phone: form.phone,
        p_address: form.address,
        p_items: items.map(({ id, quantity }) => ({ id, quantity })),
      })
      if (rpcError) throw new Error(rpcError.message)

      clear()
      close()
      
      // Redirect to home with a success flag so we can show a toast or message
      router.push('/?success=true')
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const inputCls = 'w-full rounded-none border border-heritage-gold/20 px-3 py-2.5 outline-none focus:border-heritage-dark focus:ring-1 focus:ring-heritage-dark'

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-lg font-serif font-semibold text-heritage-dark">Delivery details</h3>
      <div>
        <label htmlFor="cust-name" className="mb-1 block text-sm font-medium text-heritage-dark/80">Full name</label>
        <input id="cust-name" required maxLength={120} autoComplete="name" value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className={inputCls} />
      </div>
      <div>
        <label htmlFor="cust-phone" className="mb-1 block text-sm font-medium text-heritage-dark/80">Phone number</label>
        <input id="cust-phone" type="tel" required maxLength={20} autoComplete="tel" value={form.phone}
          onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} className={inputCls} />
      </div>
      <div>
        <label htmlFor="cust-address" className="mb-1 block text-sm font-medium text-heritage-dark/80">Delivery address</label>
        <textarea id="cust-address" required maxLength={1000} rows={4} autoComplete="street-address"
          placeholder="House no, street, area, city, PIN code"
          value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} className={inputCls} />
      </div>

      <div className="space-y-1 rounded-none bg-heritage-light/50 border border-heritage-gold/10 p-4 text-sm font-medium text-heritage-dark">
        <div className="flex justify-between text-heritage-dark/70"><span>Subtotal</span><span>{fmt(subtotal)}</span></div>
        <div className="flex justify-between text-heritage-dark/70"><span>Delivery</span><span>{deliveryFee ? fmt(deliveryFee) : 'Free'}</span></div>
        <div className="flex justify-between pt-2 mt-2 border-t border-heritage-gold/20 font-bold text-base"><span>Total</span><span>{fmt(subtotal + deliveryFee)}</span></div>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-none bg-red-50 p-3 text-sm text-red-700 border border-red-100">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      <button type="submit" disabled={loading}
        className="flex w-full items-center justify-center gap-2 rounded-none border border-heritage-dark bg-heritage-dark py-3.5 font-bold uppercase tracking-wider text-heritage-gold transition hover:bg-heritage-dark/90 disabled:opacity-60 shadow-md mt-4">
        {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <CheckCircle2 className="h-5 w-5" />}
        {loading ? 'Placing order…' : 'Confirm Order'}
      </button>
      <p className="text-center text-xs text-heritage-dark/50">Your order will be processed securely.</p>
    </form>
  )
}
