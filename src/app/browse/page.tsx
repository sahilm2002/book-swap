'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Filter } from 'lucide-react'
import BookCard from '@/components/BookCard'
import ReviewModal from '@/components/ReviewModal'
import { Book, BookCondition } from '@/types/book'
import { supabase } from '@/lib/supabase'
import { fetchBookCover } from '@/lib/bookCovers'
import { fetchMissingCovers as fetchMissingCoversUtil } from '@/lib/bookCoverUtils'

interface Review {
  id: string
  bookId: string
  userId: string
  rating: number
  review: string
  createdAt: Date
  updatedAt: Date
}

interface BookWithReviews extends Book {
  averageRating: number
  reviewCount: number
  userRating?: number
}

export default function BrowsePage() {
  const router = useRouter()
  const [books, setBooks] = useState<BookWithReviews[]>([])
  const [reviews, setReviews] = useState<Review[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedGenre, setSelectedGenre] = useState<string>('')
  const [selectedCondition, setSelectedCondition] = useState<BookCondition | ''>('')
  const [showFilters, setShowFilters] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [coverLoading, setCoverLoading] = useState<Set<string>>(new Set())
  
  // Review modal state
  const [reviewModal, setReviewModal] = useState<{
    isOpen: boolean
    bookId: string
    bookTitle: string
    existingReview: Review | null
  }>({
    isOpen: false,
    bookId: '',
    bookTitle: '',
    existingReview: null
  })
  const [bookStats, setBookStats] = useState<Map<string, { averageRating: number; reviewCount: number }>>(new Map())

  const genres = ['Fiction', 'Non-Fiction', 'Mystery', 'Romance', 'Science Fiction', 'Fantasy', 'Biography', 'History', 'Self-Help', 'Business', 'Technology', 'Art', 'Poetry', 'Drama', 'Horror', 'Adventure', 'Classic', 'Dystopian', 'Political', 'Historical Fiction']
  const conditions = Object.values(BookCondition)

  useEffect(() => {
    fetchBooks()
  }, [])

  const fetchBooks = async () => {
    try {
      setLoading(true)
      setError('')
      
      const { data: booksData, error } = await supabase
        .from('books')
        .select(`
          *,
          users!books_owner_id_fkey (
            username,
            full_name
          )
        `)
        .eq('available_for_swap', true)
        .order('created_at', { ascending: false })

      if (error) {
        throw error
      }

      // Transform the data to match the Book type
      const transformedBooks: BookWithReviews[] = booksData?.map(book => ({
        id: book.id,
        title: book.title,
        author: book.author,
        genre: book.genre || [],
        description: book.description,
        coverImage: book.cover_image || null,
        publishedYear: book.published_year,
        pageCount: book.page_count,
        language: book.language,
        condition: book.condition,
        ownerId: book.users?.username || book.owner_id,
        location: book.location,
        availableForSwap: book.available_for_swap,
        createdAt: new Date(book.created_at),
        updatedAt: new Date(book.updated_at),
        averageRating: 0,
        reviewCount: 0
      })) || []

      setBooks(transformedBooks)

      // Try to fetch missing covers for books without them
      await fetchMissingCovers(transformedBooks)
      
      // Fetch reviews and ratings
      await fetchBookReviewsAndRatings(transformedBooks)
    } catch (err: any) {
      console.error('Error fetching books:', err)
      setError(err.message || 'Failed to fetch books')
    } finally {
      setLoading(false)
    }
  }

  const fetchMissingCovers = async (booksList: BookWithReviews[]) => {
    await fetchMissingCoversUtil(booksList, {
      onUpdate: (bookId: string, coverUrl: string) => {
        setBooks(prev => prev.map(b => 
          b.id === bookId ? { ...b, coverImage: coverUrl } : b
        ))
      },
      onLoadingChange: (bookId: string, isLoading: boolean) => {
        setCoverLoading(prev => {
          const newSet = new Set(prev)
          if (isLoading) {
            newSet.add(bookId)
          } else {
            newSet.delete(bookId)
          }
          return newSet
        })
      }
    })
  }

  const fetchBookReviewsAndRatings = async (booksList: Book[]) => {
    try {
      const bookIds = booksList.map(book => book.id)
      const { data: reviewsData, error } = await supabase
        .from('book_reviews')
        .select('*')
        .in('book_id', bookIds)
      
      if (error) {
        console.error('Error fetching reviews:', error)
        return
      }
      
      // Transform the data to match our Review interface
      const transformedReviews = reviewsData.map(review => ({
        id: review.id,
        bookId: review.book_id,
        userId: review.user_id,
        rating: review.rating,
        review: review.review,
        createdAt: review.created_at,
        updatedAt: review.updated_at
      }))
      
      setReviews(transformedReviews)
      
      // Calculate average ratings and review counts for each book
      const bookStats = new Map()
      booksList.forEach(book => {
        const bookReviews = transformedReviews.filter(r => r.bookId === book.id)
        const totalRating = bookReviews.reduce((sum, r) => sum + r.rating, 0)
        const averageRating = bookReviews.length > 0 ? totalRating / bookReviews.length : 0
        
        bookStats.set(book.id, {
          averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
          reviewCount: bookReviews.length
        })
      })
      
      setBookStats(bookStats)
    } catch (error) {
      console.error('Error fetching reviews and ratings:', error)
    }
  }

  const handleReviewSubmit = async (reviewData: { bookId: string; rating: number; review: string }) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      const existingReview = reviews.find(r => r.bookId === reviewData.bookId && r.userId === user.id)
      
      if (existingReview) {
        // Update existing review
        const { error } = await supabase
          .from('book_reviews')
          .update({
            rating: reviewData.rating,
            review: reviewData.review,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingReview.id)

        if (error) throw error

        // Update local state
        setReviews(prev => prev.map(r => 
          r.id === existingReview.id 
            ? { ...r, rating: reviewData.rating, review: reviewData.review, updatedAt: new Date() }
            : r
        ))
      } else {
        // Create new review
        const { error } = await supabase
          .from('book_reviews')
          .insert([{
            book_id: reviewData.bookId,
            user_id: user.id,
            rating: reviewData.rating,
            review: reviewData.review
          }])

        if (error) throw error

        // Refresh reviews and ratings
        await fetchBookReviewsAndRatings(books)
      }

      // Close modal
      setReviewModal(prev => ({ ...prev, isOpen: false }))
      
      // Show success message
      console.log('Review submitted successfully!')
    } catch (error: any) {
      console.error('Error submitting review:', error)
    }
  }

  const openReviewModal = async (bookId: string, bookTitle: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        console.error('User not authenticated')
        return
      }
      
      const existingReview = reviews.find(r => r.bookId === bookId && r.userId === user.id)
      setReviewModal({
        isOpen: true,
        bookId,
        bookTitle,
        existingReview: existingReview || null
      })
    } catch (error) {
      console.error('Error opening review modal:', error)
    }
  }

  const filteredBooks = books.filter(book => {
    const matchesSearch = book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         book.author.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesGenre = !selectedGenre || book.genre.includes(selectedGenre)
    const matchesCondition = !selectedCondition || book.condition === selectedCondition
    
    return matchesSearch && matchesGenre && matchesCondition
  })

  const handleSwapRequest = (bookId: string) => {
    // TODO: Implement swap request functionality
    // Swap request functionality will be implemented in future updates
  }

  const clearFilters = () => {
    setSearchQuery('')
    setSelectedGenre('')
    setSelectedCondition('')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading books...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Browse Books</h1>
          <p className="text-gray-600">Discover amazing books shared by our community</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Search and Filters */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            {/* Search Bar */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by title, author, or genre..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-field pl-10"
              />
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="btn-secondary flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              Filters
            </button>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <div className="bg-white p-6 rounded-lg border border-gray-200 mb-4">
              <div className="grid md:grid-cols-3 gap-6">
                {/* Genre Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Genre
                  </label>
                  <select
                    value={selectedGenre}
                    onChange={(e) => setSelectedGenre(e.target.value)}
                    className="input-field"
                  >
                    <option value="">All Genres</option>
                    {genres.map(genre => (
                      <option key={genre} value={genre}>{genre}</option>
                    ))}
                  </select>
                </div>

                {/* Condition Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Condition
                  </label>
                  <select
                    value={selectedCondition}
                    onChange={(e) => setSelectedCondition(e.target.value as BookCondition | '')}
                    className="text-gray-700"
                  >
                    <option value="">All Conditions</option>
                    {conditions.map(condition => (
                      <option key={condition} value={condition}>
                        {condition.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Clear Filters */}
                <div className="flex items-end">
                  <button
                    onClick={clearFilters}
                    className="btn-secondary w-full"
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600">{error}</p>
            <button
              onClick={fetchBooks}
              className="mt-2 text-red-600 hover:text-red-800 underline"
            >
              Try again
            </button>
          </div>
        )}

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-gray-600">
            Showing {filteredBooks.length} of {books.length} books
          </p>
        </div>

        {/* Books Grid */}
        {filteredBooks.length > 0 ? (
          <div className="grid gap-6">
            {filteredBooks.map(book => {
              const userReview = reviews.find(r => r.bookId === book.id)
              const bookStat = bookStats.get(book.id)
              
              return (
                <BookCard
                  key={book.id}
                  book={book}
                  onSwapRequest={handleSwapRequest}
                  onGenreClick={(genre) => setSelectedGenre(genre)}
                  onReviewClick={async (bookId) => await openReviewModal(bookId, book.title)}
                  showReviewButton={true}
                  averageRating={bookStat?.averageRating || 0}
                  reviewCount={bookStat?.reviewCount || 0}
                  userRating={userReview?.rating || 0}
                  userReviewText={userReview?.review || ''}
                />
              )
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No books found</h3>
            <p className="text-gray-600 mb-4">
              {books.length === 0 
                ? "No books have been shared yet. Be the first to add a book!"
                : "Try adjusting your search terms or filters to find more books."
              }
            </p>
            {books.length === 0 ? (
              <button
                onClick={() => router.push('/add-book')}
                className="btn-primary"
              >
                Add the First Book
              </button>
            ) : (
              <button
                onClick={clearFilters}
                className="btn-primary"
              >
                Clear All Filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* Review Modal */}
      <ReviewModal
        isOpen={reviewModal.isOpen}
        onClose={() => setReviewModal(prev => ({ ...prev, isOpen: false }))}
        onSubmit={handleReviewSubmit}
        bookTitle={reviewModal.bookTitle}
        bookId={reviewModal.bookId}
        existingReview={reviewModal.existingReview}
      />
    </div>
  )
}
