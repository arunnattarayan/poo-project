'use client'

export default function StoreError({ error, reset }) {
  return (
    <div className="mx-auto max-w-md px-4 py-24 text-center">
      <h1 className="text-2xl font-semibold">Something went wrong</h1>
      <p className="mt-2 text-stone-600">We couldn&apos;t load this page. Please try again.</p>
      {process.env.NODE_ENV === 'development' && <p className="mt-2 text-xs text-red-600">{error?.message}</p>}
      <button onClick={reset} className="mt-6 rounded-lg bg-stone-900 px-4 py-2 text-white hover:bg-stone-700">
        Try again
      </button>
    </div>
  )
}
