import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Navigation from '@/components/Navigation'
import SessionProvider from '@/components/SessionProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Books & Booze - Where Literature Meets Libations',
  description: 'A sophisticated community for bibliophiles who appreciate fine literature and craft cocktails. Share your favorite reads while discovering the perfect drink pairings.',
  keywords: ['books', 'literature', 'cocktails', 'book exchange', 'reading', 'community', 'bibliophiles', 'craft cocktails', 'literary society'],
  authors: [{ name: 'Books & Booze Team' }],
  openGraph: {
    title: 'Books & Booze - Where Literature Meets Libations',
    description: 'A sophisticated community for bibliophiles who appreciate fine literature and craft cocktails. Share your favorite reads while discovering the perfect drink pairings.',
    type: 'website',
    locale: 'en_US',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <SessionProvider>
          <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
            <Navigation />
            {children}
          </div>
        </SessionProvider>
      </body>
    </html>
  )
}
