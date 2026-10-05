'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Search } from 'lucide-react'
import { useState, useEffect } from 'react'

export default function ProductFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const currentQ = searchParams.get('q') || ''
  const currentSort = searchParams.get('sort') || 'newest'

  const [searchQuery, setSearchQuery] = useState(currentQ)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (!isMounted) return
    const timeoutId = setTimeout(() => {
      if (searchQuery !== currentQ) {
        updateParams(searchQuery, currentSort)
      }
    }, 500)
    return () => clearTimeout(timeoutId)
  }, [searchQuery, currentQ, currentSort, isMounted])

  const updateParams = (q, sort) => {
    const params = new URLSearchParams()
    if (q) params.set('q', q)
    if (sort && sort !== 'newest') params.set('sort', sort)
    params.set('page', '1') // reset to page 1 on filter change
    
    router.push(`/?${params.toString()}#products`, { scroll: false })
  }

  const handleSortChange = (e) => {
    const newSort = e.target.value
    updateParams(searchQuery, newSort)
  }

  return (
    <div className="w-full flex flex-col sm:flex-row justify-between items-center gap-4 mb-8">
      <div className="relative w-full sm:max-w-xs">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <Search className="h-4 w-4 text-gray-400" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search products..."
          className="block w-full rounded-md border border-gray-300 py-2 pl-10 pr-3 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-black focus:border-black sm:text-sm bg-transparent"
        />
      </div>

      <div className="w-full sm:w-auto">
        <select
          value={currentSort}
          onChange={handleSortChange}
          className="block w-full rounded-md border border-gray-300 py-2 pl-3 pr-10 text-gray-900 focus:outline-none focus:ring-1 focus:ring-black focus:border-black sm:text-sm bg-transparent"
        >
          <option value="newest">Newest Arrivals</option>
          <option value="price-asc">Price: Low to High</option>
          <option value="price-desc">Price: High to Low</option>
          <option value="az">Alphabetically: A-Z</option>
          <option value="za">Alphabetically: Z-A</option>
        </select>
      </div>
    </div>
  )
}
