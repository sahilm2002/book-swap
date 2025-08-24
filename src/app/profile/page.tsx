'use client'

import { useAuth } from '@/lib/auth-context'
import AuthGuard from '@/components/AuthGuard'
import Navigation from '@/components/Navigation'
import { useState } from 'react'

export default function ProfilePage() {
  const { user, signOut } = useAuth()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleSignOut = async () => {
    try {
      setLoading(true)
      await signOut()
      // The auth context will handle the state update
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to sign out' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <Navigation />
        
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <h1 className="text-4xl font-bold text-amber-200 mb-8">Profile</h1>
            
            {message && (
              <div className={`mb-6 p-4 rounded-lg ${
                message.type === 'success' 
                  ? 'bg-green-500/10 border border-green-500/20 text-green-400' 
                  : 'bg-red-500/10 border border-red-500/20 text-red-400'
              }`}>
                {message.text}
              </div>
            )}

            <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-6 border border-slate-700">
              <h2 className="text-2xl font-bold text-amber-200 mb-6">Account Information</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Email</label>
                  <p className="text-white">{user?.email}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">User ID</label>
                  <p className="text-white font-mono text-sm">{user?.id}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Member Since</label>
                  <p className="text-white">
                    {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-slate-600">
                <button
                  onClick={handleSignOut}
                  disabled={loading}
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
                >
                  {loading ? 'Signing out...' : 'Sign Out'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}
