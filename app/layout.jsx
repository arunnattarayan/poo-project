import { Playfair_Display, Lato } from 'next/font/google'
import './globals.css'
import { getStoreConfig } from '@/lib/store-config'
import { SITE_URL } from '@/lib/utils'

const playfair = Playfair_Display({ 
  subsets: ['latin'], 
  variable: '--font-playfair',
  display: 'swap',
})

const lato = Lato({ 
  subsets: ['latin'], 
  weight: ['100', '300', '400', '700', '900'],
  variable: '--font-lato',
  display: 'swap',
})

export async function generateMetadata() {
  const config = await getStoreConfig()
  return {
    title: { default: config.store_name, template: `%s | ${config.store_name}` },
    description: config.store_tagline,
    metadataBase: new URL(SITE_URL),
  }
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${playfair.variable} ${lato.variable}`}>
      <body className="font-sans antialiased" suppressHydrationWarning>{children}</body>
    </html>
  )
}
