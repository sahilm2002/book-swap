'use client'

import Link from 'next/link'
import { BookOpen, Wine, User, LogOut } from 'lucide-react'
import { useMockAuth } from '@/lib/mock-auth'

export default function SimplifiedNavigation() {
  const { user, signOut } = useMockAuth()

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

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/" className="nav-link text-amber-400">
              Home
            </Link>
            <Link href="/test-swaps" className="nav-link text-slate-300 hover:text-amber-400 transition-colors">
              Test Swaps
            </Link>
            <Link href="/mock-dashboard" className="nav-link text-slate-300 hover:text-amber-400 transition-colors">
              Dashboard
            </Link>
          </div>

          {/* User Section */}
          <div className="flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <User className="w-4 h-4 text-amber-400" />
                  <span className="text-sm text-slate-300">{user.full_name}</span>
                </div>
                <button
                  onClick={signOut}
                  className="flex items-center space-x-1 text-slate-400 hover:text-red-400 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="text-sm">Sign Out</span>
                </button>
              </div>
            ) : (
              <div className="text-slate-300">Not signed in</div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}