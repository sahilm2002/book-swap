'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from './supabase'

interface UserProfile {
  id: string
  email: string
  full_name?: string
  address?: string
  created_at: string
  updated_at: string
}

interface AuthContextType {
  user: User | null
  profile: UserProfile | null
  session: Session | null
  loading: boolean
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
  forceLogout: () => Promise<boolean>
  updateUserActivity: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    console.log('AuthContext useEffect started')
    
    // Get initial session
    const getInitialSession = async () => {
      try {
        console.log('Getting initial session...')
        // Check if user has explicitly logged out
        const hasLoggedOut = localStorage.getItem('user_logged_out')
        if (hasLoggedOut === 'true') {
          console.log('User has explicitly logged out - not restoring session')
          setSession(null)
          setUser(null)
          setProfile(null)
          setLoading(false)
          return
        }
        
        // Check for recent activity (within 1 hour)
        const lastActivity = localStorage.getItem('last_user_activity')
        if (lastActivity) {
          const lastActivityTime = new Date(lastActivity).getTime()
          const oneHourAgo = Date.now() - (60 * 60 * 1000)
          
          if (lastActivityTime < oneHourAgo) {
            console.log('User inactive for more than 1 hour - clearing session')
            localStorage.removeItem('last_user_activity')
            setSession(null)
            setUser(null)
            setProfile(null)
            setLoading(false)
            return
          }
        }
        
        const { data: { session } } = await supabase.auth.getSession()
        console.log('Initial session result:', { hasSession: !!session, userId: session?.user?.id })
        
        if (session?.user) {
          console.log('Valid session found, restoring user state')
          setSession(session)
          setUser(session.user)
          
          // Update last activity time
          localStorage.setItem('last_user_activity', new Date().toISOString())
          
          console.log('Fetching user profile for:', session.user.id)
          await fetchUserProfile(session.user.id)
        } else {
          console.log('No valid session found')
          setSession(null)
          setUser(null)
          setProfile(null)
        }
      } catch (error) {
        console.error('Error getting initial session:', error)
        setSession(null)
        setUser(null)
        setProfile(null)
      } finally {
        console.log('Setting loading to false in getInitialSession')
        setLoading(false)
      }
    }

    // Add a timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      console.warn('Auth loading timeout - forcing loading to false')
      setLoading(false)
    }, 10000) // 10 second timeout

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, session?.user?.id)
        
        // Handle different auth events
        if (event === 'INITIAL_SESSION') {
          // This event fires when the page loads and auth is already established
          console.log('Initial session event - user already authenticated')
          setSession(session)
          setUser(session?.user ?? null)
          if (session?.user) {
            // Update last activity time
            localStorage.setItem('last_user_activity', new Date().toISOString())
            await fetchUserProfile(session.user.id)
          }
          setLoading(false)
          return
        }
        
        if (event === 'SIGNED_IN') {
          // User is signing in
          console.log('User signing in')
          localStorage.removeItem('user_logged_out')
          setSession(session)
          setUser(session?.user ?? null)
          if (session?.user) {
            // Update last activity time
            localStorage.setItem('last_user_activity', new Date().toISOString())
            await fetchUserProfile(session.user.id)
          }
          setLoading(false)
        } else if (event === 'SIGNED_OUT') {
          // User is signing out
          console.log('User signing out')
          setSession(null)
          setUser(null)
          setProfile(null)
          setLoading(false)
        } else if (event === 'TOKEN_REFRESHED') {
          // Token was refreshed
          console.log('Token refreshed')
          setSession(session)
          setUser(session?.user ?? null)
          if (session?.user) {
            // Update last activity time
            localStorage.setItem('last_user_activity', new Date().toISOString())
            await fetchUserProfile(session.user.id)
          }
          setLoading(false)
        } else {
          // For any other events, ensure loading is false
          console.log('Other auth event:', event)
          setSession(session)
          setUser(session?.user ?? null)
          if (session?.user) {
            // Update last activity time
            localStorage.setItem('last_user_activity', new Date().toISOString())
            await fetchUserProfile(session.user.id)
          }
          setLoading(false)
        }
      }
    )

    return () => {
      console.log('AuthContext cleanup - clearing timeout and subscription')
      clearTimeout(timeoutId)
      subscription.unsubscribe()
    }
  }, [])

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()
      
      if (error) {
        console.error('Error fetching user profile:', error)
        return
      }
      
      setProfile(data)
    } catch (error) {
      console.error('Error fetching user profile:', error)
    }
  }

  const refreshProfile = async () => {
    if (user) {
      await fetchUserProfile(user.id)
    }
  }

  const SUPABASE_DB_NAMES = ['supabase-auth-client', 'supabase-db']; // adjust if needed

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Supabase signOut error:', err);
    }

    // Remove only Supabase/auth-related keys from localStorage
    try {
      Object.keys(localStorage).forEach(key => {
        if (
          key.startsWith('sb-') ||
          key.startsWith('supabase.') ||
          key.startsWith('supabase.auth.') ||
          key === 'access_token' ||
          key === 'refresh_token' ||
          key === 'user_logged_out'
        ) {
          localStorage.removeItem(key);
        }
      });
    } catch (err) {
      console.warn('Error clearing localStorage keys:', err);
    }

    // Remove only Supabase/auth-related keys from sessionStorage
    try {
      Object.keys(sessionStorage).forEach(key => {
        if (
          key.startsWith('sb-') ||
          key.startsWith('supabase.') ||
          key.startsWith('supabase.auth.') ||
          key === 'access_token' ||
          key === 'refresh_token'
        ) {
          sessionStorage.removeItem(key);
        }
      });
    } catch (err) {
      console.warn('Error clearing sessionStorage keys:', err);
    }

    // Remove only Supabase auth cookies
    try {
      document.cookie.split(';').forEach(cookie => {
        const name = cookie.split('=')[0].trim();
        if (
          name.startsWith('sb-') ||
          name.startsWith('supabase.') ||
          name.startsWith('supabase.auth.') ||
          name === 'access_token' ||
          name === 'refresh_token'
        ) {
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
        }
      });
    } catch (err) {
      console.warn('Error clearing cookies:', err);
    }

    // Remove only Supabase client DB from indexedDB
    try {
      if (indexedDB.databases) {
        indexedDB.databases().then(dbs => {
          dbs.forEach(db => {
            if (db.name && SUPABASE_DB_NAMES.includes(db.name)) {
              indexedDB.deleteDatabase(db.name);
            }
          });
        });
      }
    } catch (err) {
      console.warn('Error clearing indexedDB:', err);
    }

    // Set local state and user_logged_out flag
    try {
      localStorage.setItem('user_logged_out', 'true');
      // ...any other local state clearing needed...
    } catch (err) {
      console.warn('Error setting user_logged_out flag:', err);
    }
  }

  // Debug function - can be called from browser console
  const forceLogout = async () => {
    console.log('Force logout called')
    try {
      // Clear everything immediately
      setUser(null)
      setProfile(null)
      setSession(null)
      setLoading(false)
      
      // Nuclear option: Clear ALL storage
      localStorage.clear()
      sessionStorage.clear()
      
      // Clear all cookies
      document.cookie.split(";").forEach(function(c) { 
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
      });
      
      // Clear any indexedDB data
      if (typeof window !== 'undefined' && 'indexedDB' in window) {
        try {
          indexedDB.deleteDatabase('supabase')
        } catch (e) {
          console.log('IndexedDB cleanup error (expected):', e)
        }
      }
      
      // Force Supabase logout
      await supabase.auth.signOut()
      
      // Additional cleanup - remove any remaining Supabase references
      if (typeof window !== 'undefined') {
        // @ts-ignore
        if (window.__SUPABASE__) {
          // @ts-ignore
          delete window.__SUPABASE__
        }
      }
      
      // Set logout flag to prevent session restoration
      localStorage.setItem('user_logged_out', 'true')
      
      console.log('Nuclear force logout completed - all data obliterated')
      return true
    } catch (error) {
      console.error('Force logout error:', error)
      return false
    }
  }

  const updateUserActivity = () => {
    localStorage.setItem('last_user_activity', new Date().toISOString())
  }

  const value = {
    user,
    profile,
    session,
    loading,
    signOut,
    refreshProfile,
    forceLogout, // Add debug function
    updateUserActivity,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
