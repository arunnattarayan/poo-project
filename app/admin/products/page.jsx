'use client'
import { useCallback, useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, Loader2, AlertCircle, X, ImageOff, PackageOpen, Search, ChevronLeft, ChevronRight } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { formatPrice } from '@/lib/utils'
import { revalidateStorefront } from '../actions'
import ImageUploader from '@/components/admin/ImageUploader'

const EMPTY = { title: '', description: '', price: '', image_url: '', in_stock: true, is_active: true }

export default function ProductsPage() {
  const [supabase] = useState(() => createClient())
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(null)
  const [deletingId, setDeletingId] = useState(null)

  // Pagination & Filters
  const [page, setPage] = useState(1)
  const pageSize = 12
  const [totalCount, setTotalCount] = useState(0)
  
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [sortBy, setSortBy] = useState('newest')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterVisibility, setFilterVisibility] = useState('all')

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1)
    }, 500)
    return () => clearTimeout(t)
  }, [search])

  const load = useCallback(async () => {
    setLoading(true)
    let query = supabase.from('products').select('*', { count: 'exact' })
    
    if (debouncedSearch) query = query.ilike('title', `%${debouncedSearch}%`)
    if (filterStatus === 'in_stock') query = query.eq('in_stock', true)
    if (filterStatus === 'out_of_stock') query = query.eq('in_stock', false)
    if (filterVisibility === 'visible') query = query.eq('is_active', true)
    if (filterVisibility === 'hidden') query = query.eq('is_active', false)
    
    if (sortBy === 'price_asc') query = query.order('price', { ascending: true })
    else if (sortBy === 'price_desc') query = query.order('price', { ascending: false })
    else if (sortBy === 'az') query = query.order('title', { ascending: true })
    else if (sortBy === 'za') query = query.order('title', { ascending: false })
    else query = query.order('created_at', { ascending: false })
    
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1
    query = query.range(from, to)

    const { data, error, count } = await query
    
    if (error) setError(error.message)
    else { 
      setProducts(data)
      setTotalCount(count || 0)
      setError('') 
    }
    setLoading(false)
  }, [supabase, page, pageSize, debouncedSearch, filterStatus, filterVisibility, sortBy])

  useEffect(() => { load() }, [load])

  async function handleDelete(product) {
    if (!confirm(`Delete "${product.title}"? This cannot be undone.`)) return
    setDeletingId(product.id)
    const { error } = await supabase.from('products').delete().eq('id', product.id)
    if (error) alert(`Delete failed: ${error.message}`)
    else {
      load() // reload to fix pagination
      revalidateStorefront()
    }
    setDeletingId(null)
  }

  async function quickToggle(product, field) {
    const value = !product[field]
    setProducts((p) => p.map((x) => (x.id === product.id ? { ...x, [field]: value } : x)))
    const { error } = await supabase.from('products').update({ [field]: value }).eq('id', product.id)
    if (error) {
      alert(error.message)
      setProducts((p) => p.map((x) => (x.id === product.id ? { ...x, [field]: !value } : x)))
    } else revalidateStorefront()
  }

  function handleSaved() {
    load() // reload to fix sorting/pagination
    setEditing(null)
    revalidateStorefront()
  }

  const totalPages = Math.ceil(totalCount / pageSize)

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Products</h1>
          <p className="text-sm text-stone-500">{totalCount} total</p>
        </div>
        <button onClick={() => setEditing(EMPTY)} className="flex items-center gap-2 rounded-lg bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-700">
          <Plus className="h-4 w-4" /> Add product
        </button>
      </div>

      <div className="mb-6 flex flex-col gap-4 rounded-xl bg-white p-4 ring-1 ring-stone-200 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-stone-300 py-2 pl-9 pr-3 text-sm outline-none focus:border-stone-900 focus:ring-1 focus:ring-stone-900"
          />
        </div>
        <div className="flex flex-wrap gap-3">
          <select value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }} className="rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-stone-900">
            <option value="all">All stock</option>
            <option value="in_stock">In stock</option>
            <option value="out_of_stock">Out of stock</option>
          </select>
          <select value={filterVisibility} onChange={(e) => { setFilterVisibility(e.target.value); setPage(1); }} className="rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-stone-900">
            <option value="all">All visibility</option>
            <option value="visible">Visible</option>
            <option value="hidden">Hidden</option>
          </select>
          <select value={sortBy} onChange={(e) => { setSortBy(e.target.value); setPage(1); }} className="rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-stone-900">
            <option value="newest">Newest Arrivals</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="az">Name: A-Z</option>
            <option value="za">Name: Z-A</option>
          </select>
        </div>
      </div>

      {error ? (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"><AlertCircle className="h-4 w-4" />{error}</div>
      ) : loading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-stone-400" /></div>
      ) : products.length === 0 ? (
        <div className="flex flex-col items-center rounded-xl bg-white py-16 text-stone-500 ring-1 ring-stone-200">
          <PackageOpen className="mb-2 h-8 w-8" /> No products found.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
            {products.map((p) => (
              <div key={p.id} className="flex flex-col overflow-hidden rounded-xl bg-white ring-1 ring-stone-200">
                <div className="aspect-[4/5] relative bg-stone-100">
                  {p.image_url ? (
                    <img src={p.image_url} alt={p.title} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-stone-400"><ImageOff className="h-8 w-8" /></div>
                  )}
                  <div className="absolute top-2 right-2 flex gap-1">
                    <button onClick={() => setEditing(p)} className="rounded-full bg-white/90 p-1.5 text-stone-700 shadow-sm hover:bg-white hover:text-stone-900"><Pencil className="h-4 w-4" /></button>
                    <button onClick={() => handleDelete(p)} disabled={deletingId === p.id} className="rounded-full bg-white/90 p-1.5 text-red-600 shadow-sm hover:bg-white hover:text-red-700 disabled:opacity-50">
                      {deletingId === p.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="flex flex-col p-4 flex-1">
                  <h3 className="font-medium line-clamp-1" title={p.title}>{p.title}</h3>
                  <p className="mt-1 text-sm text-stone-500">{formatPrice(p.price)}</p>
                  <div className="mt-auto pt-4 flex flex-wrap gap-2">
                    <Toggle on={p.is_active} onClick={() => quickToggle(p, 'is_active')} onLabel="Visible" offLabel="Hidden" />
                    <Toggle on={p.in_stock} onClick={() => quickToggle(p, 'in_stock')} onLabel="In stock" offLabel="Sold out" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} className="flex h-10 w-10 items-center justify-center rounded-lg border border-stone-300 text-stone-600 hover:bg-stone-50 disabled:opacity-50 disabled:hover:bg-transparent">
                <ChevronLeft className="h-5 w-5" />
              </button>
              <span className="px-4 text-sm font-medium text-stone-600">Page {page} of {totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="flex h-10 w-10 items-center justify-center rounded-lg border border-stone-300 text-stone-600 hover:bg-stone-50 disabled:opacity-50 disabled:hover:bg-transparent">
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          )}
        </>
      )}

      {editing && <ProductForm initial={editing} onClose={() => setEditing(null)} onSaved={handleSaved} />}
    </div>
  )
}

function Toggle({ on, onClick, onLabel, offLabel }) {
  return (
    <button onClick={onClick} className={`rounded-full px-2.5 py-1 text-[11px] font-medium uppercase tracking-wider ${on ? 'bg-green-100 text-green-800' : 'bg-stone-200 text-stone-600'}`}>
      {on ? onLabel : offLabel}
    </button>
  )
}

function ProductForm({ initial, onClose, onSaved }) {
  const supabase = createClient()
  const isNew = !initial.id
  const initialImages = Array.isArray(initial.images) && initial.images.length > 0 
    ? initial.images 
    : (initial.image_url ? [initial.image_url] : [])
    
  const [form, setForm] = useState({ ...initial, price: initial.price?.toString() ?? '', images: initialImages })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))
  
  const setImages = (images) => setForm((f) => ({ ...f, images }))

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    const price = Number(form.price)
    if (!form.title.trim()) return setError('Title is required.')
    if (form.price === '' || Number.isNaN(price) || price < 0) return setError('Enter a valid price.')

    setSaving(true)
    const payload = {
      title: form.title.trim(),
      description: form.description?.trim() || null,
      price,
      images: form.images,
      image_url: form.images?.[0] || '', // Fallback for backward compatibility
      in_stock: form.in_stock,
      is_active: form.is_active,
    }
    const query = isNew
      ? supabase.from('products').insert(payload)
      : supabase.from('products').update(payload).eq('id', initial.id)
    const { data, error } = await query.select().single()
    setSaving(false)
    if (error) return setError(error.message)
    onSaved(data, isNew)
  }

  const inputCls = 'w-full rounded-lg border border-stone-300 px-3 py-2 outline-none focus:border-stone-900 focus:ring-1 focus:ring-stone-900'

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center sm:p-4" onClick={onClose}>
      <div className="max-h-[92vh] w-full overflow-y-auto rounded-t-2xl bg-white p-6 sm:max-w-xl sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{isNew ? 'Add product' : 'Edit product'}</h2>
          <button onClick={onClose} className="rounded-lg p-1 hover:bg-stone-100" aria-label="Close"><X className="h-5 w-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-stone-700">Title</label>
            <input value={form.title} onChange={set('title')} required className={inputCls} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-stone-700">Description</label>
            <textarea value={form.description ?? ''} onChange={set('description')} rows={4} className={inputCls} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-stone-700">Price</label>
            <input value={form.price} onChange={set('price')} inputMode="decimal" required className={inputCls} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-stone-700">Product Images</label>
            <ImageUploader images={form.images} onChange={setImages} />
          </div>
          <div className="flex flex-wrap gap-6 pt-2">
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.in_stock} onChange={set('in_stock')} className="h-4 w-4" /> In stock</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.is_active} onChange={set('is_active')} className="h-4 w-4" /> Visible in store</label>
          </div>
          {error && <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700"><AlertCircle className="h-4 w-4" />{error}</div>}
          <div className="flex justify-end gap-2 pt-4">
            <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-sm hover:bg-stone-100">Cancel</button>
            <button type="submit" disabled={saving} className="flex items-center gap-2 rounded-lg bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-700 disabled:opacity-60">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {isNew ? 'Create' : 'Save changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
