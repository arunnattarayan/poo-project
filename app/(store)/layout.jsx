import { getStoreConfig, getStoreConfigurations } from '@/lib/store-config'
import ConfigProvider from '@/components/ConfigProvider'
import Header from '@/components/Header'
import CartDrawer from '@/components/CartDrawer'
import SuccessToast from '@/components/SuccessToast'
import { Facebook, Twitter, Instagram, Youtube, Pin } from 'lucide-react'

const IconMap = {
  facebook: Facebook,
  twitter: Twitter,
  instagram: Instagram,
  youtube: Youtube,
  pinterest: Pin
}

export default async function StoreLayout({ children }) {
  const config = await getStoreConfig()
  const dbConfig = await getStoreConfigurations()

  // Parse JSONB fields (Supabase returns them as objects/arrays already if JSONB, but let's be safe)
  let footerAbout = dbConfig?.footer_about_links || []
  let footerContact = dbConfig?.footer_contact_links || []
  let footerSupport = dbConfig?.footer_support_links || []
  if (typeof footerAbout === 'string') try { footerAbout = JSON.parse(footerAbout) } catch(e) {}
  if (typeof footerContact === 'string') try { footerContact = JSON.parse(footerContact) } catch(e) {}
  if (typeof footerSupport === 'string') try { footerSupport = JSON.parse(footerSupport) } catch(e) {}

  let logoUrl = config.store_logo
  try {
    const { supabasePublic } = await import('@/lib/supabase-public')
    const { data } = await supabasePublic.from('logos').select('image_url').eq('is_active', true).limit(1).single()
    if (data?.image_url) logoUrl = data.image_url
  } catch (e) {}

  const socialUrls = dbConfig?.social_urls || {}
  const activeSocials = Object.entries(socialUrls).filter(([_, url]) => url && url.trim() !== '')

  return (
    <ConfigProvider config={{ ...config, store_logo: logoUrl }}>
      <Header />
      
      {dbConfig?.show_floating_social_bar && activeSocials.length > 0 && (
        <div className="fixed right-0 top-1/2 transform -translate-y-1/2 z-50 flex flex-col gap-2 bg-white/80 backdrop-blur-sm p-2 rounded-l-md shadow-sm border border-r-0 border-black/10">
          {activeSocials.map(([platform, url]) => {
            const Icon = IconMap[platform.toLowerCase()]
            if (!Icon) return null
            return (
              <a key={platform} href={url} target="_blank" rel="noreferrer" className="text-black/60 hover:text-[#d4af37] transition-colors p-2">
                <Icon size={18} />
              </a>
            )
          })}
        </div>
      )}

      <main className="min-h-[calc(100vh-8rem)] bg-[#fdfbf6] text-black">{children}</main>
      <footer className="border-t border-black/10 pt-16 pb-8 text-sm text-black/70 bg-[#fdfbf6]">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-8 mb-12">
            <div className="col-span-2 md:col-span-2 flex flex-col">
              <div className="mb-6">
                <h4 className="font-bold text-black mb-1 uppercase tracking-widest text-xs">{dbConfig?.newsletter_header || 'JOIN OUR COMMUNITY'}</h4>
                <p className="text-xs text-black/60 mb-4">{dbConfig?.newsletter_subheader || 'Get early access to our collections.'}</p>
                <form className="flex w-full max-w-sm gap-2 mb-4" action="#">
                  <input type="email" placeholder="Email" className="flex-1 bg-transparent border border-black/20 px-4 py-2 text-xs focus:outline-none focus:border-black rounded-sm" />
                  <button type="submit" className="bg-[#b39556] text-white px-6 py-2 text-xs font-bold tracking-widest uppercase hover:bg-black transition-colors rounded-sm">Subscribe</button>
                </form>
                <div className="flex items-center gap-2 text-black/40 flex-wrap">
                  {dbConfig?.payment_providers?.map((provider) => (
                    <span key={provider} className="text-[10px] font-bold border border-black/20 px-1.5 py-0.5 rounded-sm uppercase">
                      {provider}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="flex flex-col">
              <h4 className="font-bold text-black mb-4 uppercase tracking-widest text-xs">About</h4>
              <ul className="space-y-3 text-xs">
                {footerAbout.map((link, i) => (
                  <li key={i}><a href={link.url} className="hover:text-[#d4af37]">{link.label}</a></li>
                ))}
              </ul>
            </div>
            
            <div className="flex flex-col">
              <h4 className="font-bold text-black mb-4 uppercase tracking-widest text-xs">Connect</h4>
              <ul className="space-y-3 text-xs">
                {footerContact.map((link, i) => (
                  <li key={i}><a href={link.url} className="hover:text-[#d4af37]">{link.label}</a></li>
                ))}
              </ul>
            </div>
            
            <div className="flex flex-col">
              {dbConfig?.show_footer_social_icons && (
                <div className="flex gap-3 mb-6 text-black/60">
                  {Object.entries(socialUrls).map(([platform, url]) => {
                    const Icon = IconMap[platform.toLowerCase()]
                    if (!Icon || !url || url.trim() === '') return null
                    return (
                      <a key={platform} href={url} target="_blank" rel="noreferrer" className="w-6 h-6 rounded-full border border-black/30 flex items-center justify-center hover:text-[#d4af37] hover:border-[#d4af37] transition-colors">
                        <Icon size={12} />
                      </a>
                    )
                  })}
                </div>
              )}
              <h4 className={`font-bold text-black ${dbConfig?.show_footer_social_icons ? 'mb-4' : 'mb-4'} uppercase tracking-widest text-xs`}>Support</h4>
              <ul className="space-y-3 text-xs">
                {footerSupport.map((link, i) => (
                  <li key={i}><a href={link.url} className="hover:text-[#d4af37]">{link.label}</a></li>
                ))}
              </ul>
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row justify-between items-center border-t border-black/10 pt-6 text-[11px]">
            <div className="flex items-center gap-2">
              {config.store_logo ? (
                <img src={config.store_logo} alt={config.store_name} className="h-4 w-auto object-contain grayscale opacity-60" />
              ) : (
                <span className="font-serif font-bold text-black/60">©</span>
              )}
              <p className="text-black/60">{config.footer_copyright || `${config.store_name} Clothing. All rights reserved.`}</p>
            </div>
            <div className="flex gap-4 mt-4 md:mt-0 text-black/60 font-medium">
              <button className="flex items-center gap-1 hover:text-[#d4af37]">SDV <span>⌄</span></button>
              <button className="flex items-center gap-1 hover:text-[#d4af37]">CHF <span>⌄</span></button>
            </div>
          </div>
        </div>
      </footer>
      <CartDrawer />
      <SuccessToast />
    </ConfigProvider>
  )
}
