import re

with open('app/admin/products/page.jsx', 'r') as f:
    content = f.read()

# 1. Insert Bulk Action Toolbar right before the Search bar div
search_bar_div = '<div className="mb-6 flex flex-col gap-4 rounded-xl bg-white p-4 ring-1 ring-stone-200 sm:flex-row sm:items-center">'

bulk_action_toolbar = """
      {selectedIds.size > 0 && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-indigo-50 p-4 ring-1 ring-indigo-200">
          <span className="text-sm font-medium text-indigo-900">{selectedIds.size} selected</span>
          <div className="flex gap-2">
            <button onClick={() => handleBulkToggle('is_active', true)} className="rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-indigo-700 shadow-sm ring-1 ring-indigo-200 hover:bg-indigo-100">Set Visible</button>
            <button onClick={() => handleBulkToggle('is_active', false)} className="rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-indigo-700 shadow-sm ring-1 ring-indigo-200 hover:bg-indigo-100">Set Hidden</button>
            <button onClick={handleBulkDelete} className="rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-red-600 shadow-sm ring-1 ring-red-200 hover:bg-red-50">Delete</button>
          </div>
        </div>
      )}

      <div className="mb-6 flex flex-col gap-4 rounded-xl bg-white p-4 ring-1 ring-stone-200 sm:flex-row sm:items-center">
"""
content = content.replace(search_bar_div, bulk_action_toolbar.strip('\n'))

# 2. Add Select All Checkbox to the Toolbar or list header
# For grid view, let's just render the grid/list logic
grid_logic = """
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
            {products.map((p) => (
"""

view_logic = """
          {viewMode === 'list' ? (
            <div className="overflow-x-auto rounded-xl bg-white ring-1 ring-stone-200">
              <table className="w-full text-left text-sm text-stone-600">
                <thead className="bg-stone-50 text-xs uppercase text-stone-700">
                  <tr>
                    <th className="px-4 py-3"><input type="checkbox" checked={selectedIds.size === products.length && products.length > 0} onChange={toggleAll} className="h-4 w-4 rounded border-stone-300" /></th>
                    <th className="px-4 py-3">Product</th>
                    <th className="px-4 py-3">Price</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200">
                  {products.map((p) => (
                    <tr key={p.id} className="hover:bg-stone-50">
                      <td className="px-4 py-3"><input type="checkbox" checked={selectedIds.has(p.id)} onChange={() => toggleSelection(p.id)} className="h-4 w-4 rounded border-stone-300" /></td>
                      <td className="px-4 py-3 flex items-center gap-3">
                        <div className="h-10 w-10 shrink-0 rounded bg-stone-100 overflow-hidden">
                          {p.image_url ? <img src={p.image_url} alt="" className="h-full w-full object-cover" /> : <ImageOff className="h-4 w-4 m-auto mt-3 text-stone-400" />}
                        </div>
                        <span className="font-medium text-stone-900">{p.title}</span>
                      </td>
                      <td className="px-4 py-3">{formatPrice(p.price)}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <Toggle on={p.is_active} onClick={() => quickToggle(p, 'is_active')} onLabel="Visible" offLabel="Hidden" />
                          <Toggle on={p.in_stock} onClick={() => quickToggle(p, 'in_stock')} onLabel="In stock" offLabel="Sold out" />
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => setEditing(p)} className="p-1 text-stone-500 hover:text-stone-900"><Pencil className="h-4 w-4" /></button>
                        <button onClick={() => handleDelete(p)} disabled={deletingId === p.id} className="p-1 text-red-500 hover:text-red-700"><Trash2 className="h-4 w-4" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <>
              <div className="mb-4 flex items-center gap-2">
                <input type="checkbox" checked={selectedIds.size === products.length && products.length > 0} onChange={toggleAll} id="selectAll" className="h-4 w-4 rounded border-stone-300" />
                <label htmlFor="selectAll" className="text-sm text-stone-600">Select All</label>
              </div>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
                {products.map((p) => (
                  <div key={p.id} className={`flex flex-col overflow-hidden rounded-xl bg-white ring-1 ${selectedIds.has(p.id) ? 'ring-indigo-500 ring-2' : 'ring-stone-200'}`}>
                    <div className="aspect-[4/5] relative bg-stone-100">
                      <div className="absolute top-2 left-2 z-10">
                        <input type="checkbox" checked={selectedIds.has(p.id)} onChange={() => toggleSelection(p.id)} className="h-4 w-4 rounded border-stone-300" />
                      </div>
                      {p.image_url ? (
                        <img src={p.image_url} alt={p.title} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-stone-400"><ImageOff className="h-8 w-8" /></div>
                      )}
                      <div className="absolute top-2 right-2 flex gap-1 z-10">
                        <button onClick={() => setEditing(p)} className="rounded-full bg-white/90 p-1.5 text-stone-700 shadow-sm hover:bg-white hover:text-stone-900"><Pencil className="h-4 w-4" /></button>
                        <button onClick={() => handleDelete(p)} disabled={deletingId === p.id} className="rounded-full bg-white/90 p-1.5 text-red-600 shadow-sm hover:bg-white hover:text-red-700 disabled:opacity-50">
                          {deletingId === p.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-col p-4 flex-1">
                      <h3 className="font-medium line-clamp-1" title={p.title}>{p.title}</h3>
                      <p className="mt-1 text-sm text-stone-500">{formatPrice(p.price)}</p>
                      <div className="mt-auto pt-4 flex flex-wrap gap-2">
                        <Toggle on={p.is_active} onClick={() => quickToggle(p, 'is_active')} onLabel="Visible" offLabel="Hidden" />
                        <Toggle on={p.in_stock} onClick={() => quickToggle(p, 'in_stock')} onLabel="In stock" offLabel="Sold out" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
"""

content = re.sub(r'<div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">[\s\S]*?(?=\{\s*totalPages > 1)', view_logic.strip('\n') + '\n\n          ', content)

with open('app/admin/products/page.jsx', 'w') as f:
    f.write(content)

