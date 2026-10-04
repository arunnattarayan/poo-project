import { PackageOpen, Sparkles } from 'lucide-react'
import { supabasePublic } from '@/lib/supabase-public'
import { getStoreConfig } from '@/lib/store-config'
import { SITE_URL } from '@/lib/utils'
import ProductCard from '@/components/ProductCard'
import Hero from '@/components/Hero'

// Cache for 60s (ISR). Admin edits trigger an immediate revalidation anyway.
export const revalidate = 60

export async function generateMetadata() {
  const config = await getStoreConfig()
  return {
    title: `${config.store_name} | ${config.store_tagline}`,
    description: `Shop authentic Tamil and spiritual printed T-shirts at ${config.store_name}. Premium combed cotton, high-definition prints, and instant WhatsApp checkout.`,
    alternates: { canonical: SITE_URL },
    openGraph: {
      title: `${config.store_name} | ${config.store_tagline}`,
      description: `Premium Tamil and spiritual streetwear from ${config.store_name}. Wear your heritage with pride.`,
      url: SITE_URL,
      siteName: config.store_name,
      images: [
        {
          url: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=1200&q=80',
          width: 1200,
          height: 630,
        },
      ],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: config.store_name,
      description: config.store_tagline,
    },
  }
}

export default async function HomePage() {
  const [config, { data: products, error }] = await Promise.all([
    getStoreConfig(),
    supabasePublic
      .from('products')
      .select('id, title, price, image_url, in_stock, images')
      .eq('is_active', true)
      .order('created_at', { ascending: false }),
  ])

  return (
    <>
      <Hero config={config} />
      
      <div id="products" className="mx-auto max-w-6xl px-4 py-16 sm:py-24">
        <div className="mb-12 flex flex-col items-center text-center">
          <h2 className="text-3xl md:text-4xl font-serif font-bold tracking-tight text-black mb-4">
            Product Collection
          </h2>
          <div className="w-full flex justify-between items-center text-xs font-medium text-black/60 border-b border-black/10 pb-2">
            <span>≡ Collection ⌄</span>
            <span>Quick View ⌄</span>
          </div>
        </div>

        {error ? (
          <p className="rounded-xl bg-red-50 p-6 text-center text-red-700 ring-1 ring-red-100">
            We couldn&apos;t load products right now. Please refresh in a moment.
          </p>
        ) : !products?.length ? (
          <div className="flex flex-col items-center py-24 text-stone-500">
            <PackageOpen className="mb-4 h-12 w-12 opacity-50" />
            <p className="text-lg font-medium">New designs are coming soon.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} currency={config.currency_symbol} />
            ))}
          </div>
        )}
      </div>

      <div className="bg-[#f9f8f4] text-black py-24 border-t border-black/10">
        <div className="mx-auto max-w-6xl px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-serif font-bold tracking-widest text-black uppercase mb-16">
            THE HERITAGE SERIES
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex flex-col text-left">
              <img src="https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800" alt="Heritage 1" className="w-full aspect-square object-cover mb-4 opacity-90 hover:opacity-100 transition-opacity" />
              <img src="https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800" alt="Heritage 2" className="w-full aspect-square object-cover opacity-90 hover:opacity-100 transition-opacity" />
            </div>
            <div className="flex flex-col text-left justify-center px-4">
              <p className="text-[11px] text-black/70 leading-relaxed">The culture and inspire the cattains of them mature wite ihans cultorn colonias and orleones with convertiseat recsilleftons and constultitess volitions and consensitonate values of the cultures.</p>
            </div>
            <div className="flex flex-col text-left">
              <img src="https://images.unsplash.com/photo-1503342394128-c104d54dba01?w=800" alt="Heritage 3" className="w-full aspect-square object-cover mb-4 opacity-90 hover:opacity-100 transition-opacity" />
            </div>
            <div className="flex flex-col text-left justify-center px-4">
              <p className="text-[11px] text-black/70 leading-relaxed mb-6">The colonias abened the converstis put onfime fmr artisans ofti them the nubiliy of conversteat recsilleftons consense, contertane theire communitas, values and cultures consitate centato and curitities.</p>
              <p className="text-[11px] text-black/70 leading-relaxed">Deliivver traterin premium designer ctirolinottenss and mediuro dcolers wite and meethecka voninan the artizan wedkmasurimeo. Orgaoie ficons communities deagits.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-[#fdfbf6] border-t border-black/10 text-black py-16">
        <div className="mx-auto max-w-4xl px-4 text-left flex flex-col md:flex-row justify-between items-start md:items-center">
          <div className="mb-6 md:mb-0">
            <h2 className="text-sm font-bold tracking-widest uppercase mb-1">JOIN OUR COMMUNITY</h2>
            <p className="text-xs text-black/60">for exclusive issues and early access.</p>
          </div>
          <form className="flex w-full max-w-sm gap-2" action="#">
            <input type="email" placeholder="Email" className="flex-1 bg-transparent border border-black/20 px-4 py-2 text-xs focus:outline-none focus:border-black rounded-sm" />
            <button type="submit" className="bg-[#b39556] text-white px-6 py-2 text-xs font-bold tracking-widest uppercase hover:bg-black transition-colors rounded-sm">Subscribe</button>
          </form>
        </div>
      </div>
    </>
  )
}
