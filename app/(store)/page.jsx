import { Suspense } from 'react'
import { PackageOpen, Sparkles } from 'lucide-react'
import { supabasePublic } from '@/lib/supabase-public'
import { getStoreConfig } from '@/lib/store-config'
import { SITE_URL } from '@/lib/utils'
import ProductCard from '@/components/ProductCard'
import Hero from '@/components/Hero'
import ProductFilters from '@/components/ProductFilters'
import Pagination from '@/components/Pagination'

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

  const [config, { data: products, count, error }] = await Promise.all([
    getStoreConfig(),
    query,
  ]);

  const totalPages = count ? Math.ceil(count / limit) : 0;

  return (
    <>
      <Hero config={config} />
      
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

      <div className="bg-[#f9f8f4] text-black py-24 border-t border-black/10">
        <div className="mx-auto max-w-6xl px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-serif font-bold tracking-widest text-black uppercase mb-16">
            THE HERITAGE SERIES
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            <div className="grid grid-cols-2 gap-2">
              <img src="https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400" alt="Heritage 1" className="w-full h-full object-cover opacity-90 hover:opacity-100 transition-opacity" />
              <img src="https://images.unsplash.com/photo-1506634572416-48cdfe530110?w=400" alt="Heritage 2" className="w-full h-full object-cover opacity-90 hover:opacity-100 transition-opacity" />
            </div>
            <div className="flex flex-col text-left justify-center">
              <p className="text-[11px] text-black/70 leading-relaxed">The culture and inspire the cattains of them mature wite ihans cultorn colonias and orleones with convertiseat recsilleftons and constultitess volitions and consensitonate values of the cultures.</p>
            </div>
            <div className="flex flex-col text-left">
              <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800" alt="Heritage 3" className="w-full h-full object-cover opacity-90 hover:opacity-100 transition-opacity" />
            </div>
            <div className="flex flex-col text-left justify-center">
              <p className="text-[11px] text-black/70 leading-relaxed">The colonias abened the converstis put onfime fmr artisans ofti them the nubiliy of conversteat recsilleftons consense, contertane theire communitas, values and cultures consitate centato and curitities.</p>
            </div>
            <div className="flex flex-col text-left justify-center">
              <p className="text-[11px] text-black/70 leading-relaxed">Deliivver traterin premium designer ctirolinottenss and mediuro dcolers wite and meethecka voninan the artizan wedkmasurimeo. Orgaoie ficons communities deagits.</p>
            </div>
          </div>
        </div>
      </div>

    </>
  )
}
