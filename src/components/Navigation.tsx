'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BookOpen, Menu, X, Wine, User, Settings, History, LogOut, ChevronDown } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/lib/auth-context'
import Notifications from './Notifications'

export default function Navigation() {
  const { user, profile, signOut, updateUserActivity } = useAuth()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const pathname = usePathname()
  const profileDropdownRef = useRef<HTMLDivElement>(null)

  // Track user activity when they navigate
  useEffect(() => {
    if (user) {
      updateUserActivity()
    }
  }, [user, updateUserActivity])

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setIsProfileDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const navigation = [
    { name: 'Home', href: '/' },
    { name: 'Dashboard', href: '/dashboard' },
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

          {/* Auth Buttons / User Profile */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <>
                {/* Notifications */}
                <Notifications />
                
                <div className="relative" ref={profileDropdownRef}>
                  <button
                    onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                    className="flex items-center space-x-2 nav-link hover:bg-amber-500/10 rounded-lg px-3 py-2 transition-all duration-200"
                  >
                    <User className="w-5 h-5" />
                    <span>{profile?.full_name || user.email?.split('@')[0] || 'User'}</span>
                    <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isProfileDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {isProfileDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-64 bg-slate-800 border border-amber-500/20 rounded-lg shadow-xl z-50">
                      <div className="p-4 border-b border-amber-500/20">
                        <p className="text-amber-200 font-medium">{profile?.full_name || 'User'}</p>
                        <p className="text-slate-400 text-sm">{user.email}</p>
                      </div>
                      
                      <div className="p-2">
                        <Link
                          href="/profile"
                          className="flex items-center space-x-3 w-full px-3 py-2 text-slate-300 hover:text-amber-200 hover:bg-amber-500/10 rounded-md transition-all duration-200"
                          onClick={() => setIsProfileDropdownOpen(false)}
                        >
                          <Settings className="w-4 h-4" />
                          <span>My Account</span>
                        </Link>
                        
                        <Link
                          href="/swap-history"
                          className="flex items-center space-x-3 w-full px-3 py-2 text-slate-300 hover:text-amber-200 hover:bg-amber-500/10 rounded-md transition-all duration-200"
                          onClick={() => setIsProfileDropdownOpen(false)}
                        >
                          <History className="w-4 h-4" />
                          <span>Swap History</span>
                        </Link>
                        
                        <button
                          onClick={async () => {
                            try {
                              console.log('Logout button clicked')
                              setIsLoggingOut(true)
                              
                              // Add timeout to prevent hanging
                              const logoutTimeout = setTimeout(() => {
                                console.warn('Logout timeout - forcing logout')
                                setIsLoggingOut(false)
                                setIsProfileDropdownOpen(false)
                                window.location.replace('/')
                              }, 5000) // 5 second timeout
                              
                              // Call the signOut function
                              await signOut()
                              
                              // Clear timeout if successful
                              clearTimeout(logoutTimeout)
                              
                              console.log('SignOut completed, closing dropdown and redirecting...')
                              setIsProfileDropdownOpen(false)
                              
                              // Force a hard redirect to clear any cached state
                              window.location.replace('/')
                            } catch (error) {
                              console.error('Error during logout process:', error)
                              setIsLoggingOut(false)
                              // Show error to user
                              alert('Error signing out. Please try again.')
                            }
                          }}
                          disabled={isLoggingOut}
                          className="flex items-center space-x-3 w-full px-3 py-2 text-slate-300 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isLoggingOut ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-400"></div>
                          ) : (
                            <LogOut className="w-4 h-4" />
                          )}
                          <span>{isLoggingOut ? 'Signing Out...' : 'Log Out'}</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
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
              </>
            )}
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
              {user ? (
                <div className="pt-4 border-t border-amber-500/20 space-y-3">
                  <div className="px-4 py-2 border-b border-amber-500/20">
                    <p className="text-amber-200 font-medium">{profile?.full_name || 'User'}</p>
                    <p className="text-slate-400 text-sm">{user.email}</p>
                  </div>
                  
                  <Link
                    href="/profile"
                    className="block nav-link"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Settings className="w-4 h-4 inline mr-2" />
                    My Account
                  </Link>
                  
                  <Link
                    href="/swap-history"
                    className="block nav-link"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <History className="w-4 h-4 inline mr-2" />
                    Swap History
                  </Link>
                  
                  <button
                    onClick={async () => {
                      try {
                        console.log('Mobile logout button clicked')
                        setIsLoggingOut(true)
                        
                        // Add timeout to prevent hanging
                        const logoutTimeout = setTimeout(() => {
                          console.warn('Mobile logout timeout - forcing logout')
                          setIsLoggingOut(false)
                          setIsMobileMenuOpen(false)
                          window.location.replace('/')
                        }, 5000) // 5 second timeout
                        
                        // Call the signOut function
                        await signOut()
                        
                        // Clear timeout if successful
                        clearTimeout(logoutTimeout)
                        
                        console.log('Mobile signOut completed, closing menu and redirecting...')
                        setIsMobileMenuOpen(false)
                        
                        // Force a hard redirect to clear any cached state
                        window.location.replace('/')
                      } catch (error) {
                        console.error('Error during mobile logout process:', error)
                        setIsLoggingOut(false)
                        // Show error to user
                        alert('Error signing out. Please try again.')
                      }
                    }}
                    disabled={isLoggingOut}
                    className="block w-full text-left nav-link text-red-400 hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoggingOut ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-400 inline mr-2"></div>
                    ) : (
                      <LogOut className="w-4 h-4 inline mr-2" />
                    )}
                    {isLoggingOut ? 'Signing Out...' : 'Log Out'}
                  </button>
                </div>
              ) : (
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
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
