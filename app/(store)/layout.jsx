import { getStoreConfig } from '@/lib/store-config'
import ConfigProvider from '@/components/ConfigProvider'
import Header from '@/components/Header'
import CartDrawer from '@/components/CartDrawer'
import SuccessToast from '@/components/SuccessToast'

export default async function StoreLayout({ children }) {
  const config = await getStoreConfig()

  let footerAbout = [], footerConnect = [], footerSupport = []
  try { footerAbout = JSON.parse(config.footer_about || '[]') } catch(e) {}
  try { footerConnect = JSON.parse(config.footer_connect || '[]') } catch(e) {}
  try { footerSupport = JSON.parse(config.footer_support || '[]') } catch(e) {}

  let logoUrl = config.store_logo
  try {
    const { supabasePublic } = await import('@/lib/supabase-public')
    const { data } = await supabasePublic.from('logos').select('image_url').eq('is_active', true).limit(1).single()
    if (data?.image_url) logoUrl = data.image_url
  } catch (e) {}

  return (
    <ConfigProvider config={{ ...config, store_logo: logoUrl }}>
      <Header />
      <main className="min-h-[calc(100vh-8rem)] bg-[#fdfbf6] text-black">{children}</main>
      <footer className="border-t border-black/10 pt-16 pb-8 text-sm text-black/70 bg-[#f9f8f4]">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-8 mb-12">
            <div className="col-span-2">
              <div className="flex flex-col">
                {config.store_logo ? (
                  <img src={config.store_logo} alt={config.store_name} className="h-10 w-auto object-contain mb-2" />
                ) : (
                  <>
                    <span className="text-4xl font-serif text-[#d4af37] mb-1">{config.store_name || 'NORRAI'}</span>
                    <span className="text-xs tracking-[0.3em] uppercase font-sans text-black/70">{config.store_tagline || 'Clothing'}</span>
                  </>
                )}
              </div>
            </div>
            <div>
              <h4 className="font-bold text-black mb-4 uppercase tracking-widest text-xs">About</h4>
              <ul className="space-y-3 text-xs">
                {footerAbout.map((link, i) => (
                  <li key={i}><a href={link.url} className="hover:text-[#d4af37]">{link.label}</a></li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-black mb-4 uppercase tracking-widest text-xs">Connect</h4>
              <ul className="space-y-3 text-xs">
                {footerConnect.map((link, i) => (
                  <li key={i}><a href={link.url} className="hover:text-[#d4af37]">{link.label}</a></li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-black mb-4 uppercase tracking-widest text-xs">Support</h4>
              <ul className="space-y-3 text-xs">
                {footerSupport.map((link, i) => (
                  <li key={i}><a href={link.url} className="hover:text-[#d4af37]">{link.label}</a></li>
                ))}
              </ul>
            </div>
          </div>
          <div className="flex flex-col md:flex-row justify-between items-center border-t border-black/10 pt-6 text-[11px]">
            <p>{config.footer_copyright || `© ${new Date().getFullYear()} ${config.store_name}. All rights reserved.`}</p>
            <div className="flex gap-4 mt-4 md:mt-0">
              <button className="flex items-center gap-1 hover:text-[#d4af37]">USA <span>▼</span></button>
              <button className="flex items-center gap-1 hover:text-[#d4af37]">EUR <span>▼</span></button>
            </div>
          </div>
        </div>
      </footer>
      <CartDrawer />
      <SuccessToast />
    </ConfigProvider>
  )
}
