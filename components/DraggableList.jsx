'use client'
import { useState, useRef } from 'react'
import { GripVertical, Trash2, Plus } from 'lucide-react'

export default function DraggableList({ items, onChange, itemTemplate }) {
  const [draggedIdx, setDraggedIdx] = useState(null)
  
  const handleDragStart = (e, index) => {
    setDraggedIdx(index)
    e.dataTransfer.effectAllowed = 'move'
    // Hack to make it look nicer
    setTimeout(() => {
      e.target.style.opacity = '0.5'
    }, 0)
  }
  
  const handleDragEnd = (e) => {
    setDraggedIdx(null)
    e.target.style.opacity = '1'
  }
  
  const handleDragOver = (e, index) => {
    e.preventDefault()
    if (draggedIdx === null || draggedIdx === index) return
    
    const newItems = [...items]
    const draggedItem = newItems[draggedIdx]
    
    newItems.splice(draggedIdx, 1)
    newItems.splice(index, 0, draggedItem)
    
    onChange(newItems)
    setDraggedIdx(index)
  }

  return (
    <div className="space-y-2">
      {items.map((item, index) => (
        <div
          key={index}
          draggable
          onDragStart={(e) => handleDragStart(e, index)}
          onDragEnd={handleDragEnd}
          onDragOver={(e) => handleDragOver(e, index)}
          className="flex items-center gap-3 bg-stone-50 border border-stone-200 p-2 rounded-md transition-all cursor-move hover:bg-stone-100"
        >
          <GripVertical className="text-stone-400 shrink-0" size={18} />
          <div className="flex-1 flex gap-2">
            <input
              type="text"
              placeholder="Label"
              value={item.label}
              onChange={(e) => {
                const newItems = [...items]
                newItems[index] = { ...newItems[index], label: e.target.value }
                onChange(newItems)
              }}
              className="flex-1 rounded border border-stone-300 px-2 py-1 text-sm outline-none focus:border-stone-900 cursor-text"
            />
            <input
              type="text"
              placeholder="URL"
              value={item.url}
              onChange={(e) => {
                const newItems = [...items]
                newItems[index] = { ...newItems[index], url: e.target.value }
                onChange(newItems)
              }}
              className="flex-1 rounded border border-stone-300 px-2 py-1 text-sm outline-none focus:border-stone-900 cursor-text"
            />
          </div>
          <button
            type="button"
            onClick={() => {
              const newItems = items.filter((_, i) => i !== index)
              onChange(newItems)
            }}
            className="text-red-500 hover:bg-red-50 p-1 rounded transition-colors"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...items, { label: '', url: '' }])}
        className="flex items-center gap-1 text-sm text-[#b39556] hover:text-[#917540] font-medium mt-2"
      >
        <Plus size={16} /> Add Link
      </button>
    </div>
  )
}
