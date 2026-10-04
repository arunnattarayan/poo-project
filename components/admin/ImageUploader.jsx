'use client'

import { useState, useRef } from 'react'
import { Upload, X, Loader2, GripVertical } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import ProductImage from '@/components/ProductImage'

export default function ImageUploader({ images = [], onChange }) {
  const supabase = createClient()
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef(null)

  async function handleFiles(e) {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    
    setUploading(true)
    const newUrls = []
    
    for (const file of files) {
      const ext = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${ext}`
      
      const { data, error } = await supabase.storage
        .from('product-images')
        .upload(fileName, file)
        
      if (error) {
        alert(`Failed to upload ${file.name}: ${error.message}`)
        continue
      }
      
      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(fileName)
        
      newUrls.push(publicUrl)
    }
    
    if (newUrls.length > 0) {
      onChange([...images, ...newUrls])
    }
    
    setUploading(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function removeImage(index) {
    const next = [...images]
    next.splice(index, 1)
    onChange(next)
  }

  function moveImage(index, dir) {
    if (index + dir < 0 || index + dir >= images.length) return
    const next = [...images]
    const temp = next[index]
    next[index] = next[index + dir]
    next[index + dir] = temp
    onChange(next)
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {images.map((url, i) => (
          <div key={url} className="group relative aspect-square overflow-hidden rounded-lg ring-1 ring-stone-200">
            <ProductImage src={url} alt={`Preview ${i}`} className="h-full w-full object-cover" />
            
            <div className="absolute inset-0 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100 flex flex-col justify-between p-1">
              <div className="flex justify-between">
                {i > 0 ? (
                  <button type="button" onClick={() => moveImage(i, -1)} className="rounded bg-white/20 p-1 text-white hover:bg-white/40">&larr;</button>
                ) : <span />}
                {i < images.length - 1 ? (
                  <button type="button" onClick={() => moveImage(i, 1)} className="rounded bg-white/20 p-1 text-white hover:bg-white/40">&rarr;</button>
                ) : <span />}
              </div>
              <button 
                type="button" 
                onClick={() => removeImage(i)}
                className="self-center rounded-full bg-red-500 p-1.5 text-white hover:bg-red-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            
            {i === 0 && (
              <span className="absolute bottom-1 left-1 rounded bg-stone-900 px-1.5 py-0.5 text-[10px] font-medium text-white">Cover</span>
            )}
          </div>
        ))}

        {images.length < 10 && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex aspect-square flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-stone-300 bg-stone-50 text-stone-500 hover:border-stone-400 hover:bg-stone-100 disabled:opacity-50"
          >
            {uploading ? <Loader2 className="h-6 w-6 animate-spin" /> : <Upload className="h-6 w-6" />}
            <span className="text-xs font-medium">{uploading ? 'Uploading...' : 'Add image'}</span>
          </button>
        )}
      </div>
      
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFiles} 
        accept="image/jpeg,image/png,image/webp,image/avif,image/gif" 
        multiple 
        className="hidden" 
      />
      <p className="text-xs text-stone-500">First image will be used as the cover. Max 10 images.</p>
    </div>
  )
}
