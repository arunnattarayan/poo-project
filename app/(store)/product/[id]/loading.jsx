export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl animate-pulse px-4 py-10">
      <div className="mb-6 h-4 w-40 rounded bg-stone-200" />
      <div className="grid gap-8 md:grid-cols-2 md:gap-12">
        <div className="aspect-square rounded-2xl bg-stone-200" />
        <div className="space-y-4">
          <div className="h-8 w-3/4 rounded bg-stone-200" />
          <div className="h-7 w-24 rounded bg-stone-200" />
          <div className="h-4 w-full rounded bg-stone-200" />
          <div className="h-4 w-5/6 rounded bg-stone-200" />
          <div className="mt-8 h-12 w-full rounded-lg bg-stone-200" />
        </div>
      </div>
    </div>
  )
}
