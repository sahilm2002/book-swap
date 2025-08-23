'use client'

import { useState, useEffect } from 'react'
import { Bell, X, BookOpen, User, Check, XCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import SwapReviewModal from './SwapReviewModal'

interface Notification {
  id: string
  type: string
  title: string
  message: string
  related_swap_id: string
  read_at: string | null
  created_at: string
  swap_details?: {
    requester_name: string
    book_offered: string
    book_requested: string
  }
}

export default function Notifications() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  
  // Swap review modal state
  const [swapReviewModal, setSwapReviewModal] = useState<{
    isOpen: boolean
    swapId: string
  }>({
    isOpen: false,
    swapId: ''
  })

  // Fetch notifications when component mounts
  useEffect(() => {
    if (user) {
      fetchNotifications()
    }
  }, [user])

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      
      // Fetch notifications with swap details
      const { data, error } = await supabase
        .from('notifications')
        .select(`
          *,
          book_swaps!notifications_related_swap_id_fkey(
            id,
            requester_id,
            book_requested_id,
            book_offered_id,
            status,
            users!book_swaps_requester_id_fkey(
              email,
              raw_user_meta_data
            ),
            book_offered:books!book_swaps_book_offered_id_fkey(title),
            book_requested:books!book_swaps_book_requested_id_fkey(title)
          )
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) throw error

      // Transform the data to include swap details
      const transformedNotifications = data?.map(notification => ({
        ...notification,
        swap_details: notification.book_swaps ? {
          requester_name: notification.book_swaps.users?.raw_user_meta_data?.full_name || 
                         notification.book_swaps.users?.email?.split('@')[0] || 'Unknown User',
          book_offered: notification.book_swaps.book_offered?.title || 'Unknown Book',
          book_requested: notification.book_swaps.book_requested?.title || 'Unknown Book'
        } : undefined
      })) || []

      setNotifications(transformedNotifications)
      setUnreadCount(transformedNotifications.filter(n => !n.read_at).length)
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('id', notificationId)

      if (error) throw error

      // Update local state
      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId ? { ...n, read_at: new Date().toISOString() } : n
        )
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const handleNotificationClick = (notification: Notification) => {
    if (notification.type === 'swap_request') {
      // Mark as read and open swap review modal
      markAsRead(notification.id)
      setSwapReviewModal({
        isOpen: true,
        swapId: notification.related_swap_id
      })
      setIsOpen(false) // Close notifications dropdown
    }
  }

  if (!user) return null

  return (
    <div className="relative">
      {/* Notification Bell */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 transition-colors"
        title="Notifications"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notifications Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-96 overflow-y-auto">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="p-2">
            {loading ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Bell className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>No notifications yet</p>
              </div>
            ) : (
              notifications.map(notification => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    notification.read_at 
                      ? 'bg-gray-50 hover:bg-gray-100' 
                      : 'bg-blue-50 hover:bg-blue-100 border-l-4 border-blue-500'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1">
                      {notification.type === 'swap_request' && (
                        <BookOpen className="w-5 h-5 text-blue-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 mb-1">
                        {notification.title}
                      </p>
                      <p className="text-sm text-gray-600 mb-2">
                        {notification.message}
                      </p>
                      {notification.swap_details && (
                        <div className="text-xs text-gray-500 bg-white p-2 rounded border">
                          <p><strong>{notification.swap_details.requester_name}</strong> has offered <strong>{notification.swap_details.book_offered}</strong> in return for your <strong>{notification.swap_details.book_requested}</strong></p>
                        </div>
                      )}
                      <p className="text-xs text-gray-400 mt-2">
                        {new Date(notification.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Swap Review Modal */}
      <SwapReviewModal
        isOpen={swapReviewModal.isOpen}
        onClose={() => setSwapReviewModal({ isOpen: false, swapId: '' })}
        swapId={swapReviewModal.swapId}
        onSwapReviewed={() => {
          // Refresh notifications after swap is reviewed
          fetchNotifications()
        }}
      />
    </div>
  )
}
