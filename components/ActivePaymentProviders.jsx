'use client'
import { useState } from 'react'
import { Plus, X } from 'lucide-react'

export default function ActivePaymentProviders({ providers, onChange }) {
  const [newVal, setNewVal] = useState('')
  
  const addProvider = () => {
    if (newVal.trim() && !providers.includes(newVal.trim().toLowerCase())) {
      onChange([...providers, newVal.trim().toLowerCase()])
      setNewVal('')
    }
  }

  const removeProvider = (p) => {
    onChange(providers.filter(item => item !== p))
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-3">
        {providers.map(p => (
          <span key={p} className="flex items-center gap-1 bg-stone-100 border border-stone-200 px-2 py-1 rounded text-xs font-medium uppercase">
            {p}
            <button type="button" onClick={() => removeProvider(p)} className="text-stone-400 hover:text-red-500">
              <X size={14} />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2 max-w-xs">
        <input 
          type="text" 
          value={newVal} 
          onChange={e => setNewVal(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addProvider())}
          placeholder="e.g. visa, mastercard" 
          className="flex-1 rounded border border-stone-300 px-2 py-1 text-sm outline-none focus:border-stone-900"
        />
        <button type="button" onClick={addProvider} className="bg-stone-200 text-stone-700 px-3 py-1 rounded hover:bg-stone-300 text-sm">
          Add
        </button>
      </div>
    </div>
  )
}
