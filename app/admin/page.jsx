'use client'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Loader2, RefreshCw, AlertCircle, Inbox, ChevronDown } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { formatPrice, DEFAULT_CONFIG } from '@/lib/utils'

const STATUSES = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled']
const STATUS_STYLES = {
  pending: 'bg-amber-100 text-amber-800',
  confirmed: 'bg-blue-100 text-blue-800',
  shipped: 'bg-indigo-100 text-indigo-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-stone-200 text-stone-600',
}

export default function AdminDashboard() {
  const [supabase] = useState(() => createClient())
  const [orders, setOrders] = useState([])
  const [currency, setCurrency] = useState(DEFAULT_CONFIG.currency_symbol)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('all')
  const [expanded, setExpanded] = useState(null)
  const [updatingId, setUpdatingId] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    const [ordersRes, configRes] = await Promise.all([
      supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(100),
      supabase.from('store_config').select('value').eq('key', 'currency_symbol').maybeSingle(),
    ])
    if (ordersRes.error) setError(ordersRes.error.message)
    else setOrders(ordersRes.data)
    if (configRes.data?.value) setCurrency(configRes.data.value)
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    load()
  }, [load])

  async function updateStatus(id, status) {
    setUpdatingId(id)
    const { error } = await supabase.from('orders').update({ status }).eq('id', id)
    if (error) alert(`Could not update order: ${error.message}`)
    else setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)))
    setUpdatingId(null)
  }

  const stats = useMemo(() => {
    const today = new Date().toDateString()
    return {
      pending: orders.filter((o) => o.status === 'pending').length,
      today: orders.filter((o) => new Date(o.created_at).toDateString() === today).length,
      revenue: orders
        .filter((o) => o.status !== 'cancelled' && o.status !== 'pending')
        .reduce((s, o) => s + Number(o.total_amount), 0),
    }
  }, [orders])

  const visible = filter === 'all' ? orders : orders.filter((o) => o.status === filter)

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">WhatsApp Orders</h1>
          <p className="text-sm text-stone-500">Latest 100 orders submitted from the storefront</p>
        </div>
        <button onClick={load} disabled={loading} className="flex items-center gap-2 rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm hover:bg-stone-100 disabled:opacity-50">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Stat label="Pending orders" value={stats.pending} />
        <Stat label="Orders today" value={stats.today} />
        <Stat label="Confirmed revenue (shown)" value={formatPrice(stats.revenue, currency)} />
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {['all', ...STATUSES].map((s) => (
          <button
            key={s} onClick={() => setFilter(s)}
            className={`rounded-full px-3 py-1 text-sm capitalize ${filter === s ? 'bg-stone-900 text-white' : 'bg-white text-stone-600 ring-1 ring-stone-200 hover:bg-stone-100'}`}
          >
            {s}
          </button>
        ))}
      </div>

      {error ? (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle className="h-4 w-4" /> {error}
        </div>
      ) : loading && orders.length === 0 ? (
        <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-stone-400" /></div>
      ) : visible.length === 0 ? (
        <div className="flex flex-col items-center rounded-xl bg-white py-16 text-stone-500 ring-1 ring-stone-200">
          <Inbox className="mb-2 h-8 w-8" /> No orders yet
        </div>
      ) : (
        <ul className="space-y-3">
          {visible.map((o) => (
            <li key={o.id} className="rounded-xl bg-white ring-1 ring-stone-200">
              <div className="flex flex-wrap items-center gap-3 p-4">
                <button onClick={() => setExpanded(expanded === o.id ? null : o.id)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                  <ChevronDown className={`h-4 w-4 shrink-0 transition ${expanded === o.id ? 'rotate-180' : ''}`} />
                  <div className="min-w-0">
                    <p className="truncate font-medium">{o.customer_name}</p>
                    <p className="text-xs text-stone-500">
                      #{o.id.slice(0, 8)} · {new Date(o.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                    </p>
                  </div>
                </button>
                <span className="font-semibold">{formatPrice(o.total_amount, currency)}</span>
                <div className="flex items-center gap-2">
                  {updatingId === o.id && <Loader2 className="h-4 w-4 animate-spin text-stone-400" />}
                  <select
                    value={o.status} disabled={updatingId === o.id}
                    onChange={(e) => updateStatus(o.id, e.target.value)}
                    className={`rounded-full border-0 px-3 py-1 text-xs font-medium capitalize ${STATUS_STYLES[o.status] || ''}`}
                  >
                    {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              {expanded === o.id && (
                <div className="grid gap-4 border-t border-stone-100 p-4 text-sm sm:grid-cols-2">
                  <div>
                    <p className="mb-1 font-medium text-stone-700">Delivery address</p>
                    <p className="whitespace-pre-wrap text-stone-600">{o.address}</p>
                  </div>
                  <div>
                    <p className="mb-1 font-medium text-stone-700">Items</p>
                    <ul className="space-y-1 text-stone-600">
                      {(o.cart_items || []).map((it, i) => (
                        <li key={i} className="flex justify-between gap-2">
                          <span>{it.title} × {it.quantity}</span>
                          <span>{formatPrice(it.price * it.quantity, currency)}</span>
                        </li>
                      ))}
                      <li className="flex justify-between gap-2 border-t border-stone-100 pt-1">
                        <span>Delivery</span><span>{formatPrice(o.delivery_fee, currency)}</span>
                      </li>
                    </ul>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function Stat({ label, value }) {
  return (
    <div className="rounded-xl bg-white p-4 ring-1 ring-stone-200">
      <p className="text-sm text-stone-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </div>
  )
}
