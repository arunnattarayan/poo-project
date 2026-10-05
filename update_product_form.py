import re

with open('app/admin/products/page.jsx', 'r') as f:
    content = f.read()

# Add empty state fields
content = content.replace(
    "const EMPTY = { title: '', description: '', price: '', image_url: '', in_stock: true, is_active: true }",
    "const EMPTY = { title: '', description: '', price: '', image_url: '', in_stock: true, is_active: true, sku: '', category: '', tags: [], stock_quantity: 10 }"
)

# Update ProductForm component initial state
# It already uses ...initial, so we just need to add the fields to payload
payload_old = """
    const payload = {
      title: form.title.trim(),
      description: form.description?.trim() || null,
      price,
      images: form.images,
      image_url: form.images?.[0] || '', // Fallback for backward compatibility
      in_stock: form.in_stock,
      is_active: form.is_active,
    }
"""

payload_new = """
    const payload = {
      title: form.title.trim(),
      description: form.description?.trim() || null,
      price,
      images: form.images,
      image_url: form.images?.[0] || '', // Fallback for backward compatibility
      in_stock: form.in_stock,
      is_active: form.is_active,
      sku: form.sku?.trim() || null,
      category: form.category?.trim() || null,
      stock_quantity: parseInt(form.stock_quantity) || 0,
      tags: form.tags || [],
    }
"""

content = content.replace(payload_old.strip('\n'), payload_new.strip('\n'))

# Add fields to form UI
form_ui_target = """
          <div>
            <label className="mb-1 block text-sm font-medium text-stone-700">Price</label>
            <input value={form.price} onChange={set('price')} inputMode="decimal" required className={inputCls} />
          </div>
"""

form_ui_new = """
          <div>
            <label className="mb-1 block text-sm font-medium text-stone-700">Price</label>
            <input value={form.price} onChange={set('price')} inputMode="decimal" required className={inputCls} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-stone-700">SKU</label>
              <input value={form.sku || ''} onChange={set('sku')} className={inputCls} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-stone-700">Stock Quantity</label>
              <input type="number" value={form.stock_quantity} onChange={set('stock_quantity')} className={inputCls} min="0" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-stone-700">Category</label>
              <input value={form.category || ''} onChange={set('category')} className={inputCls} placeholder="e.g. T-Shirts" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-stone-700">Tags (comma separated)</label>
              <input value={(form.tags || []).join(', ')} onChange={(e) => setForm(f => ({...f, tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean)}))} className={inputCls} placeholder="summer, sale" />
            </div>
          </div>
"""

content = content.replace(form_ui_target.strip('\n'), form_ui_new.strip('\n'))

with open('app/admin/products/page.jsx', 'w') as f:
    f.write(content)
