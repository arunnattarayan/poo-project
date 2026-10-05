'use client'
import { useEffect, useState } from 'react'
import { Loader2, Save, CheckCircle2, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { DEFAULT_CONFIG, normalizeWhatsapp } from '@/lib/utils'
import { revalidateStorefront } from '../actions'

import LayoutSettings from './LayoutSettings'

const FIELDS = [
  { key: 'store_name', label: 'Store name', placeholder: 'Nanjai Clothing' },
  { key: 'store_logo', label: 'Store logo URL', placeholder: 'https://example.com/logo.png', help: 'Optional. Leave blank to display the store name.' },
  { key: 'store_tagline', label: 'Tagline', placeholder: 'Tamil & spiritual printed T-shirts' },
  {
    key: 'whatsapp_number', label: 'Business WhatsApp number', placeholder: '919876543210',
    help: 'Include the country code, e.g. 91 for India. Spaces, "+" and dashes are removed automatically.',
    inputMode: 'tel',
  },
  { key: 'currency_symbol', label: 'Currency symbol', placeholder: '₹' },
  { key: 'delivery_fee', label: 'Standard delivery fee', placeholder: '50', inputMode: 'decimal', help: 'Use 0 for free delivery.' },
  { key: 'header_links', label: 'Header Links (JSON format)', placeholder: '[{"label":"New Arrivals","url":"#"}]' },
  { key: 'footer_copyright', label: 'Footer Copyright Text', placeholder: '© Norrai Clothing. All rights reserved.' },
]

export default function SettingsPage() {
  const [supabase] = useState(() => createClient())
  const [config, setConfig] = useState(DEFAULT_CONFIG)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState(null) // { type: 'success' | 'error', message }

  useEffect(() => {
    let cancelled = false
    supabase.from('store_config').select('key, value').then(({ data, error }) => {
      if (cancelled) return
      if (error) setStatus({ type: 'error', message: error.message })
      else if (data) {
        const dbConfig = Object.fromEntries(data.map((r) => [r.key, r.value]))
        const mergedConfig = { ...DEFAULT_CONFIG }
        for (const [k, v] of Object.entries(dbConfig)) {
          if (v) mergedConfig[k] = v
        }
        setConfig(mergedConfig)
      }
      setLoading(false)
    })
    return () => { cancelled = true }
  }, [supabase])

  function validate(c) {
    const wa = normalizeWhatsapp(c.whatsapp_number)
    if (wa.length < 10 || wa.length > 15) return 'WhatsApp number must be 10–15 digits including country code.'
    if (!c.store_name.trim()) return 'Store name is required.'
    if (!c.currency_symbol.trim()) return 'Currency symbol is required.'
    const fee = Number(c.delivery_fee)
    if (c.delivery_fee === '' || Number.isNaN(fee) || fee < 0) return 'Delivery fee must be a number ≥ 0.'
    return null
  }

  async function handleSave(e) {
    e.preventDefault()
    setStatus(null)
    const err = validate(config)
    if (err) return setStatus({ type: 'error', message: err })

    setSaving(true)
    const cleaned = {
      ...config,
      whatsapp_number: normalizeWhatsapp(config.whatsapp_number),
      delivery_fee: String(Number(config.delivery_fee)),
    }
    const rows = FIELDS.map(({ key }) => ({ key, value: String(cleaned[key] ?? '').trim() }))
    const { error } = await supabase.from('store_config').upsert(rows, { onConflict: 'key' })

    if (error) {
      setStatus({ type: 'error', message: error.message })
    } else {
      setConfig(cleaned)
      await revalidateStorefront()
      setStatus({ type: 'success', message: 'Settings saved. The storefront has been updated.' })
    }
    setSaving(false)
  }

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-stone-400" /></div>
  }

  return (
    <div className="mx-auto max-w-3xl pb-12">
      <h1 className="text-2xl font-semibold">Store settings</h1>
      <p className="mb-6 text-sm text-stone-500">These values are used across the storefront and WhatsApp checkout.</p>

      <form onSubmit={handleSave} className="space-y-5 rounded-xl bg-white p-8 ring-1 ring-stone-200">
        {FIELDS.map(({ key, label, placeholder, help, inputMode }) => (
          <div key={key}>
            <label htmlFor={key} className="mb-1 block text-sm font-medium text-stone-700">{label}</label>
            <input
              id={key} inputMode={inputMode} placeholder={placeholder}
              value={config[key] ?? ''}
              onChange={(e) => setConfig((c) => ({ ...c, [key]: e.target.value }))}
              className="w-full rounded-lg border border-stone-300 px-3 py-2 outline-none focus:border-stone-900 focus:ring-1 focus:ring-stone-900"
            />
            {help && <p className="mt-1 text-xs text-stone-500">{help}</p>}
          </div>
        ))}

        {status && (
          <div className={`flex items-start gap-2 rounded-lg p-3 text-sm ${status.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {status.type === 'success' ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> : <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />}
            {status.message}
          </div>
        )}

        <button type="submit" disabled={saving} className="flex items-center gap-2 rounded-lg bg-stone-900 px-4 py-2.5 font-medium text-white hover:bg-stone-700 disabled:opacity-60">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saving ? 'Saving…' : 'Save settings'}
        </button>
      </form>

      <LayoutSettings />
    </div>
  )
}
