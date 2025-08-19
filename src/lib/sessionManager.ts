import { supabase } from './supabase'

class SessionManager {
  private activityTimeout: NodeJS.Timeout | null = null
  private sessionRefreshInterval: NodeJS.Timeout | null = null
  private readonly SESSION_TIMEOUT_MS = (parseInt(process.env.NEXT_PUBLIC_SESSION_TIMEOUT_MINUTES || '15') * 60 * 1000) // 15 minutes default
  private readonly REFRESH_INTERVAL_MS = (parseInt(process.env.NEXT_PUBLIC_SESSION_REFRESH_INTERVAL_MINUTES || '5') * 60 * 1000) // 5 minutes default
  private readonly ACTIVITY_TIMEOUT_MS = (parseInt(process.env.NEXT_PUBLIC_ACTIVITY_TIMEOUT_MINUTES || '14') * 60 * 1000) // 14 minutes default
  
  // Handler references for proper cleanup
  private visibilityHandler: (() => void) | null = null
  private focusHandler: (() => void) | null = null
  private activityListeners: Array<{ event: string; handler: () => void }> = []

  constructor() {
    // Only initialize in browser environment
    if (typeof window !== 'undefined' && typeof document !== 'undefined') {
      this.initializeSessionManagement()
    }
  }

  private initializeSessionManagement() {
    // Start session refresh interval
    this.startSessionRefresh()
    
    // Set up activity tracking
    this.setupActivityTracking()
    
    // Handle page visibility changes
    this.setupVisibilityTracking()
  }

  private startSessionRefresh() {
    this.sessionRefreshInterval = setInterval(async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          // Refresh the session if it's about to expire
          const { error } = await supabase.auth.refreshSession()
          if (error) {
            console.warn('Failed to refresh session:', error.message)
          } else {
            if (process.env.NODE_ENV === 'development') {
              console.log('Session refreshed successfully')
            }
          }
        }
      } catch (error) {
        console.error('Error refreshing session:', error)
      }
    }, this.REFRESH_INTERVAL_MS)
  }

  private setupActivityTracking() {
    // Track user activity events
    const activityEvents = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'click',
      'focus'
    ]

    const resetActivityTimeout = () => {
      if (this.activityTimeout) {
        clearTimeout(this.activityTimeout)
      }
      
      this.activityTimeout = setTimeout(() => {
        if (process.env.NODE_ENV === 'development') {
          console.log('User inactive for 14 minutes, refreshing session...')
        }
        this.refreshSession()
      }, this.ACTIVITY_TIMEOUT_MS)
    }

    // Add event listeners for all activity events and store references
    activityEvents.forEach(event => {
      const handler = resetActivityTimeout
      document.addEventListener(event, handler, { passive: true })
      this.activityListeners.push({ event, handler })
    })

    // Initial timeout setup
    resetActivityTimeout()
  }

  private setupVisibilityTracking() {
    // Handle page visibility changes
    this.visibilityHandler = () => {
      if (!document.hidden) {
        // Page became visible, check if we need to refresh session
        this.checkAndRefreshSession()
      }
    }

    // Handle focus events
    this.focusHandler = () => {
      this.checkAndRefreshSession()
    }

    document.addEventListener('visibilitychange', this.visibilityHandler)
    window.addEventListener('focus', this.focusHandler)
  }

  private async refreshSession() {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        const { error } = await supabase.auth.refreshSession()
        if (error) {
          console.warn('Failed to refresh session:', error.message)
        } else {
          if (process.env.NODE_ENV === 'development') {
            console.log('Session refreshed due to activity timeout')
          }
          // Reset activity timeout after successful refresh using the helper method
          this.resetActivityTimeout()
        }
      }
    } catch (error) {
      console.error('Error refreshing session:', error)
    }
  }

  private resetActivityTimeout() {
    if (this.activityTimeout) {
      clearTimeout(this.activityTimeout)
    }
    
    this.activityTimeout = setTimeout(() => {
      if (process.env.NODE_ENV === 'development') {
        console.log('User inactive for 14 minutes, refreshing session...')
      }
      this.refreshSession()
    }, this.ACTIVITY_TIMEOUT_MS)
  }

  private async checkAndRefreshSession() {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        // Check if session is close to expiring
        const expiresAt = new Date(session.expires_at! * 1000)
        const now = new Date()
        const timeUntilExpiry = expiresAt.getTime() - now.getTime()
        
        // If session expires in less than 5 minutes, refresh it
        if (timeUntilExpiry < 5 * 60 * 1000) {
          if (process.env.NODE_ENV === 'development') {
            console.log('Session expiring soon, refreshing...')
          }
          await this.refreshSession()
        }
      }
    } catch (error) {
      console.error('Error checking session:', error)
    }
  }

  public async manualRefresh(): Promise<void> {
    await this.refreshSession()
  }

  public cleanup() {
    if (this.activityTimeout) {
      clearTimeout(this.activityTimeout)
      this.activityTimeout = null
    }
    if (this.sessionRefreshInterval) {
      clearInterval(this.sessionRefreshInterval)
      this.sessionRefreshInterval = null
    }
    
    // Remove visibility tracking listeners
    if (this.visibilityHandler) {
      document.removeEventListener('visibilitychange', this.visibilityHandler)
      this.visibilityHandler = null
    }
    if (this.focusHandler) {
      window.removeEventListener('focus', this.focusHandler)
      this.focusHandler = null
    }
    
    // Remove activity tracking listeners
    this.activityListeners.forEach(({ event, handler }) => {
      document.removeEventListener(event, handler)
    })
    this.activityListeners = []
  }

  public getSessionInfo() {
    return {
      sessionTimeout: this.SESSION_TIMEOUT_MS,
      refreshInterval: this.REFRESH_INTERVAL_MS,
      activityTimeout: this.ACTIVITY_TIMEOUT_MS
    }
  }
}

// Create and export a singleton instance
export const sessionManager = new SessionManager()

// Export the class for testing purposes
export { SessionManager }
