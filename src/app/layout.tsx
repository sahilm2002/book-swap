import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Navigation from '@/components/Navigation'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Book Swap - Share and Discover Books',
  description: 'A platform for book lovers to discover, share, and exchange books with other readers in their community.',
  keywords: ['books', 'book exchange', 'reading', 'community', 'literature'],
  authors: [{ name: 'Book Swap Team' }],
  openGraph: {
    title: 'Book Swap - Share and Discover Books',
    description: 'A platform for book lovers to discover, share, and exchange books with other readers in their community.',
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
        <div className="min-h-screen bg-gray-50">
          <Navigation />
          {children}
        </div>
      </body>
    </html>
  )
}
