import 'server-only'
import { cache } from 'react'
import { supabasePublic } from './supabase-public'
import { DEFAULT_CONFIG } from './utils'

/** Reads `store_config` into a { key: value } map, falling back to defaults. Deduped per request. */
export const getStoreConfig = cache(async () => {
  const { data, error } = await supabasePublic.from('store_config').select('key, value')
  if (error) {
    console.error('Failed to load store_config:', error.message)
    return { ...DEFAULT_CONFIG }
  }
  return { ...DEFAULT_CONFIG, ...Object.fromEntries(data.map((r) => [r.key, r.value])) }
})

export const getStoreConfigurations = cache(async () => {
  const { data, error } = await supabasePublic.from('store_configurations').select('*').limit(1).single()
  if (error) {
    console.error('Failed to load store_configurations:', error.message)
    return {
      social_urls: { facebook: '', twitter: '', instagram: '', pinterest: '' },
      show_floating_social_bar: true,
      show_footer_social_icons: true,
      newsletter_header: 'JOIN OUR COMMUNITY',
      newsletter_subheader: 'Get early access to our collections.',
      payment_providers: ['visa', 'mastercard', 'amex', 'paypal'],
      footer_about_links: [{label:"Our Story",url:"#"},{label:"Ethical Practices",url:"#"}],
      footer_contact_links: [{label:"Contact",url:"#"},{label:"Press",url:"#"},{label:"Wholesale",url:"#"}],
      footer_support_links: [{label:"Size Guide",url:"#"},{label:"Shipping & Returns",url:"#"},{label:"FAQ",url:"#"}]
    }
  }
  return data
})
