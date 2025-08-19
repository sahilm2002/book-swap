'use client'

import { useState, useEffect } from 'react'
import { X, MessageSquare } from 'lucide-react'
import Rating from './Rating'

interface Review {
  id?: string
  bookId: string
  userId?: string // Made optional since we get it from auth context
  rating: number
  review: string
  createdAt?: Date
  updatedAt?: Date
}

interface ReviewModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (review: Omit<Review, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => void
  bookTitle: string
  bookId: string // Add this prop for new reviews
  existingReview?: Review | null
  isLoading?: boolean
}

export default function ReviewModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  bookTitle, 
  bookId,
  existingReview,
  isLoading = false 
}: ReviewModalProps) {
  const [rating, setRating] = useState(existingReview?.rating || 0)
  const [review, setReview] = useState(existingReview?.review || '')
  const [errors, setErrors] = useState<{ rating?: string; review?: string }>({})

  useEffect(() => {
    if (existingReview) {
      setRating(existingReview.rating)
      setReview(existingReview.review)
    } else {
      setRating(0)
      setReview('')
    }
    setErrors({})
  }, [existingReview, isOpen])

  const handleSubmit = (e: React.FormEvent) => {
    console.log('Form submission started')
    e.preventDefault()
    
    // Validation
    const newErrors: { rating?: string; review?: string } = {}
    
    if (rating === 0) {
      newErrors.rating = 'Please select a rating'
    }
    
    const trimmedReview = review.trim()
    
    if (!trimmedReview) {
      newErrors.review = 'Please write a review'
    } else if (trimmedReview.length < 10) {
      newErrors.review = `Review must be at least 10 characters long (currently ${trimmedReview.length})`
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }
    
    console.log('Submitting review:', { bookId: existingReview?.bookId || bookId, rating, review: trimmedReview })
    
    onSubmit({
      bookId: existingReview?.bookId || bookId,
      rating,
      review: trimmedReview
    })
  }

  const handleClose = () => {
    if (!isLoading) {
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <MessageSquare className="w-6 h-6 text-primary-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {existingReview ? 'Edit Review' : 'Write a Review'}
              </h2>
              <p className="text-sm text-gray-600">for "{bookTitle}"</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Debug Info - Remove this after fixing */}
          <div className="bg-yellow-50 p-3 rounded text-xs border border-yellow-200">
            <p><strong>Debug Info:</strong></p>
            <p>Rating: {rating} {rating === 0 ? '❌' : '✅'}</p>
            <p>Review Length: {review.length} characters</p>
            <p>Trimmed Length: {review.trim().length} characters {review.trim().length < 10 ? '❌' : '✅'}</p>
            <p>Submit Button Disabled: {rating === 0 || review.trim().length < 10 ? 'Yes' : 'No'}</p>
          </div>
          
          {/* Rating */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Your Rating *
            </label>
            <Rating
              rating={rating}
              onRatingChange={setRating}
              size="lg"
              showValue
            />
            {errors.rating && (
              <p className="mt-2 text-sm text-red-600">{errors.rating}</p>
            )}
          </div>

          {/* Review Text */}
          <div>
            <label htmlFor="review" className="block text-sm font-medium text-gray-700 mb-3">
              Your Review *
            </label>
            <textarea
              id="review"
              value={review}
              onChange={(e) => setReview(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Share your thoughts about this book..."
              disabled={isLoading}
            />
            {errors.review && (
              <p className="mt-2 text-sm text-red-600">{errors.review}</p>
            )}
            <p className={`mt-1 text-sm ${
              review.trim().length < 10 
                ? 'text-red-500' 
                : review.trim().length >= 10 
                  ? 'text-green-600' 
                  : 'text-gray-500'
            }`}>
              {review.length} characters (trimmed: {review.trim().length}/500, minimum 10)
              {review.trim().length < 10 && (
                <span className="ml-2">⚠️ Too short</span>
              )}
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={isLoading}
              className="flex-1 btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || rating === 0 || review.trim().length < 10}
              className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {existingReview ? 'Updating...' : 'Submitting...'}
                </span>
              ) : (
                existingReview ? 'Update Review' : 'Submit Review'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
