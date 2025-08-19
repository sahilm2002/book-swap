import Image from 'next/image'
import { useState } from 'react'
import { Book, BookCondition } from '@/types/book'
import { MapPin, User, Calendar, BookOpen, Trash2, MessageSquare, Star, RefreshCw } from 'lucide-react'
import Rating from './Rating'

interface BookCardProps {
  book: Book
  onSwapRequest?: (bookId: string) => void
  onDelete?: (bookId: string) => void
  onGenreClick?: (genre: string) => void
  onReviewClick?: (bookId: string, bookTitle?: string) => void
  onRefreshCover?: (bookId: string, title: string, author: string) => void
  showOwner?: boolean
  showReviewButton?: boolean
  showRefreshButton?: boolean
  averageRating?: number
  reviewCount?: number
  userRating?: number
  userReviewText?: string
  isCoverLoading?: boolean
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
  onRefreshCover,
  showOwner = true, 
  showReviewButton = false,
  showRefreshButton = false,
  averageRating = 0,
  reviewCount = 0,
  userRating = 0,
  userReviewText = '',
  isCoverLoading = false
}: BookCardProps) {
  const [imageError, setImageError] = useState(false)
  const [imageLoading, setImageLoading] = useState(true)

  const handleImageError = () => {
    setImageError(true)
    setImageLoading(false)
  }

  const handleImageLoad = () => {
    setImageLoading(false)
  }

  return (
    <div className="card hover:shadow-md transition-shadow duration-200">
      <div className="flex gap-4">
        {/* Book Cover */}
        <div className="flex-shrink-0 relative">
          {book.coverImage && !imageError ? (
            <div className="relative">
              {(imageLoading || isCoverLoading) && (
                <div className="absolute inset-0 bg-gray-200 rounded-md flex items-center justify-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
                </div>
              )}
              <Image
                src={book.coverImage}
                alt={`Cover of ${book.title}`}
                width={80}
                height={120}
                className="rounded-md object-cover"
                onError={(e) => {
                  console.error(`Image failed to load for ${book.title}:`, book.coverImage, e)
                  handleImageError()
                }}
                onLoad={handleImageLoad}
                style={{ display: (imageLoading || isCoverLoading) ? 'none' : 'block' }}
                unoptimized={false}
                priority={false}
              />
              
              {/* Refresh Cover Button */}
              {showRefreshButton && onRefreshCover && (
                <button
                  onClick={() => onRefreshCover(book.id, book.title, book.author)}
                  disabled={isCoverLoading}
                  className="absolute -top-2 -right-2 p-1 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Refresh book cover"
                >
                  <RefreshCw className={`w-3 h-3 ${isCoverLoading ? 'animate-spin' : ''}`} />
                </button>
              )}
            </div>
          ) : (
            <div className="w-20 h-[120px] bg-gray-200 rounded-md flex items-center justify-center relative">
              <BookOpen className="w-8 h-8 text-gray-400" />
              
              {/* Show cover URL if it exists but failed to load */}
              {book.coverImage && (
                <div className="absolute bottom-0 left-0 right-0 bg-red-100 text-red-600 text-xs p-1 text-center">
                  Cover failed to load
                </div>
              )}
              
              {/* Refresh Cover Button for books without covers */}
              {showRefreshButton && onRefreshCover && (
                <button
                  onClick={() => onRefreshCover(book.id, book.title, book.author)}
                  disabled={isCoverLoading}
                  className="absolute -top-2 -right-2 p-1 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Fetch book cover"
                >
                  <RefreshCw className={`w-3 h-3 ${isCoverLoading ? 'animate-spin' : ''}`} />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Book Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-2">
            <h3 className="text-lg font-semibold text-gray-900 truncate">
              {book.title}
            </h3>
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${conditionColors[book.condition]}`}>
              {conditionLabels[book.condition]}
            </span>
          </div>

          <p className="text-gray-600 mb-2 flex items-center gap-1">
            <User className="w-4 h-4" />
            <span className="truncate">{book.author}</span>
          </p>

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
              
              {/* Display user's review text */}
              {userReviewText && (
                <div className="mt-2 p-2 bg-blue-50 rounded-md border border-blue-200">
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">Your review:</span> {userReviewText}
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
