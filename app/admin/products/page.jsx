'use client'
import { useCallback, useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, Loader2, AlertCircle, X, ImageOff, PackageOpen } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { formatPrice } from '@/lib/utils'
import { revalidateStorefront } from '../actions'
import ImageUploader from '@/components/admin/ImageUploader'

const EMPTY = { title: '', description: '', price: '', image_url: '', in_stock: true, is_active: true }

export default function ProductsPage() {
  const supabase = createClient()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(null) // null | product | EMPTY (new)
  const [deletingId, setDeletingId] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false })
    if (error) setError(error.message)
    else { setProducts(data); setError('') }
    setLoading(false)
  }, [supabase])

  useEffect(() => { load() }, [load])

  async function handleDelete(product) {
    if (!confirm(`Delete "${product.title}"? This cannot be undone.`)) return
    setDeletingId(product.id)
    const { error } = await supabase.from('products').delete().eq('id', product.id)
    if (error) alert(`Delete failed: ${error.message}`)
    else {
      setProducts((p) => p.filter((x) => x.id !== product.id))
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

  function handleSaved(saved, isNew) {
    setProducts((p) => (isNew ? [saved, ...p] : p.map((x) => (x.id === saved.id ? saved : x))))
    setEditing(null)
    revalidateStorefront()
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Products</h1>
          <p className="text-sm text-stone-500">{products.length} total</p>
        </div>
        <button onClick={() => setEditing(EMPTY)} className="flex items-center gap-2 rounded-lg bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-700">
          <Plus className="h-4 w-4" /> Add product
        </button>
      </div>

      {error ? (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"><AlertCircle className="h-4 w-4" />{error}</div>
      ) : loading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-stone-400" /></div>
      ) : products.length === 0 ? (
        <div className="flex flex-col items-center rounded-xl bg-white py-16 text-stone-500 ring-1 ring-stone-200">
          <PackageOpen className="mb-2 h-8 w-8" /> No products yet — add your first one.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl bg-white ring-1 ring-stone-200">
          <ul className="divide-y divide-stone-100">
            {products.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center gap-4 p-4 sm:flex-nowrap">
                <Thumb src={p.image_url} alt={p.title} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{p.title}</p>
                  <p className="text-sm text-stone-500">{formatPrice(p.price)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Toggle on={p.is_active} onClick={() => quickToggle(p, 'is_active')} onLabel="Visible" offLabel="Hidden" />
                  <Toggle on={p.in_stock} onClick={() => quickToggle(p, 'in_stock')} onLabel="In stock" offLabel="Sold out" />
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => setEditing(p)} className="rounded-lg p-2 text-stone-600 hover:bg-stone-100" aria-label="Edit"><Pencil className="h-4 w-4" /></button>
                  <button onClick={() => handleDelete(p)} disabled={deletingId === p.id} className="rounded-lg p-2 text-red-600 hover:bg-red-50 disabled:opacity-50" aria-label="Delete">
                    {deletingId === p.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {editing && <ProductForm initial={editing} onClose={() => setEditing(null)} onSaved={handleSaved} />}
    </div>
  )
}

function Toggle({ on, onClick, onLabel, offLabel }) {
  return (
    <button onClick={onClick} className={`rounded-full px-2.5 py-1 text-xs font-medium ${on ? 'bg-green-100 text-green-800' : 'bg-stone-200 text-stone-600'}`}>
      {on ? onLabel : offLabel}
    </button>
  )
}

function Thumb({ src, alt }) {
  const [failed, setFailed] = useState(false)
  return (
    <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-stone-100">
      {src && !failed
        ? <img src={src} alt={alt} className="h-full w-full object-cover" onError={() => setFailed(true)} />
        : <ImageOff className="h-5 w-5 text-stone-400" />}
    </div>
  )
}

function ProductForm({ initial, onClose, onSaved }) {
  const supabase = createClient()
  const isNew = !initial.id
  // Migrate old image_url to images array for the form state
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
