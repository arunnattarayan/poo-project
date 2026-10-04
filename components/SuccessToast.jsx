'use client'
import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { CheckCircle2, X } from 'lucide-react'

function ToastContent() {
  const searchParams = useSearchParams()
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (searchParams.get('success') === 'true') {
      setShow(true)
      
      const newUrl = window.location.pathname
      window.history.replaceState({}, document.title, newUrl)
      
      const t = setTimeout(() => setShow(false), 5000)
      return () => clearTimeout(t)
    }
  }, [searchParams])

  if (!show) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 flex max-w-sm items-start gap-3 rounded-none border border-heritage-gold/30 bg-heritage-dark p-4 shadow-xl animate-in slide-in-from-bottom-5">
      <CheckCircle2 className="h-5 w-5 shrink-0 text-heritage-gold mt-0.5" />
      <div>
        <h3 className="text-sm font-bold text-white uppercase tracking-wider">Order Confirmed!</h3>
        <p className="mt-1 text-sm text-heritage-light/80">Thank you! We have received your order and will process it shortly.</p>
      </div>
      <button onClick={() => setShow(false)} className="ml-2 text-heritage-light/50 hover:text-white transition">
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}

export default function SuccessToast() {
  return (
    <Suspense fallback={null}>
      <ToastContent />
    </Suspense>
  )
}
