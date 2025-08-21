import { Book, BookCondition } from '@/types/book'
import { MapPin, User, Calendar, Trash2, MessageSquare, Edit3, Check, X } from 'lucide-react'
import Rating from './Rating'
import { useState, useEffect } from 'react'
import { searchGoogleBooks, getGoogleBooksUrl, getGoogleBooksSearchUrl } from '@/lib/googleBooks'
import { supabase } from '@/lib/supabase'

interface BookCardProps {
  book: Book
  onSwapRequest?: (bookId: string) => void
  onDelete?: (bookId: string) => void
  onGenreClick?: (genre: string) => void
  onReviewClick?: (bookId: string, bookTitle?: string) => void
  showOwner?: boolean
  showReviewButton?: boolean
  averageRating?: number
  reviewCount?: number
  userRating?: number
  userReviewText?: string
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
  averageRating = 0,
  reviewCount = 0,
  userRating = 0,
  userReviewText = ''
}: BookCardProps) {
  const [googleBooksId, setGoogleBooksId] = useState<string | null>(null)
  const [isLoadingGoogleBooks, setIsLoadingGoogleBooks] = useState(false)
  const [googleBooksThumbnail, setGoogleBooksThumbnail] = useState<string | null>(null)
  const [isEditingDescription, setIsEditingDescription] = useState(false)
  const [editedDescription, setEditedDescription] = useState(book.description || '')
  const [isSavingDescription, setIsSavingDescription] = useState(false)

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
      return getGoogleBooksUrl(googleBooksId)
    }
    return getGoogleBooksSearchUrl(book.title, book.author)
  }

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
              {onSwapRequest && book.availableForSwap && (
                <button
                  onClick={() => onSwapRequest(book.id)}
                  className="btn-primary text-sm px-3 py-1"
                >
                  Request Swap
                </button>
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
                Shared by <span className="font-medium text-gray-700">@{book.ownerId}</span>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
