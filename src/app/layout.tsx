import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/lib/auth-context'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Books & Booze - Where Literature Meets Libations',
  description: 'A sophisticated community for bibliophiles who appreciate fine literature and craft cocktails. Share your favorite reads while discovering the perfect drink pairings.',
  authors: [{ name: 'Books & Booze Team' }],
  keywords: ['books', 'literature', 'cocktails', 'book exchange', 'reading', 'community', 'bibliophiles', 'craft cocktails', 'literary society'],
  openGraph: {
    title: 'Books & Booze - Where Literature Meets Libations',
    description: 'A sophisticated community for bibliophiles who appreciate fine literature and craft cocktails. Share your favorite reads while discovering the perfect drink pairings.',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Books & Booze - Where Literature Meets Libations',
    description: 'A sophisticated community for bibliophiles who appreciate fine literature and craft cocktails. Share your favorite reads while discovering the perfect drink pairings.',
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
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
