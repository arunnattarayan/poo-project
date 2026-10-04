import Link from 'next/link'
import { ArrowRight, Grid3X3, Leaf, Globe, Heart } from 'lucide-react'

export default function Hero({ config }) {
  return (
    <div className="bg-[#f9f8f4] text-black border-b border-black/10">
      <div className="flex flex-col md:flex-row w-full h-[600px] border-b border-black/10">
        {/* Left Image */}
        <div className="hidden md:block md:w-1/3 relative">
          <img src="https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800" alt="Hero Left" className="w-full h-full object-cover" />
        </div>
        {/* Middle Content */}
        <div className="w-full md:w-1/3 bg-[#181818] text-white flex flex-col justify-center items-center text-center p-8 relative">
          <h1 className="text-3xl lg:text-4xl font-serif font-bold tracking-tight leading-[1.2] mb-2">
            Wear Your Heritage.
          </h1>
          <div className="text-3xl lg:text-4xl font-serif text-[#dcae44] font-medium mb-6">
            Express Your Soul.
          </div>
          <p className="text-sm leading-relaxed text-white/50 max-w-sm mx-auto font-light mb-8">
            Discover premium apparel, meticulously crafted to honor cultural traditions and celebrate modern identity. Organic fabrics, meaningful designs.
          </p>
          <a 
            href="#products" 
            className="group inline-flex items-center justify-center gap-2 rounded-sm bg-[#dcae44] px-8 py-3 text-xs font-bold uppercase tracking-widest text-black transition hover:bg-[#c99d36]"
          >
            Explore the Collection <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </a>
        </div>
        {/* Right Image */}
        <div className="hidden md:block md:w-1/3 relative bg-stone-200">
          <img src="https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=800" alt="Hero Right" className="w-full h-full object-cover" />
        </div>
      </div>

      {/* Feature Highlights */}
      <div className="py-16">
        <div className="mx-auto max-w-5xl grid grid-cols-1 sm:grid-cols-3 gap-6 px-4">
          <div className="flex flex-col items-center gap-4 bg-[#fdfbf6] border border-[#d4af37]/30 p-8 rounded-md text-center shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center text-[#d4af37]">
              <Grid3X3 className="h-10 w-10" strokeWidth={1} />
            </div>
            <div>
              <h3 className="text-xs font-bold tracking-widest text-black uppercase mb-2">HERITAGE CRAFT</h3>
              <p className="text-xs text-black/60 leading-relaxed max-w-[200px] mx-auto">Traditional weaving met with modern cuts.</p>
            </div>
          </div>
          <div className="flex flex-col items-center gap-4 bg-[#fdfbf6] border border-[#d4af37]/30 p-8 rounded-md text-center shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center text-[#d4af37]">
              <Leaf className="h-10 w-10" strokeWidth={1} />
            </div>
            <div>
              <h3 className="text-xs font-bold tracking-widest text-black uppercase mb-2">ETHICAL & SUSTAINABLE</h3>
              <p className="text-xs text-black/60 leading-relaxed max-w-[200px] mx-auto">Organic, certified materials.</p>
            </div>
          </div>
          <div className="flex flex-col items-center gap-4 bg-[#fdfbf6] border border-[#d4af37]/30 p-8 rounded-md text-center shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center text-[#d4af37]">
              <Globe className="h-10 w-10" strokeWidth={1} />
            </div>
            <div>
              <h3 className="text-xs font-bold tracking-widest text-black uppercase mb-2">GLOBAL COMMUNITY</h3>
              <p className="text-xs text-black/60 leading-relaxed max-w-[200px] mx-auto">Supporting artisan communities.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
