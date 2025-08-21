'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'
import { User, Save, Edit3, Eye, EyeOff } from 'lucide-react'
import Link from 'next/link'

export default function ProfilePage() {
  const { user, profile, refreshProfile } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  
  // Profile form state
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [profileForm, setProfileForm] = useState({
    full_name: profile?.full_name || '',
    address: profile?.address || profile?.location || '' // Handle both address and location fields
  })
  
  // Password change state
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  })
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  })

  useEffect(() => {
    if (!user) {
      router.push('/auth/login')
      return
    }
    
    // Update form when profile changes
    if (profile) {
      setProfileForm({
        full_name: profile.full_name || '',
        address: profile.address || ''
      })
    }
  }, [user, profile, router])

  const handleProfileUpdate = async () => {
    if (!user) return
    
    console.log('Starting profile update...', { user: user.id, formData: profileForm })
    setLoading(true)
    setMessage(null)
    
    // Add timeout to prevent hanging
    const timeoutId = setTimeout(() => {
      console.error('Profile update timeout - forcing loading to false')
      setLoading(false)
      setMessage({ type: 'error', text: 'Profile update timed out. Please try again.' })
    }, 10000) // 10 second timeout
    
    try {
      // First check if user record exists
      console.log('Checking if user record exists...')
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('id')
        .eq('id', user.id)
        .single()
      
      console.log('User existence check result:', { existingUser, checkError })
      
      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error checking user existence:', checkError)
        throw checkError
      }
      
      let result
      if (existingUser) {
        // Update existing user
        console.log('Updating existing user record...')
        const updatePromise = supabase
          .from('users')
          .update({
            full_name: profileForm.full_name,
            address: profileForm.address,
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id)
        
        const updateTimeout = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Update operation timeout')), 5000)
        )
        
        result = await Promise.race([updatePromise, updateTimeout])
      } else {
        // Insert new user record
        console.log('Inserting new user record...')
        const insertPromise = supabase
          .from('users')
          .insert({
            id: user.id,
            email: user.email,
            full_name: profileForm.full_name,
            address: profileForm.address,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
        
        const insertTimeout = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Insert operation timeout')), 5000)
        )
        
        result = await Promise.race([insertPromise, insertTimeout])
      }
      
      console.log('Database operation result:', result)
      
      if (result.error) {
        console.error('Database operation error:', result.error)
        throw result.error
      }
      
      // Test if we can read the data back immediately
      console.log('Testing immediate data read...')
      try {
        const { data: testRead, error: testError } = await supabase
          .from('users')
          .select('full_name, address')
          .eq('id', user.id)
          .single()
        
        console.log('Immediate read test result:', { testRead, testError })
      } catch (testError) {
        console.error('Immediate read test error:', testError)
      }
      
      console.log('Profile updated successfully, refreshing profile...')
      
      // Add timeout for refreshProfile as well
      const refreshPromise = refreshProfile()
      const refreshTimeout = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Profile refresh timeout')), 5000)
      )
      
      try {
        await Promise.race([refreshPromise, refreshTimeout])
        console.log('Profile refresh completed')
      } catch (refreshError) {
        console.error('Profile refresh error:', refreshError)
        // Continue even if refresh fails
      }
      
      setIsEditingProfile(false)
      setMessage({ type: 'success', text: 'Profile updated successfully!' })
      console.log('Profile update completed successfully')
    } catch (error) {
      console.error('Error updating profile:', error)
      setMessage({ type: 'error', text: `Failed to update profile: ${error.message || 'Unknown error'}` })
    } finally {
      clearTimeout(timeoutId)
      console.log('Setting loading to false')
      setLoading(false)
    }
  }

  const handlePasswordChange = async () => {
    if (!user) return
    
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setMessage({ type: 'error', text: 'New passwords do not match.' })
      return
    }
    
    if (passwordForm.new_password.length < 6) {
      setMessage({ type: 'error', text: 'New password must be at least 6 characters long.' })
      return
    }
    
    setLoading(true)
    setMessage(null)
    
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordForm.new_password
      })
      
      if (error) throw error
      
      setIsChangingPassword(false)
      setPasswordForm({
        current_password: '',
        new_password: '',
        confirm_password: ''
      })
      setMessage({ type: 'success', text: 'Password changed successfully!' })
    } catch (error) {
      console.error('Error changing password:', error)
      setMessage({ type: 'error', text: 'Failed to change password. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900">My Account</h1>
            <Link href="/dashboard" className="btn-secondary">
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Message Display */}
          {message && (
            <div className={`mb-6 p-4 rounded-lg ${
              message.type === 'success' 
                ? 'bg-green-50 border border-green-200 text-green-800' 
                : 'bg-red-50 border border-red-200 text-red-800'
            }`}>
              {message.text}
            </div>
          )}

          {/* Profile Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold text-gray-900 flex items-center gap-3">
                <User className="w-6 h-6 text-blue-600" />
                Profile Information
              </h2>
              <button
                onClick={() => setIsEditingProfile(!isEditingProfile)}
                className="btn-secondary flex items-center gap-2"
              >
                <Edit3 className="w-4 h-4" />
                {isEditingProfile ? 'Cancel' : 'Edit Profile'}
              </button>
            </div>

            {isEditingProfile ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={profileForm.full_name}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, full_name: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                    placeholder="Enter your full name"
                    style={{ color: '#111827' }}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address
                  </label>
                  <textarea
                    value={profileForm.address}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, address: e.target.value }))}
                    rows={3}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white resize-none"
                    placeholder="Enter your address"
                    style={{ color: '#111827' }}
                  />
                </div>
                
                <div className="flex gap-3">
                  <button
                    onClick={handleProfileUpdate}
                    disabled={loading}
                    className="btn-primary flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    onClick={() => setIsEditingProfile(false)}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      Email Address
                    </label>
                    <p className="text-gray-900">{user.email}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      Full Name
                    </label>
                    <p className="text-gray-900">{profile?.full_name || 'Not set'}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      Address
                    </label>
                    <p className="text-gray-900">{profile?.address || profile?.location || 'Not set'}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      Member Since
                    </label>
                    <p className="text-gray-900">{new Date(user.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Password Change Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold text-gray-900">Change Password</h2>
              <button
                onClick={() => setIsChangingPassword(!isChangingPassword)}
                className="btn-secondary"
              >
                {isChangingPassword ? 'Cancel' : 'Change Password'}
              </button>
            </div>

            {isChangingPassword ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Current Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.current ? 'text' : 'password'}
                      value={passwordForm.current_password}
                      onChange={(e) => setPasswordForm(prev => ({ ...prev, current_password: e.target.value }))}
                      className="w-full p-3 pr-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                      placeholder="Enter current password"
                      style={{ color: '#111827' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showPasswords.current ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.new ? 'text' : 'password'}
                      value={passwordForm.new_password}
                      onChange={(e) => setPasswordForm(prev => ({ ...prev, new_password: e.target.value }))}
                      className="w-full p-3 pr-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                      placeholder="Enter new password"
                      style={{ color: '#111827' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showPasswords.new ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.confirm ? 'text' : 'password'}
                      value={passwordForm.confirm_password}
                      onChange={(e) => setPasswordForm(prev => ({ ...prev, confirm_password: e.target.value }))}
                      className="w-full p-3 pr-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                      placeholder="Confirm new password"
                      style={{ color: '#111827' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showPasswords.confirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <button
                    onClick={handlePasswordChange}
                    disabled={loading}
                    className="btn-primary"
                  >
                    {loading ? 'Changing Password...' : 'Change Password'}
                  </button>
                  <button
                    onClick={() => {
                      setIsChangingPassword(false)
                      setPasswordForm({
                        current_password: '',
                        new_password: '',
                        confirm_password: ''
                      })
                    }}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-gray-600">
                Click "Change Password" to update your password. Make sure to use a strong password 
                that you haven't used elsewhere.
              </p>
            )}
          </div>

          {/* Account Actions */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Account Actions</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h3 className="font-medium text-gray-900">Delete Account</h3>
                  <p className="text-sm text-gray-600">
                    Permanently delete your account and all associated data
                  </p>
                </div>
                <button className="btn-secondary text-red-600 hover:bg-red-50 hover:text-red-700">
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
