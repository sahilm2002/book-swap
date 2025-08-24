import { Book, BookCondition } from '@/types/book'
import { MapPin, User, Calendar, Trash2, MessageSquare, Edit3, Check, X, RefreshCw } from 'lucide-react'
import Rating from './Rating'
import { useState, useEffect } from 'react'
import { searchGoogleBooks, getGoogleBooksUrl, getGoogleBooksSearchUrl } from '@/lib/googleBooks'
import { supabase } from '@/lib/supabase'
import { toggleBookAvailability } from '@/lib/swapUtils'
import { useAuth } from '@/lib/auth-context'

interface BookCardProps {
  book: Book
  onEdit?: (book: Book) => void
  onDelete?: (bookId: string) => void
  onReviewClick?: (bookId: string) => void
  onGenreClick?: (genre: string) => void
  onSwapRequest?: (bookId: string) => void
  onSwapCancelled?: (bookId: string) => void
  showSwapToggle?: boolean
  showOwner?: boolean
  showReviewButton?: boolean
  averageRating?: number
  userRating?: number
  userReviewText?: string
  reviewCount?: number
}

const conditionLabels: Record<BookCondition, string> = {
  [BookCondition.NEW]: 'New',
  [BookCondition.LIKE_NEW]: 'Like New',
  [BookCondition.VERY_GOOD]: 'Very Good',
  [BookCondition.GOOD]: 'Good',
  [BookCondition.ACCEPTABLE]: 'Acceptable',
  [BookCondition.POOR]: 'Poor'
}

const conditionColors: Record<BookCondition, string> = {
  [BookCondition.NEW]: 'bg-green-100 text-green-800',
  [BookCondition.LIKE_NEW]: 'bg-blue-100 text-blue-800',
  [BookCondition.VERY_GOOD]: 'bg-indigo-100 text-indigo-800',
  [BookCondition.GOOD]: 'bg-yellow-100 text-yellow-800',
  [BookCondition.ACCEPTABLE]: 'bg-orange-100 text-orange-800',
  [BookCondition.POOR]: 'bg-red-100 text-red-800'
}

export default function BookCard({ 
  book, 
  onSwapRequest, 
  onDelete, 
  onGenreClick, 
  onReviewClick,
  showOwner = true, 
  showReviewButton = false,
  showSwapToggle = true,
  averageRating = 0,
  reviewCount = 0,
  userRating = 0,
  userReviewText = '',
  onSwapCancelled
}: BookCardProps) {
  const [googleBooksId, setGoogleBooksId] = useState<string | null>(null)
  const [isLoadingGoogleBooks, setIsLoadingGoogleBooks] = useState(false)
  const [googleBooksThumbnail, setGoogleBooksThumbnail] = useState<string | null>(null)
  const [isEditingDescription, setIsEditingDescription] = useState(false)
  const [editedDescription, setEditedDescription] = useState(book.description || '')
  const [isSavingDescription, setIsSavingDescription] = useState(false)
  const [isTogglingSwap, setIsTogglingSwap] = useState(false)
  const [swapAvailable, setSwapAvailable] = useState(book.availableForSwap || false)
  
  // Confirmation modal state
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [bookToCancel, setBookToCancel] = useState<string | null>(null)
  
  // Force re-render state
  const [forceUpdate, setForceUpdate] = useState(0)
  
  // Local state to track cancelled swaps
  const [cancelledSwapIds, setCancelledSwapIds] = useState<Set<string>>(new Set())
  
  // Simple state to track if current user's swap was cancelled
  const [isCurrentSwapCancelled, setIsCurrentSwapCancelled] = useState(false)
  const { user } = useAuth()

  // Fetch Google Books ID when component mounts
  useEffect(() => {
    const fetchGoogleBooksId = async () => {
      if (!book.title || !book.author) return
      
      setIsLoadingGoogleBooks(true)
      try {
        const query = `${book.title} ${book.author}`
        const books = await searchGoogleBooks(query)
        
        if (books.length > 0) {
          // Find the best match (exact title match)
          const exactMatch = books.find(b => 
            b.volumeInfo.title.toLowerCase() === book.title.toLowerCase()
          )
          const bestMatch = exactMatch || books[0]
          setGoogleBooksId(bestMatch.id)
          
          // Set thumbnail if available
          if (bestMatch.volumeInfo.imageLinks?.thumbnail) {
            setGoogleBooksThumbnail(bestMatch.volumeInfo.imageLinks.thumbnail)
          }
        }
      } catch (error) {
        console.error('Error fetching Google Books ID:', error)
      } finally {
        setIsLoadingGoogleBooks(false)
      }
    }

    fetchGoogleBooksId()
  }, [book.title, book.author])

  // Get the appropriate Google Books URL
  const getGoogleBooksLink = () => {
    if (googleBooksId) {
      return `https://books.google.com/books?id=${googleBooksId}`
    }
    return getGoogleBooksSearchUrl(book.title, book.author)
  }

  // Determine swap button state
  const getSwapButtonState = () => {
    console.log('=== getSwapButtonState called ===')
    console.log('Book:', book.title)
    console.log('Available for swap:', book.availableForSwap)
    console.log('Is current swap cancelled:', isCurrentSwapCancelled)
    console.log('Book swap requests:', book.swapRequests)
    console.log('Current user:', user?.id)
    console.log('Current user type:', typeof user?.id)
    
    if (!book.availableForSwap) {
      console.log('Returning: not-available')
      return 'not-available'
    }
    
    // If current user's swap was cancelled locally, allow requesting again
    if (isCurrentSwapCancelled) {
      console.log('Returning: can-request (local cancelled state)')
      return 'can-request'
    }
    
    // Check if current user has already requested a swap for this book
    if (book.swapRequests && book.swapRequests.length > 0) {
      console.log('Found swap requests:', book.swapRequests)
      console.log('Looking for requester_id matching:', user?.id)
      
      const currentUserSwapRequest = book.swapRequests.find(swap => {
        console.log('Checking swap:', swap)
        console.log('Swap requester_id:', swap.requester_id)
        console.log('Swap requester_id type:', typeof swap.requester_id)
        console.log('User ID:', user?.id)
        console.log('User ID type:', typeof user?.id)
        console.log('Match?', swap.requester_id === user?.id)
        return swap.requester_id === user?.id
      })
      
      console.log('Current user swap request found:', currentUserSwapRequest)
      
      if (currentUserSwapRequest) {
        switch (currentUserSwapRequest.status) {
          case 'pending':
            console.log('Returning: swap-requested (pending)')
            return 'swap-requested'
          case 'approved':
            console.log('Returning: swap-approved')
            return 'swap-approved'
          case 'denied':
            console.log('Returning: swap-denied')
            return 'swap-denied'
          case 'completed':
            console.log('Returning: swap-completed')
            return 'swap-completed'
          case 'cancelled':
            console.log('Returning: can-request (cancelled)')
            return 'can-request' // Allow requesting again after cancellation
          default:
            console.log('Returning: swap-requested (default)')
            return 'swap-requested'
        }
      }
    } else {
      console.log('No swap requests found for this book')
    }
    
    console.log('Returning: can-request (no swap request)')
    return 'can-request'
  }

  const swapButtonState = getSwapButtonState()

  // Recalculate swap button state when relevant state changes
  useEffect(() => {
    // This will trigger a re-render when cancelledSwapIds changes
  }, [cancelledSwapIds, forceUpdate])

  // Initialize the cancelled state based on book data
  useEffect(() => {
    console.log('=== Initializing cancelled state ===')
    console.log('Book swap requests:', book.swapRequests)
    console.log('Current user:', user?.id)
    
    if (book.swapRequests && user) {
      const currentUserSwap = book.swapRequests.find(swap => 
        swap.requester_id === user.id
      )
      console.log('Found current user swap:', currentUserSwap)
      
      if (currentUserSwap) {
        const isCancelled = currentUserSwap.status === 'cancelled'
        console.log('Setting isCurrentSwapCancelled to:', isCancelled)
        console.log('Based on swap status:', currentUserSwap.status)
        setIsCurrentSwapCancelled(isCancelled)
      } else {
        console.log('No current user swap found, setting isCurrentSwapCancelled to false')
        setIsCurrentSwapCancelled(false)
      }
    } else {
      console.log('No swap requests or user, setting isCurrentSwapCancelled to false')
      setIsCurrentSwapCancelled(false)
    }
  }, [book.swapRequests, user])

  // Watch for changes in book.swapRequests and update local state accordingly
  useEffect(() => {
    console.log('=== Book swap requests changed ===')
    console.log('New swap requests:', book.swapRequests)
    console.log('Current user:', user?.id)
    
    if (book.swapRequests && user) {
      const currentUserSwap = book.swapRequests.find(swap => 
        swap.requester_id === user.id
      )
      console.log('Current user swap in updated data:', currentUserSwap)
      
      if (currentUserSwap) {
        const isCancelled = currentUserSwap.status === 'cancelled'
        console.log('Updating isCurrentSwapCancelled to:', isCancelled)
        console.log('Based on swap status:', currentUserSwap.status)
        setIsCurrentSwapCancelled(isCancelled)
      } else {
        console.log('No current user swap in updated data, setting isCurrentSwapCancelled to false')
        setIsCurrentSwapCancelled(false)
      }
    }
  }, [book.swapRequests, user])

  // Handle description editing
  const handleEditDescription = () => {
    setIsEditingDescription(true)
    setEditedDescription(book.description || '')
  }

  const handleCancelEdit = () => {
    setIsEditingDescription(false)
    setEditedDescription(book.description || '')
  }

  const handleSaveDescription = async () => {
    if (editedDescription === book.description) {
      setIsEditingDescription(false)
      return
    }

    setIsSavingDescription(true)
    try {
      const { error } = await supabase
        .from('books')
        .update({ description: editedDescription })
        .eq('id', book.id)

      if (error) throw error

      // Update the local book object
      book.description = editedDescription
      setIsEditingDescription(false)
    } catch (error) {
      console.error('Error updating description:', error)
      // Reset to original description on error
      setEditedDescription(book.description || '')
    } finally {
      setIsSavingDescription(false)
    }
  }

  // Handle swap availability toggle
  const handleSwapToggle = async () => {
    if (isTogglingSwap) return
    
    setIsTogglingSwap(true)
    try {
      const newStatus = !swapAvailable
      const { success, error } = await toggleBookAvailability(book.id, newStatus)
      
      if (success) {
        setSwapAvailable(newStatus)
        // Update the local book object
        book.availableForSwap = newStatus
      } else {
        console.error('Error toggling swap availability:', error)
      }
    } catch (error) {
      console.error('Error toggling swap availability:', error)
    } finally {
      setIsTogglingSwap(false)
    }
  }

  // Handle cancel swap request
  const handleCancelSwap = async (bookId: string) => {
    // Show confirmation modal instead of immediate cancellation
    setBookToCancel(bookId)
    setShowCancelModal(true)
  }

  // Actually cancel the swap after confirmation
  const confirmCancelSwap = async () => {
    if (!bookToCancel || isTogglingSwap) return

    console.log('Starting swap cancellation for book:', book.id)
    console.log('Current user:', user?.id)
    console.log('Book swap requests:', book.swapRequests)
    
    setIsTogglingSwap(true)
    try {
      // Find the swap request for this book by the current user
      const currentUserSwapRequest = book.swapRequests?.find(swap => 
        swap.requester_id === user?.id
      )
      
      console.log('Found swap request to cancel:', currentUserSwapRequest)
      
      if (!currentUserSwapRequest) {
        console.error('No swap request found to cancel')
        return
      }

      console.log('Updating swap status to cancelled in database...')
      
      // Update the swap status to cancelled
      const { error } = await supabase
        .from('book_swaps')
        .update({ 
          status: 'cancelled',
          cancelled_at: new Date().toISOString()
        })
        .eq('id', currentUserSwapRequest.id)

      if (error) {
        console.error('Database error cancelling swap:', error)
        throw error
      }

      console.log('Successfully updated swap status to cancelled')

      // Create notification for the book owner about cancellation
      console.log('Creating cancellation notification for owner:', book.ownerId)
      
      const { error: notificationError } = await supabase
        .from('notifications')
        .insert({
          user_id: book.ownerId,
          type: 'swap_cancelled',
          title: 'Swap Request Cancelled',
          message: `A swap request for "${book.title}" has been cancelled.`,
          related_swap_id: currentUserSwapRequest.id
        })

      if (notificationError) {
        console.error('Error creating notification:', notificationError)
      } else {
        console.log('Successfully created cancellation notification')
      }

      // Update the local book object
      if (book.swapRequests) {
        book.swapRequests = book.swapRequests.map(swap => 
          swap.requester_id === user?.id ? { ...swap, status: 'cancelled' } : swap
        )
        console.log('Updated local book swap requests:', book.swapRequests)
      }

      // Add to local cancelled swaps set
      setCancelledSwapIds(prev => new Set([...prev, currentUserSwapRequest.id]))

      // Set the current swap as cancelled
      setIsCurrentSwapCancelled(true)
      console.log('Set isCurrentSwapCancelled to true')

      // Force a re-render by updating local state
      setSwapAvailable(book.availableForSwap || false)
      
      // Call the callback to refresh parent component
      onSwapCancelled?.(book.id)
      
      // Close the modal
      setShowCancelModal(false)
      setBookToCancel(null)
      
      // Force component re-render
      setForceUpdate(prev => prev + 1)
      
      console.log('Swap cancellation completed successfully')
      
      // Reset the local cancelled state after a short delay to allow parent refresh
      setTimeout(() => {
        console.log('Resetting local cancelled state to sync with database')
        setIsCurrentSwapCancelled(false)
      }, 1000)
      
    } catch (error) {
      console.error('Error cancelling swap request:', error)
    } finally {
      setIsTogglingSwap(false)
    }
  }

  return (
    <div className="card hover:shadow-md transition-shadow duration-200">
      <div className="flex gap-4">
        {/* Book Cover - Google Books Link with optional thumbnail */}
        <div className="flex-shrink-0 relative">
          {googleBooksThumbnail ? (
            <div className="relative">
              <img
                src={googleBooksThumbnail}
                alt={`Cover of ${book.title}`}
                className="w-20 h-32 rounded-md object-cover border border-gray-200"
              />
              <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-all duration-200 rounded-md flex items-center justify-center">
                <a
                  href={getGoogleBooksLink()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-medium text-white bg-blue-600 px-2 py-1 rounded opacity-0 hover:opacity-100 transition-opacity duration-200"
                  title={`View "${book.title}" on Google Books`}
                >
                  View on Google Books
                </a>
              </div>
            </div>
          ) : (
            <div className="w-20 h-32 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-md flex items-center justify-center border-2 border-dashed border-gray-300">
              <div className="text-center p-2">
                {isLoadingGoogleBooks ? (
                  <div className="text-xs text-gray-500">
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600 mx-auto mb-1"></div>
                    Loading...
                  </div>
                ) : (
                  <>
                    <div className="text-xs text-gray-500 mb-1">View on</div>
                    <a
                      href={getGoogleBooksLink()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-medium text-blue-600 hover:text-blue-800 underline"
                      title={googleBooksId ? `View "${book.title}" on Google Books` : `Search for "${book.title}" on Google Books`}
                    >
                      {googleBooksId ? 'Google Books' : 'Search Google Books'}
                    </a>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Book Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-2">
            <h3 className="text-lg font-semibold text-gray-900 truncate">
              <a
                href={getGoogleBooksLink()}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-900 hover:text-blue-600 hover:underline transition-colors"
                title={`Search for "${book.title}" on Google Books`}
              >
                {book.title}
              </a>
            </h3>
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${conditionColors[book.condition]}`}>
              {conditionLabels[book.condition]}
            </span>
          </div>

          <p className="text-gray-600 mb-2 flex items-center gap-1">
            <User className="w-4 h-4" />
            <span className="truncate">{book.author}</span>
          </p>

          {/* ISBN Display */}
          {book.isbn && (
            <p className="text-gray-600 mb-2 flex items-center gap-1">
              <span className="text-sm font-medium text-gray-500">ISBN:</span>
              <span className="font-mono text-sm">{book.isbn}</span>
            </p>
          )}

          {/* Language Display */}
          {book.language && (
            <p className="text-gray-600 mb-2 flex items-center gap-1">
              <span className="text-sm font-medium text-gray-500">Language:</span>
              <span className="text-sm">{book.language}</span>
            </p>
          )}

          {/* Book Description */}
          {book.description && (
            <div className="mb-3 p-3 bg-gray-50 rounded-md border border-gray-200">
              <h4 className="text-sm font-medium text-gray-700 mb-1">Description:</h4>
              {isEditingDescription ? (
                <div className="flex items-center gap-2">
                  <textarea
                    className="flex-1 p-2 border border-gray-300 rounded-md text-gray-900 bg-white resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={editedDescription}
                    onChange={(e) => setEditedDescription(e.target.value)}
                    rows={3}
                    placeholder="Enter book description..."
                    style={{ color: '#111827' }}
                  />
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={handleSaveDescription}
                      disabled={isSavingDescription}
                      className="p-1 text-green-600 hover:bg-green-50 rounded-md disabled:opacity-50"
                      title="Save description"
                    >
                      {isSavingDescription ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                      ) : (
                        <Check className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      disabled={isSavingDescription}
                      className="p-1 text-red-600 hover:bg-red-50 rounded-md disabled:opacity-50"
                      title="Cancel editing"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {book.description}
                  </p>
                  <button
                    onClick={handleEditDescription}
                    className="p-1 text-blue-600 hover:bg-blue-50 rounded-md"
                    title="Edit description"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Rating Display */}
          {(averageRating > 0 || userRating > 0) && (
            <div className="mb-2">
              {userRating > 0 && (
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm text-gray-600">Your rating:</span>
                  <Rating rating={userRating} readonly size="sm" />
                </div>
              )}
              {averageRating > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Community:</span>
                  <Rating rating={averageRating} readonly size="sm" />
                  <span className="text-sm text-gray-500">({reviewCount} reviews)</span>
                </div>
              )}
              
              {/* Display user's review text - clearly separated from description */}
              {userReviewText && (
                <div className="mt-3 p-3 bg-blue-50 rounded-md border border-blue-200">
                  <h4 className="text-sm font-medium text-blue-700 mb-1">Your Review:</h4>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {userReviewText}
                  </p>
                </div>
              )}
            </div>
          )}

          {book.publishedYear && (
            <p className="text-gray-600 mb-2 flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>{book.publishedYear}</span>
            </p>
          )}

          <div className="flex flex-wrap gap-1 mb-3">
            {book.genre.slice(0, 3).map((genre) => (
              <button
                key={genre}
                onClick={() => onGenreClick?.(genre)}
                className={`px-2 py-1 text-xs rounded-full transition-colors ${
                  onGenreClick 
                    ? 'bg-gray-100 text-gray-700 hover:bg-gray-200 cursor-pointer' 
                    : 'bg-gray-100 text-gray-700'
                }`}
                title={onGenreClick ? `Filter by ${genre}` : undefined}
              >
                {genre}
              </button>
            ))}
            {book.genre.length > 3 && (
              <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full">
                +{book.genre.length - 3} more
              </span>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 text-sm text-gray-500">
              <MapPin className="w-4 h-4" />
              <span>{book.location}</span>
            </div>

            <div className="flex gap-2">
              {/* Swap Availability Toggle */}
              {showSwapToggle && (
                <button
                  onClick={handleSwapToggle}
                  disabled={isTogglingSwap}
                  className={`flex items-center gap-1 px-3 py-1 text-sm rounded-md transition-all duration-200 ${
                    swapAvailable
                      ? 'bg-green-100 text-green-700 hover:bg-green-200 border border-green-300'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-300'
                  } ${isTogglingSwap ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  title={swapAvailable ? 'Available for swap - Click to make unavailable' : 'Not available for swap - Click to make available'}
                >
                  <RefreshCw className={`w-4 h-4 ${isTogglingSwap ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">
                    {swapAvailable ? 'Available' : 'Unavailable'}
                  </span>
                </button>
              )}

              {onSwapRequest && book.availableForSwap && (
                (() => {
                  // Use the getSwapButtonState function to determine button state
                  const buttonState = getSwapButtonState()
                  
                  switch (buttonState) {
                    case 'swap-requested':
                      return (
                        <button
                          onClick={() => handleCancelSwap(book.id)}
                          className="btn-secondary text-sm px-3 py-1 bg-yellow-100 text-yellow-700 hover:bg-yellow-200 border border-yellow-300 cursor-pointer"
                          title="Click to cancel swap request"
                        >
                          Swap Requested
                        </button>
                      )
                    case 'swap-approved':
                      return (
                        <button
                          disabled
                          className="btn-secondary text-sm px-3 py-1 bg-green-100 text-green-700 cursor-not-allowed"
                          title="Swap approved - waiting for completion"
                        >
                          Swap Approved
                        </button>
                      )
                    case 'swap-denied':
                      return (
                        <button
                          disabled
                          className="btn-secondary text-sm px-3 py-1 bg-red-100 text-red-700 cursor-not-allowed"
                          title="Swap request denied"
                        >
                          Swap Denied
                        </button>
                      )
                    case 'swap-completed':
                      return (
                        <button
                          disabled
                          className="btn-secondary text-sm px-3 py-1 bg-gray-100 text-gray-700 cursor-not-allowed"
                          title="Swap completed"
                        >
                          Swap Completed
                        </button>
                      )
                    case 'can-request':
                      return (
                        <button
                          onClick={() => onSwapRequest(book.id)}
                          className="btn-primary text-sm px-3 py-1"
                        >
                          Request Swap
                        </button>
                      )
                    case 'not-available':
                    default:
                      return null
                  }
                })()
              )}
              
              {showReviewButton && onReviewClick && (
                <button
                  onClick={() => onReviewClick(book.id)}
                  className="btn-secondary text-sm px-3 py-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                  title="Rate and review this book"
                >
                  <MessageSquare className="w-4 h-4" />
                </button>
              )}
              
              {onDelete && (
                <button
                  onClick={() => onDelete(book.id)}
                  className="btn-secondary text-sm px-3 py-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                  title="Delete this book"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {showOwner && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <p className="text-sm text-gray-500">
                Shared by <span className="font-medium text-gray-700">
                  @{book.ownerUsername || book.ownerEmail?.split('@')[0] || 'Unknown User'}
                </span>
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      {showCancelModal && bookToCancel && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Confirm Cancellation</h3>
            <p className="text-sm text-gray-700 mb-4">
              Are you sure you want to cancel the swap request for "{book.title}"? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowCancelModal(false)}
                className="btn-secondary text-sm px-4 py-2"
              >
                Cancel
              </button>
              <button
                onClick={confirmCancelSwap}
                className="btn-primary text-sm px-4 py-2"
              >
                Confirm Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}