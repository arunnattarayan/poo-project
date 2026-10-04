import Link from 'next/link'

export default function ProductNotFound() {
  return (
    <div className="mx-auto max-w-md px-4 py-24 text-center">
      <h1 className="text-2xl font-semibold">Product not found</h1>
      <p className="mt-2 text-stone-600">This item may have been removed or is no longer available.</p>
      <Link href="/" className="mt-6 inline-block rounded-lg bg-stone-900 px-4 py-2 text-white hover:bg-stone-700">
        Browse products
      </Link>
    </div>
  )
}
