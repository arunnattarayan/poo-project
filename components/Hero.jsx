import Link from 'next/link'
import { ArrowRight, Leaf, ShieldCheck, Truck, Zap } from 'lucide-react'

export default function Hero({ config }) {
  return (
    <div className="relative overflow-hidden bg-heritage-dark text-heritage-light border-b-4 border-heritage-accent">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20 mix-blend-overlay" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-heritage-accent/30 via-heritage-dark to-transparent opacity-80 pointer-events-none" />

      <div className="relative mx-auto max-w-6xl px-4 py-20 sm:py-28 lg:py-36">
        <div className="text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full border border-heritage-gold/30 bg-heritage-gold/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-heritage-gold mb-8">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-heritage-gold opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-heritage-gold"></span>
            </span>
            Premium Tamil Apparel
          </div>
          
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-serif font-bold tracking-tight text-white drop-shadow-lg">
            Wear Your Heritage. <br className="hidden sm:block" />
            <span className="text-heritage-gold italic font-light">Express Your Soul.</span>
          </h1>
          
          <p className="mt-8 text-lg md:text-xl leading-8 text-heritage-light/80 max-w-2xl mx-auto font-light">
            {config.store_tagline}. Crafted from premium combed cotton with high-definition spiritual and cultural prints. Discover comfort that speaks your language.
          </p>
          
          <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-6">
            <a 
              href="#products" 
              className="group flex w-full sm:w-auto items-center justify-center gap-2 rounded-none border border-heritage-gold bg-heritage-gold px-10 py-4 text-sm font-bold uppercase tracking-wider text-heritage-dark shadow-lg transition-all hover:bg-transparent hover:text-heritage-gold"
            >
              Shop Collection <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </a>
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="mt-24 border-t border-white/10 pt-12">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4 text-center">
            <div className="flex flex-col items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-heritage-light/5 text-heritage-gold ring-1 ring-heritage-gold/30">
                <Leaf className="h-6 w-6" />
              </div>
              <h3 className="text-sm font-semibold tracking-wide text-white uppercase">100% Premium Cotton</h3>
              <p className="text-xs text-heritage-light/60">Breathable & bio-washed</p>
            </div>
            <div className="flex flex-col items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-heritage-light/5 text-heritage-gold ring-1 ring-heritage-gold/30">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h3 className="text-sm font-semibold tracking-wide text-white uppercase">HD Quality Prints</h3>
              <p className="text-xs text-heritage-light/60">Fade & crack resistant</p>
            </div>
            <div className="flex flex-col items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-heritage-light/5 text-heritage-gold ring-1 ring-heritage-gold/30">
                <Zap className="h-6 w-6" />
              </div>
              <h3 className="text-sm font-semibold tracking-wide text-white uppercase">Direct Checkout</h3>
              <p className="text-xs text-heritage-light/60">1-click order checkout</p>
            </div>
            <div className="flex flex-col items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-heritage-light/5 text-heritage-gold ring-1 ring-heritage-gold/30">
                <Truck className="h-6 w-6" />
              </div>
              <h3 className="text-sm font-semibold tracking-wide text-white uppercase">Pan-India Delivery</h3>
              <p className="text-xs text-heritage-light/60">Fast & secure dispatch</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
