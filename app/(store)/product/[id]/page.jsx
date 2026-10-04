import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, CheckCircle2, XCircle, MessageCircle } from 'lucide-react'
import { supabasePublic } from '@/lib/supabase-public'
import { getStoreConfig } from '@/lib/store-config'
import { formatPrice, UUID_RE, getProductImages, SITE_URL, truncate } from '@/lib/utils'
import AddToCartButton from '@/components/AddToCartButton'
import ImageGallery from '@/components/ImageGallery'

export const revalidate = 60

async function getProduct(id) {
  if (!UUID_RE.test(id)) return null
  const { data, error } = await supabasePublic
    .from('products')
    .select('id, title, description, price, image_url, images, in_stock')
    .eq('id', id)
    .eq('is_active', true)
    .maybeSingle()
  if (error) throw new Error(error.message)
  return data
}

export async function generateMetadata({ params }) {
  const { id } = await params
  const [product, config] = await Promise.all([
    getProduct(id).catch(() => null),
    getStoreConfig()
  ])
  
  if (!product) return { title: 'Product not found' }
  
  const desc = truncate(product.description || config.store_tagline)
  const images = getProductImages(product)
  const url = `${SITE_URL}/product/${id}`
  
  return {
    title: product.title,
    description: desc,
    alternates: { canonical: url },
    openGraph: {
      title: product.title,
      description: desc,
      url,
      images: images.map(img => ({ url: img, width: 800, height: 800 })),
      type: 'website',
      siteName: config.store_name,
    },
    twitter: {
      card: 'summary_large_image',
      title: product.title,
      description: desc,
      images: images.length ? [images[0]] : [],
    },
  }
}

export default async function ProductPage({ params }) {
  const { id } = await params
  const [product, config] = await Promise.all([getProduct(id), getStoreConfig()])
  if (!product) notFound()

  const images = getProductImages(product)

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:py-10">
      <Link href="/#products" className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-stone-500 transition-colors hover:text-stone-900">
        <ArrowLeft className="h-4 w-4" /> Back to all products
      </Link>

      <div className="grid gap-8 md:grid-cols-2 lg:gap-12 items-start">
        <ImageGallery images={images} title={product.title} />

        <div className="flex flex-col">
          <h1 className="text-2xl font-bold sm:text-3xl">{product.title}</h1>
          <p className="mt-3 text-2xl font-semibold">{formatPrice(product.price, config.currency_symbol)}</p>

          <div className="mt-3">
            {product.in_stock ? (
              <span className="inline-flex items-center gap-1 text-sm font-medium text-green-700">
                <CheckCircle2 className="h-4 w-4" /> In stock
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-sm font-medium text-red-600">
                <XCircle className="h-4 w-4" /> Out of stock
              </span>
            )}
          </div>

          {product.description && (
            <p className="mt-6 whitespace-pre-line leading-relaxed text-stone-700">{product.description}</p>
          )}

          <div className="mt-8">
            <AddToCartButton product={product} />
          </div>

          <p className="mt-6 flex items-start gap-2 rounded-lg bg-stone-100 p-3 text-sm text-stone-600">
            <MessageCircle className="mt-0.5 h-4 w-4 shrink-0" />
            Checkout happens on WhatsApp. Delivery fee: {formatPrice(config.delivery_fee, config.currency_symbol)}.
          </p>
        </div>
      </div>
    </div>
  )
}
