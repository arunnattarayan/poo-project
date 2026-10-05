'use client'
import { useEffect, useState } from 'react'
import { Loader2, Save, CheckCircle2, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { revalidateStorefront } from '../actions'

export default function SocialSettingsPage() {
  const supabase = createClient()
  const [config, setConfig] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState(null)

  useEffect(() => {
    let cancelled = false
    supabase.from('store_configurations').select('*').limit(1).single().then(({ data, error }) => {
      if (cancelled) return
      if (error && error.code !== 'PGRST116') {
        setStatus({ type: 'error', message: error.message })
      } else {
        setConfig(data || {
          social_urls: { facebook: '', twitter: '', instagram: '', pinterest: '' },
          show_floating_social_bar: true,
          show_footer_social_icons: true
        })
      }
      setLoading(false)
    })
    return () => { cancelled = true }
  }, [supabase])

  async function handleSave(e) {
    e.preventDefault()
    setStatus(null)
    setSaving(true)

    const payload = {
      social_urls: config.social_urls,
      show_floating_social_bar: config.show_floating_social_bar,
      show_footer_social_icons: config.show_footer_social_icons
    }

    const { error } = await supabase.from('store_configurations').update(payload).eq('id', config.id || (await supabase.from('store_configurations').select('id').single()).data?.id)
    
    if (error) {
      setStatus({ type: 'error', message: error.message })
    } else {
      await revalidateStorefront()
      setStatus({ type: 'success', message: 'Social media settings saved.' })
    }
    setSaving(false)
  }

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-stone-400" /></div>
  }

  if (!config) return null

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-semibold">Social Media Settings</h1>
      <p className="mb-6 text-sm text-stone-500">Configure your social links and visibility toggles across the storefront.</p>

      <form onSubmit={handleSave} className="space-y-6 rounded-xl bg-white p-6 ring-1 ring-stone-200">
        
        {/* Toggles */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4 border-b border-stone-100">
          <label className="flex items-center gap-3 text-sm font-medium text-stone-700 cursor-pointer">
            <input 
              type="checkbox" 
              checked={config.show_floating_social_bar} 
              onChange={e => setConfig({...config, show_floating_social_bar: e.target.checked})} 
              className="h-4 w-4 rounded border-stone-300 text-stone-900 focus:ring-stone-900"
            />
            Show Floating Social Bar
          </label>
          <label className="flex items-center gap-3 text-sm font-medium text-stone-700 cursor-pointer">
            <input 
              type="checkbox" 
              checked={config.show_footer_social_icons} 
              onChange={e => setConfig({...config, show_footer_social_icons: e.target.checked})} 
              className="h-4 w-4 rounded border-stone-300 text-stone-900 focus:ring-stone-900"
            />
            Show Footer Social Icons
          </label>
        </div>

        {/* Social URLs */}
        <div>
          <h3 className="text-sm font-medium text-stone-700 mb-4">Platform URLs</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {['facebook', 'twitter', 'instagram', 'pinterest', 'youtube'].map(platform => (
              <div key={platform}>
                <label className="block text-xs font-medium text-stone-500 capitalize mb-1.5">{platform}</label>
                <input
                  type="url"
                  placeholder={`https://${platform}.com/...`}
                  value={config.social_urls?.[platform] || ''}
                  onChange={e => setConfig({
                    ...config, 
                    social_urls: { ...config.social_urls, [platform]: e.target.value }
                  })}
                  className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-stone-900 focus:ring-1 focus:ring-stone-900"
                />
              </div>
            ))}
          </div>
        </div>

        {status && (
          <div className={`flex items-start gap-2 rounded-lg p-3 text-sm ${status.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {status.type === 'success' ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> : <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />}
            {status.message}
          </div>
        )}

        <div className="pt-2">
          <button type="submit" disabled={saving} className="flex items-center gap-2 rounded-lg bg-stone-900 px-4 py-2.5 font-medium text-white hover:bg-stone-700 disabled:opacity-60">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? 'Saving…' : 'Save Social Settings'}
          </button>
        </div>
      </form>
    </div>
  )
}
