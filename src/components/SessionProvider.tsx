'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { sessionManager } from '@/lib/sessionManager'

interface SessionProviderProps {
  children: React.ReactNode
}

export default function SessionProvider({ children }: SessionProviderProps) {
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    let subscription: any = null

    const initializeSession = async () => {
      try {
        // Get initial session
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session) {
          if (process.env.NODE_ENV === 'development') {
            console.log('Session initialized:', {
              userId: session.user.id,
              expiresAt: new Date(session.expires_at! * 1000).toLocaleString(),
              sessionInfo: sessionManager.getSessionInfo()
            })
          }
        }

        // Listen for auth state changes
        const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            if (event === 'SIGNED_IN' && session) {
              if (process.env.NODE_ENV === 'development') {
                console.log('User signed in, session active for 15 minutes')
              }
            } else if (event === 'SIGNED_OUT') {
              if (process.env.NODE_ENV === 'development') {
                console.log('User signed out, cleaning up session manager')
              }
              sessionManager.cleanup()
            } else if (event === 'TOKEN_REFRESHED' && session) {
              if (process.env.NODE_ENV === 'development') {
                console.log('Token refreshed, session extended')
              }
            }
          }
        )

        subscription = authSubscription
        setIsInitialized(true)
      } catch (error) {
        console.error('Error initializing session:', error)
        setIsInitialized(true) // Still set as initialized to avoid blocking the app
      }
    }

    initializeSession()

    // Cleanup subscription on unmount
    return () => {
      if (subscription) {
        subscription.unsubscribe()
      }
      sessionManager.cleanup()
    }
  }, [])

  // Show loading state while initializing
  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-400 mx-auto mb-4"></div>
          <p className="text-amber-400 text-lg">Initializing session...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
