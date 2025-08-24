'use client'

import { useAuth } from '@/lib/auth-context'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect } from 'react'
import LoadingSpinner from './LoadingSpinner'

interface AuthGuardProps {
  children: React.ReactNode
  requireAuth?: boolean
}

export default function AuthGuard({ children, requireAuth = true }: AuthGuardProps) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  // Compute redirect condition to prevent flash of protected content
  const shouldRedirect = !loading && (
    (requireAuth && !user) || 
    (!requireAuth && user)
  )

  useEffect(() => {
    if (shouldRedirect) {
      if (requireAuth && !user && pathname !== '/auth/login') {
        router.replace('/auth/login')
      } else if (!requireAuth && user && pathname !== '/dashboard') {
        router.replace('/dashboard')
      }
    }
  }, [shouldRedirect, requireAuth, user, router, pathname])

  // Show loading spinner during initial auth check OR while redirect is pending
  if (loading || shouldRedirect) {
    return (
      <div
        className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900"
        role="status"
        aria-live="polite"
        aria-busy="true"
      >
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  // If auth check is complete and no redirect needed, render children
  return <>{children}</>
}
