'use client'

import { useState, useEffect } from 'react'
import { X, BookOpen, User, AlertCircle } from 'lucide-react'
import { Book } from '@/types/book'
import { createSwapRequest } from '@/lib/swapUtils'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'

interface SwapRequestModalProps {
  isOpen: boolean
  onClose: () => void
  requestedBook: Book
  onSwapRequested: () => void
  userBooks?: Book[] // Add this prop to receive books from parent
}

export default function SwapRequestModal({ 
  isOpen, 
  onClose, 
  requestedBook, 
  onSwapRequested,
  userBooks: initialUserBooks
}: SwapRequestModalProps) {
  const { user } = useAuth()
  const [userBooks, setUserBooks] = useState<Book[]>([])
  const [selectedBookId, setSelectedBookId] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string>('')

  // Use passed books or fetch if not provided
  useEffect(() => {
    if (initialUserBooks && initialUserBooks.length > 0) {
      console.log('Using passed user books:', initialUserBooks.length)
      setUserBooks(initialUserBooks)
      setSelectedBookId(initialUserBooks[0].id)
      setError('')
    } else {
      console.log('No passed books, attempting to fetch...')
      fetchUserBooks()
    }
  }, [initialUserBooks])

  const fetchUserBooks = async () => {
    try {
      console.log('=== fetchUserBooks called ===')
      console.log('User ID:', user?.id)
      console.log('User ID type:', typeof user?.id)
      console.log('User ID length:', user?.id?.length)
      console.log('User email:', user?.email)
      console.log('Querying books with owner_id:', user?.id)
      
      // Test UUID format
      if (user?.id) {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
        console.log('User ID matches UUID format:', uuidRegex.test(user.id))
      }
      
      // Skip the unnecessary auth test since useAuth is working
      console.log('Using user from useAuth, skipping redundant auth check')
      
      // Since the basic query is hanging, let's try a direct approach
      console.log('Attempting direct user books query...')
      
      // Try the specific query for user's books directly
      let { data: books, error } = await supabase
        .from('books')
        .select('*')
        .eq('owner_id', user?.id)
        .eq('available_for_swap', true)
        .order('title')

      if (error) {
        console.log('Direct query failed, trying alternative approach...')
        // Try with user_id field
        const { data: books2, error: error2 } = await supabase
          .from('books')
          .select('*')
          .eq('user_id', user?.id)
          .eq('available_for_swap', true)
          .order('title')
        
        if (!error2) {
          console.log('Alternative query succeeded!')
          books = books2
          error = null
        } else {
          console.log('Alternative query also failed:', error2)
        }
      }

      console.log('User books query result:', { books, error })

      if (error) {
        console.error('Database error:', error)
        setError(`Failed to load your books: ${error.message}`)
        return
      }

      // Filter out books that have pending swap requests
      let availableBooks = books || []
      if (books && books.length > 0) {
        console.log('Checking for pending swap requests...')
        
        // Get all swap requests for these books
        const bookIds = books.map(book => book.id)
        const { data: swapRequests, error: swapError } = await supabase
          .from('book_swaps')
          .select('*')
          .in('book_offered_id', bookIds)
          .eq('status', 'pending')
        
        if (swapError) {
          console.error('Error fetching swap requests:', swapError)
        } else {
          console.log('Found swap requests:', swapRequests)
          
          // Filter out books with pending swaps
          availableBooks = books.filter(book => {
            const hasPendingSwap = swapRequests?.some(swap => 
              swap.book_offered_id === book.id && swap.status === 'pending'
            )
            if (hasPendingSwap) {
              console.log(`Book "${book.title}" has pending swap, filtering out`)
            }
            return !hasPendingSwap
          })
          
          console.log('Books after filtering pending swaps:', availableBooks.length)
        }
      }

      console.log('Final available books for swap:', availableBooks?.length || 0)
      if (availableBooks && availableBooks.length > 0) {
        console.log('Available book details:', availableBooks.map(b => ({ id: b.id, title: b.title, owner_id: b.owner_id })))
      }
      
      setUserBooks(availableBooks || [])
      
      if (availableBooks && availableBooks.length > 0) {
        setSelectedBookId(availableBooks[0].id)
        console.log('Set selected book ID to:', availableBooks[0].id)
      } else {
        console.log('No available books found for user')
        console.log('This could mean:')
        console.log('1. User has no books')
        console.log('2. User has books but none are available for swap')
        console.log('3. User has books but all have pending swap requests')
      }
    } catch (error) {
      console.error('Error fetching user books:', error)
      setError('Failed to load your books')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    console.log('=== handleSubmit called ===')
    console.log('Selected book ID:', selectedBookId)
    console.log('Requested book:', requestedBook)
    
    if (!selectedBookId) {
      setError('Please select a book to offer in exchange')
      return
    }

    setIsLoading(true)
    setError('')
    console.log('Starting swap request creation...')

    try {
      console.log('Calling createSwapRequest...')
      
      // Add timeout to prevent hanging
      const swapRequestPromise = createSwapRequest({
        book_requested_id: requestedBook.id,
        book_offered_id: selectedBookId
      }, user?.id || '')
      
      const swapRequestTimeout = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Swap request creation timeout after 15 seconds')), 15000)
      )
      
      const { success, error: swapError, swapId } = await Promise.race([
        swapRequestPromise,
        swapRequestTimeout
      ]) as { success: boolean; error?: string; swapId?: string }

      console.log('createSwapRequest result:', { success, swapError, swapId })

      if (success && swapId) {
        console.log('Swap request created successfully, creating notification...')
        
        // Create notification for the book owner
        try {
          console.log('=== CREATING NOTIFICATION ===')
          console.log('Book owner ID:', requestedBook.ownerId)
          console.log('Book owner ID type:', typeof requestedBook.ownerId)
          console.log('Swap ID:', swapId)
          console.log('Swap ID type:', typeof swapId)
          console.log('Full requestedBook object:', requestedBook)
          
          // Try to get user info from the users table
          const { data: userInfo, error: userError } = await supabase
            .from('users')
            .select('id, email')
            .eq('id', requestedBook.ownerId)
            .single()
          console.log('User info from users table:', { userInfo, userError })
          
          console.log('Notification data:', {
            user_id: requestedBook.ownerId,
            type: 'swap_request',
            title: 'New Swap Request',
            message: `Someone wants to swap a book with you!`,
            related_swap_id: swapId
          })
          
          const { data: notificationData, error: notificationError } = await supabase
            .from('notifications')
            .insert({
              user_id: requestedBook.ownerId,
              type: 'swap_request',
              title: 'New Swap Request',
              message: `Someone wants to swap a book with you!`,
              related_swap_id: swapId
            })
            .select()
          
          if (notificationError) {
            console.error('Notification creation failed:', notificationError)
            throw notificationError
          }
          
          console.log('✅ Notification created successfully:', notificationData)
        } catch (notificationError) {
          console.error('❌ Error creating notification:', notificationError)
          // Don't fail the swap request if notification fails
        }

        onSwapRequested()
        onClose()
      } else {
        setError(swapError || 'Failed to create swap request')
      }
    } catch (error) {
      console.error('Error in handleSubmit:', error)
      setError(error instanceof Error ? error.message : 'Failed to create swap request')
    } finally {
      console.log('Setting loading to false')
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Request Book Swap</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Requested Book Info */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Book You Want:</h3>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <BookOpen className="w-6 h-6 text-blue-600 mt-1 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-blue-900 truncate">{requestedBook.title}</h4>
                  <p className="text-sm text-blue-700">by {requestedBook.author}</p>
                  {requestedBook.genre && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {requestedBook.genre.slice(0, 3).map((genre) => (
                        <span
                          key={genre}
                          className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full"
                        >
                          {genre}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Book Selection */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Select Your Book to Offer:</h3>
            {userBooks.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <BookOpen className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <p>You haven't added any books yet.</p>
                <p className="text-sm">Add some books to your collection first.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {userBooks.map((book) => (
                  <label
                    key={book.id}
                    className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedBookId === book.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="selectedBook"
                      value={book.id}
                      checked={selectedBookId === book.id}
                      onChange={(e) => setSelectedBookId(e.target.value)}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 truncate">{book.title}</h4>
                      <p className="text-sm text-gray-600">by {book.author}</p>
                      {book.genre && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {book.genre.slice(0, 2).map((genre) => (
                            <span
                              key={genre}
                              className="px-1.5 py-0.5 text-xs bg-gray-100 text-gray-600 rounded"
                            >
                              {genre}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <span className="text-sm text-red-700">{error}</span>
            </div>
          )}

          {/* Info Box */}
          <div className="mb-6 p-3 bg-gray-50 border border-gray-200 rounded-lg">
            <div className="flex items-start gap-2">
              <User className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-gray-600">
                <p className="font-medium mb-1">How it works:</p>
                <ol className="list-decimal list-inside space-y-1 text-xs">
                  <li>Select a book from your collection to offer in exchange</li>
                  <li>Submit your swap request</li>
                  <li>The book owner will review and approve/deny your request</li>
                  <li>If approved, you'll exchange contact information to arrange the swap</li>
                </ol>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={isLoading || userBooks.length === 0 || !selectedBookId}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'Sending Request...' : 'Send Swap Request'}
          </button>
        </div>
      </div>
    </div>
  )
}
