'use client'
import { useEffect, useState } from 'react'
import { Loader2, Save, CheckCircle2, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { revalidateStorefront } from '../actions'
import DraggableList from '@/components/DraggableList'
import ActivePaymentProviders from '@/components/ActivePaymentProviders'

export default function LayoutSettings() {
  const [supabase] = useState(() => createClient())
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
        setConfig({
          id: data?.id,
          social_urls: data?.social_urls || { facebook: '', twitter: '', instagram: '', pinterest: '' },
          show_floating_social_bar: data?.show_floating_social_bar ?? true,
          show_footer_social_icons: data?.show_footer_social_icons ?? true,
          newsletter_header: data?.newsletter_header || 'JOIN OUR COMMUNITY',
          newsletter_subheader: data?.newsletter_subheader || 'Get early access to our collections.',
          payment_providers: data?.payment_providers || ['visa', 'mastercard', 'amex', 'paypal'],
          footer_about_links: data?.footer_about_links || [{label:"Our Story",url:"#"},{label:"Ethical Practices",url:"#"}],
          footer_contact_links: data?.footer_contact_links || [{label:"Contact",url:"#"},{label:"Press",url:"#"},{label:"Wholesale",url:"#"}],
          footer_support_links: data?.footer_support_links || [{label:"Size Guide",url:"#"},{label:"Shipping & Returns",url:"#"},{label:"FAQ",url:"#"}]
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

    const payload = { ...config }
    delete payload.id // don't try to update id
    delete payload.updated_at
    
    // We update by id if it exists, or just do a generic update since there's only one row.
    // If table might be empty, let's use an RPC or just update where id is not null. 
    // Wait, the migration ensures there's exactly 1 row.
    const { error } = await supabase.from('store_configurations').update(payload).eq('id', config.id || (await supabase.from('store_configurations').select('id').single()).data?.id)
    
    if (error) {
      setStatus({ type: 'error', message: error.message })
    } else {
      await revalidateStorefront()
      setStatus({ type: 'success', message: 'Layout configurations saved.' })
    }
    setSaving(false)
  }

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-stone-400" /></div>
  }

  if (!config) return null

  return (
    <div className="mt-12">
      <h2 className="text-2xl font-semibold">Layout & Footer Settings</h2>
      <p className="mb-6 text-sm text-stone-500">Configure footer links, social media icons, and active payment providers.</p>

      <form onSubmit={handleSave} className="space-y-6 rounded-xl bg-white p-8 ring-1 ring-stone-200">
        
        {/* Newsletter */}
        <div>
          <h3 className="text-sm font-medium text-stone-700 mb-3 border-b pb-1">Newsletter Section</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-stone-500 mb-1">Header Text</label>
              <input
                type="text"
                value={config.newsletter_header || ''}
                onChange={e => setConfig({...config, newsletter_header: e.target.value})}
                className="w-full rounded-lg border border-stone-300 px-3 py-1.5 text-sm outline-none focus:border-stone-900"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-500 mb-1">Subheader Text</label>
              <input
                type="text"
                value={config.newsletter_subheader || ''}
                onChange={e => setConfig({...config, newsletter_subheader: e.target.value})}
                className="w-full rounded-lg border border-stone-300 px-3 py-1.5 text-sm outline-none focus:border-stone-900"
              />
            </div>
          </div>
        </div>

        {/* Payment Providers */}
        <div>
          <h3 className="text-sm font-medium text-stone-700 mb-3 border-b pb-1">Payment Providers</h3>
          <ActivePaymentProviders 
            providers={config.payment_providers || []} 
            onChange={providers => setConfig({...config, payment_providers: providers})} 
          />
        </div>

        {/* Link Groups */}
        <div>
          <h3 className="text-sm font-medium text-stone-700 mb-3 border-b pb-1">Footer "About" Links</h3>
          <DraggableList 
            items={config.footer_about_links || []} 
            onChange={items => setConfig({...config, footer_about_links: items})} 
          />
        </div>

        <div>
          <h3 className="text-sm font-medium text-stone-700 mb-3 border-b pb-1">Footer "Connect" Links</h3>
          <DraggableList 
            items={config.footer_contact_links || []} 
            onChange={items => setConfig({...config, footer_contact_links: items})} 
          />
        </div>

        <div>
          <h3 className="text-sm font-medium text-stone-700 mb-3 border-b pb-1">Footer "Support" Links</h3>
          <DraggableList 
            items={config.footer_support_links || []} 
            onChange={items => setConfig({...config, footer_support_links: items})} 
          />
        </div>

        {status && (
          <div className={`flex items-start gap-2 rounded-lg p-3 text-sm ${status.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {status.type === 'success' ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> : <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />}
            {status.message}
          </div>
        )}

        <button type="submit" disabled={saving} className="flex items-center gap-2 rounded-lg bg-stone-900 px-4 py-2.5 font-medium text-white hover:bg-stone-700 disabled:opacity-60">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saving ? 'Saving…' : 'Save Layout Settings'}
        </button>
      </form>
    </div>
  )
}
