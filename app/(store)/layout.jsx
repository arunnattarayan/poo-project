import { getStoreConfig } from '@/lib/store-config'
import ConfigProvider from '@/components/ConfigProvider'
import Header from '@/components/Header'
import CartDrawer from '@/components/CartDrawer'
import SuccessToast from '@/components/SuccessToast'

export default async function StoreLayout({ children }) {
  const config = await getStoreConfig()

  return (
    <ConfigProvider config={config}>
      <Header />
      <main className="min-h-[calc(100vh-8rem)]">{children}</main>
      <footer className="border-t border-heritage-gold/20 py-6 text-center text-sm text-heritage-dark/60 bg-heritage-light">
        © {new Date().getFullYear()} {config.store_name}. All rights reserved.
      </footer>
      <CartDrawer />
      <SuccessToast />
    </ConfigProvider>
  )
}
