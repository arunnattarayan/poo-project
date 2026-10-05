import re

with open('app/admin/page.jsx', 'r') as f:
    content = f.read()

# Add Download icon
content = content.replace("import { Loader2, RefreshCw, AlertCircle, Inbox, ChevronDown } from 'lucide-react'", "import { Loader2, RefreshCw, AlertCircle, Inbox, ChevronDown, Download, Search } from 'lucide-react'")

# Add state for search
state_target = "const [filter, setFilter] = useState('all')"
state_new = "const [filter, setFilter] = useState('all')\n  const [search, setSearch] = useState('')"
content = content.replace(state_target, state_new)

# Add search and export functions
functions_target = "const visible = filter === 'all' ? orders : orders.filter((o) => o.status === filter)"

functions_new = """
  const visible = useMemo(() => {
    let filtered = filter === 'all' ? orders : orders.filter((o) => o.status === filter)
    if (search) {
      const q = search.toLowerCase()
      filtered = filtered.filter(o => 
        o.id.toLowerCase().includes(q) || 
        o.customer_name.toLowerCase().includes(q) ||
        (o.customer_phone && o.customer_phone.toLowerCase().includes(q))
      )
    }
    return filtered
  }, [orders, filter, search])

  const exportCSV = () => {
    const headers = ['Order ID', 'Date', 'Customer Name', 'Phone', 'Address', 'Status', 'Total Amount']
    const rows = visible.map(o => [
      o.id, 
      new Date(o.created_at).toLocaleString('en-IN'), 
      `"${o.customer_name}"`, 
      o.customer_phone || '',
      `"${o.address.replace(/"/g, '""')}"`, 
      o.status, 
      o.total_amount
    ])
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `orders-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }
"""

content = content.replace(functions_target, functions_new.strip('\n'))

# Add Search UI and Export Button
header_target = """
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">WhatsApp Orders</h1>
          <p className="text-sm text-stone-500">Latest 100 orders submitted from the storefront</p>
        </div>
        <button onClick={load} disabled={loading} className="flex items-center gap-2 rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm hover:bg-stone-100 disabled:opacity-50">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>
"""

header_new = """
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">WhatsApp Orders</h1>
          <p className="text-sm text-stone-500">Latest 100 orders submitted from the storefront</p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportCSV} disabled={visible.length === 0} className="flex items-center gap-2 rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm hover:bg-stone-100 disabled:opacity-50">
            <Download className="h-4 w-4" /> Export CSV
          </button>
          <button onClick={load} disabled={loading} className="flex items-center gap-2 rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm hover:bg-stone-100 disabled:opacity-50">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>
      </div>
"""

content = content.replace(header_target.strip('\n'), header_new.strip('\n'))

search_bar = """
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center justify-between">
        <div className="flex flex-wrap gap-2">
          {['all', ...STATUSES].map((s) => (
            <button
              key={s} onClick={() => setFilter(s)}
              className={`rounded-full px-3 py-1 text-sm capitalize ${filter === s ? 'bg-stone-900 text-white' : 'bg-white text-stone-600 ring-1 ring-stone-200 hover:bg-stone-100'}`}
            >
              {s}
            </button>
          ))}
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            placeholder="Search orders..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-stone-300 py-1.5 pl-9 pr-3 text-sm outline-none focus:border-stone-900 focus:ring-1 focus:ring-stone-900"
          />
        </div>
      </div>
"""

filter_target = """
      <div className="mb-4 flex flex-wrap gap-2">
        {['all', ...STATUSES].map((s) => (
          <button
            key={s} onClick={() => setFilter(s)}
            className={`rounded-full px-3 py-1 text-sm capitalize ${filter === s ? 'bg-stone-900 text-white' : 'bg-white text-stone-600 ring-1 ring-stone-200 hover:bg-stone-100'}`}
          >
            {s}
          </button>
        ))}
      </div>
"""

content = content.replace(filter_target.strip('\n'), search_bar.strip('\n'))

with open('app/admin/page.jsx', 'w') as f:
    f.write(content)

