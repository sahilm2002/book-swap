'use client'

import { useState, useEffect } from 'react'
import { X, BookOpen, User, Check, XCircle, MapPin, Calendar } from 'lucide-react'
import { Book, BookCondition } from '@/types/book'
import { supabase } from '@/lib/supabase'

interface SwapRequest {
  id: string
  requester_id: string
  book_requested_id: string
  book_offered_id: string
  status: string
  created_at: string
  requester: {
    email: string
    full_name?: string
  }
  book_offered: Book
  book_requested: Book
}

interface SwapReviewModalProps {
  isOpen: boolean
  onClose: () => void
  swapId: string
  onSwapReviewed: () => void
}

export default function SwapReviewModal({ 
  isOpen, 
  onClose, 
  swapId, 
  onSwapReviewed 
}: SwapReviewModalProps) {
  const [swapRequest, setSwapRequest] = useState<SwapRequest | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Fetch swap request details when modal opens
  useEffect(() => {
    if (isOpen && swapId) {
      fetchSwapRequest()
    }
  }, [isOpen, swapId])

  const fetchSwapRequest = async () => {
    try {
      setLoading(true)
      setError('')

      const { data, error } = await supabase
        .from('book_swaps')
        .select(`
          *,
          requester:auth.users!book_swaps_requester_id_fkey(
            email,
            raw_user_meta_data
          ),
          book_offered:books!book_swaps_book_offered_id_fkey(*),
          book_requested:books!book_swaps_book_requested_id_fkey(*)
        `)
        .eq('id', swapId)
        .single()

      if (error) throw error

      // Transform the data
      const transformedSwap: SwapRequest = {
        ...data,
        requester: {
          email: data.requester?.email || 'Unknown',
          full_name: data.requester?.raw_user_meta_data?.full_name
        },
        book_offered: data.book_offered,
        book_requested: data.book_requested
      }

      setSwapRequest(transformedSwap)
    } catch (error) {
      console.error('Error fetching swap request:', error)
      setError('Failed to load swap request details')
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async () => {
    try {
      setLoading(true)
      setError('')

      const { error } = await supabase
        .from('book_swaps')
        .update({ 
          status: 'approved',
          approved_at: new Date().toISOString()
        })
        .eq('id', swapId)

      if (error) throw error

      // Create notification for requester
      await supabase
        .from('notifications')
        .insert({
          user_id: swapRequest?.requester_id,
          type: 'swap_approved',
          title: 'Swap Request Approved!',
          message: `Your swap request for "${swapRequest?.book_requested.title}" has been approved.`,
          related_swap_id: swapId
        })

      onSwapReviewed()
      onClose()
    } catch (error) {
      console.error('Error approving swap:', error)
      setError('Failed to approve swap request')
    } finally {
      setLoading(false)
    }
  }

  const handleDeny = async () => {
    try {
      setLoading(true)
      setError('')

      const { error } = await supabase
        .from('book_swaps')
        .update({ 
          status: 'denied'
        })
        .eq('id', swapId)

      if (error) throw error

      // Create notification for requester
      await supabase
        .from('notifications')
        .insert({
          user_id: swapRequest?.requester_id,
          type: 'swap_denied',
          title: 'Swap Request Denied',
          message: `Your swap request for "${swapRequest?.book_requested.title}" has been denied.`,
          related_swap_id: swapId
        })

      onSwapReviewed()
      onClose()
    } catch (error) {
      console.error('Error denying swap:', error)
      setError('Failed to deny swap request')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Review Swap Request</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading swap request...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <XCircle className="w-12 h-12 text-red-500 mx-auto mb-2" />
              <p className="text-red-600">{error}</p>
            </div>
          ) : swapRequest ? (
            <div className="space-y-6">
              {/* Requester Info */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-medium text-blue-900 mb-2">Swap Request from:</h3>
                <div className="flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-600" />
                  <span className="text-blue-800">
                    {swapRequest.requester.full_name || swapRequest.requester.email}
                  </span>
                </div>
                <p className="text-sm text-blue-600 mt-1">
                  Requested on {new Date(swapRequest.created_at).toLocaleDateString()}
                </p>
              </div>

              {/* Book Details */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* Book Being Requested (Your Book) */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-blue-600" />
                    Your Book (Being Requested)
                  </h4>
                  <div className="space-y-2">
                    <h5 className="font-semibold text-lg">{swapRequest.book_requested.title}</h5>
                    <p className="text-gray-600">by {swapRequest.book_requested.author}</p>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <MapPin className="w-4 h-4" />
                      <span>{swapRequest.book_requested.location}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Calendar className="w-4 h-4" />
                      <span>{swapRequest.book_requested.publishedYear}</span>
                    </div>
                    <div className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                      {swapRequest.book_requested.condition}
                    </div>
                  </div>
                </div>

                {/* Book Being Offered */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-green-600" />
                    Book Offered in Return
                  </h4>
                  <div className="space-y-2">
                    <h5 className="font-semibold text-lg">{swapRequest.book_offered.title}</h5>
                    <p className="text-gray-600">by {swapRequest.book_offered.author}</p>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <MapPin className="w-4 h-4" />
                      <span>{swapRequest.book_offered.location}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Calendar className="w-4 h-4" />
                      <span>{swapRequest.book_offered.publishedYear}</span>
                    </div>
                    <div className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                      {swapRequest.book_offered.condition}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={handleApprove}
                  disabled={loading}
                  className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Check className="w-5 h-5" />
                  Approve Swap
                </button>
                <button
                  onClick={handleDeny}
                  disabled={loading}
                  className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <XCircle className="w-5 h-5" />
                  Deny Swap
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
