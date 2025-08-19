'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BookOpen, Menu, X, Wine } from 'lucide-react'
import { useState } from 'react'

export default function Navigation() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const pathname = usePathname()

  const navigation = [
    { name: 'Home', href: '/' },
    { name: 'Browse', href: '/browse' },
    { name: 'Literary Society', href: '/literary-society' },
    { name: 'About', href: '/about' },
  ]

  const isActive = (href: string) => pathname === href

  return (
    <nav className="bg-slate-900/95 backdrop-blur-md border-b border-amber-500/20 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-amber-500/25 transition-all duration-300">
              <BookOpen className="w-6 h-6 text-slate-900" />
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-xl font-bold text-amber-200">Books</span>
              <Wine className="w-5 h-5 text-amber-400" />
              <span className="text-xl font-bold text-amber-200">Booze</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`nav-link ${
                  isActive(item.href) ? 'nav-link-active' : ''
                }`}
              >
                {item.name}
              </Link>
            ))}
          </div>

          {/* Auth Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            <Link
              href="/auth/login"
              className="nav-link"
            >
              Sign In
            </Link>
            <Link
              href="/auth/signup"
              className="btn-primary text-sm"
            >
              Join the Club
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 transition-all duration-200"
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-amber-500/20 py-4 bg-slate-800/95 backdrop-blur-md">
            <div className="space-y-4">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`block nav-link ${
                    isActive(item.href) ? 'nav-link-active' : ''
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
              <div className="pt-4 border-t border-amber-500/20 space-y-3">
                <Link
                  href="/auth/login"
                  className="block nav-link"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/signup"
                  className="block text-center btn-primary"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Join the Club
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
