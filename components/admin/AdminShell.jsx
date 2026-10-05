'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { LayoutDashboard, Package, Settings, Store, LogOut, Menu, X, Share2 } from 'lucide-react'
import { createClient } from '@/lib/supabase'

const NAV = [
  { href: '/admin', label: 'Orders', icon: LayoutDashboard },
  { href: '/admin/products', label: 'Products', icon: Package },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
  { href: '/admin/social', label: 'Social Media', icon: Share2 },
]

export default function AdminShell({ children }) {
  const pathname = usePathname()
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)

  if (pathname === '/admin/login') return children

  async function signOut() {
    await createClient().auth.signOut()
    router.replace('/admin/login')
    router.refresh()
  }

  const linkClass = (href) =>
    `flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
      pathname === href ? 'bg-stone-900 text-white' : 'text-stone-600 hover:bg-stone-100'
    }`

  const links = (
    <>
      {NAV.map(({ href, label, icon: Icon }) => (
        <Link key={href} href={href} className={linkClass(href)} onClick={() => setMenuOpen(false)}>
          <Icon className="h-4 w-4" /> {label}
        </Link>
      ))}
      <Link href="/" target="_blank" className={linkClass('/')}>
        <Store className="h-4 w-4" /> View store
      </Link>
      <button onClick={signOut} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50">
        <LogOut className="h-4 w-4" /> Sign out
      </button>
    </>
  )

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="sticky top-0 z-30 border-b border-stone-200 bg-white">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <Link href="/admin" className="font-semibold">Store Admin</Link>
          <nav className="hidden items-center gap-1 md:flex">{links}</nav>
          <button className="md:hidden" onClick={() => setMenuOpen((o) => !o)} aria-label="Toggle menu">
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
        {menuOpen && <nav className="flex flex-col gap-1 border-t border-stone-200 p-3 md:hidden">{links}</nav>}
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  )
}
