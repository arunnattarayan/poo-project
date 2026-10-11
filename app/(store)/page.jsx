import { Suspense } from 'react'
import { PackageOpen, Sparkles } from 'lucide-react'
import { supabasePublic } from '@/lib/supabase-public'
import { getStoreConfig } from '@/lib/store-config'
import { SITE_URL } from '@/lib/utils'
import ProductCard from '@/components/ProductCard'
import Hero from '@/components/Hero'
import ProductFilters from '@/components/ProductFilters'
import Pagination from '@/components/Pagination'

/**
 * Eligible hero slides. Uses the cookie-less anon client so a logged-in admin's
 * session can never surface drafts, and filters explicitly (RLS is the backstop).
 * Never throws — on any failure the static banner is shown.
 */
async function getHeroSlides() {
  try {
    const now = new Date().toISOString()
    const { data, error } = await supabasePublic
      .from('homepage_hero_slides')
      .select('id, title, subtitle, image_url, mobile_image_url, image_alt, offer_badge, button_text, button_url, text_alignment, text_position, overlay_opacity')
      .eq('status', 'published')
      .or(`starts_at.is.null,starts_at.lte.${now}`)
      .or(`ends_at.is.null,ends_at.gt.${now}`)
      .not('image_url', 'is', null)
      .order('display_order', { ascending: true })
      .limit(10)
    if (error) throw error
    return data ?? []
  } catch (err) {
    console.error('[hero] failed to load slides:', err?.message || err)
    return []
  }
}

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

export default async function HomePage(props) {
  const searchParams = await props.searchParams;
  const q = searchParams?.q || '';
  const sort = searchParams?.sort || 'newest';
  const page = parseInt(searchParams?.page || '1', 10);
  const limit = 8;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabasePublic
    .from('products')
    .select('id, title, price, image_url, in_stock, images', { count: 'exact' })
    .eq('is_active', true);

  if (q) {
    query = query.ilike('title', `%${q}%`);
  }

  if (sort === 'price-asc') {
    query = query.order('price', { ascending: true });
  } else if (sort === 'price-desc') {
    query = query.order('price', { ascending: false });
  } else if (sort === 'az') {
    query = query.order('title', { ascending: true });
  } else if (sort === 'za') {
    query = query.order('title', { ascending: false });
  } else {
    query = query.order('created_at', { ascending: false });
  }

  query = query.range(from, to);

  const [config, { data: products, count, error }, heroSlides] = await Promise.all([
    getStoreConfig(),
    query,
    getHeroSlides(),
  ]);

  const totalPages = count ? Math.ceil(count / limit) : 0;

  return (
    <>
      <Hero config={config} slides={heroSlides || []} />
      
      <div id="products" className="mx-auto max-w-6xl px-4 py-16 sm:py-24">
        <div className="mb-8 flex flex-col items-center text-center">
          <h2 className="text-3xl md:text-4xl font-serif font-bold tracking-tight text-black mx-auto">
            Product Collection
          </h2>
        </div>

        <Suspense fallback={<div className="h-10 w-full mb-8 animate-pulse bg-gray-100 rounded-md"></div>}>
          <ProductFilters />
        </Suspense>

        {error ? (
          <p className="rounded-xl bg-red-50 p-6 text-center text-red-700 ring-1 ring-red-100">
            We couldn&apos;t load products right now. Please refresh in a moment.
          </p>
        ) : !products?.length ? (
          <div className="flex flex-col items-center py-24 text-stone-500">
            <PackageOpen className="mb-4 h-12 w-12 opacity-50" />
            <p className="text-lg font-medium">No products found.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} currency={config.currency_symbol} />
              ))}
            </div>

            <Suspense fallback={<div className="mt-12 h-10 w-full animate-pulse bg-gray-100 rounded-md"></div>}>
              <Pagination totalPages={totalPages} currentPage={page} />
            </Suspense>
          </>
        )}
      </div>

      <div className="bg-white py-24 border-t border-stone-200">
        <div className="mx-auto max-w-6xl px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="relative aspect-[4/5] md:aspect-auto md:h-[600px] w-full overflow-hidden rounded-md">
              <img 
                src="https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=1200" 
                alt="The Heritage Series Lifestyle" 
                className="w-full h-full object-cover object-center"
              />
            </div>
            
            <div className="flex flex-col text-left justify-center md:pl-8">
              <span className="text-xs tracking-widest uppercase text-amber-700 mb-4 block">Exclusive Collection</span>
              <h2 className="font-serif text-3xl md:text-4xl text-stone-900 mb-6 leading-tight">
                The Heritage Series
              </h2>
              <p className="text-stone-600 leading-relaxed mb-6">
                Rooted in centuries of artisan tradition, this collection bridges classic weaving techniques with contemporary streetwear aesthetics. Each motif tells a story of cultural legacy, brought to life through organic fabrics and meticulous craftsmanship.
              </p>
              <a href="#products" className="inline-flex items-center text-sm font-bold tracking-widest uppercase text-stone-900 hover:text-amber-700 transition-colors group w-fit">
                Explore the Series &rarr;
              </a>
            </div>
          </div>
        </div>
      </div>

    </>
  )
}
