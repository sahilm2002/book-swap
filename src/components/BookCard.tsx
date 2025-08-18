import Image from 'next/image'
import { Book, BookCondition } from '@/types/book'
import { MapPin, User, Calendar, BookOpen } from 'lucide-react'

interface BookCardProps {
  book: Book
  onSwapRequest?: (bookId: string) => void
  showOwner?: boolean
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

export default function BookCard({ book, onSwapRequest, showOwner = true }: BookCardProps) {
  return (
    <div className="card hover:shadow-md transition-shadow duration-200">
      <div className="flex gap-4">
        {/* Book Cover */}
        <div className="flex-shrink-0">
          {book.coverImage ? (
            <Image
              src={book.coverImage}
              alt={`Cover of ${book.title}`}
              width={80}
              height={120}
              className="rounded-md object-cover"
            />
          ) : (
            <div className="w-20 h-30 bg-gray-200 rounded-md flex items-center justify-center">
              <BookOpen className="w-8 h-8 text-gray-400" />
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

          {book.publishedYear && (
            <p className="text-gray-600 mb-2 flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>{book.publishedYear}</span>
            </p>
          )}

          <div className="flex flex-wrap gap-1 mb-3">
            {book.genre.slice(0, 3).map((genre) => (
              <span
                key={genre}
                className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full"
              >
                {genre}
              </span>
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

            {onSwapRequest && book.availableForSwap && (
              <button
                onClick={() => onSwapRequest(book.id)}
                className="btn-primary text-sm px-3 py-1"
              >
                Request Swap
              </button>
            )}
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
