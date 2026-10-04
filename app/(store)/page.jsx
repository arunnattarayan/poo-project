import { PackageOpen } from 'lucide-react'
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
        <div className="mb-12 flex flex-col items-center text-center sm:flex-row sm:items-end sm:justify-between sm:text-left border-b border-heritage-gold/20 pb-6">
          <div>
            <h2 className="text-3xl font-serif font-bold tracking-tight text-heritage-dark sm:text-4xl">Our Collection</h2>
            <p className="mt-2 text-sm text-heritage-dark/60 uppercase tracking-widest font-semibold">
              Direct checkout available on all items • Fast & Secure Delivery
            </p>
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
    </>
  )
}
