'use client'

import { useState, useEffect, Suspense, useMemo, useRef } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Book, BookReview } from '@/types/book'
import BookCard from '@/components/BookCard'
import ReviewModal from '@/components/ReviewModal'
import { ChevronLeft, ChevronRight, SortAsc, SortDesc } from 'lucide-react'

interface Review {
  id: string
  bookId: string
  userId: string
  rating: number
  review: string
  createdAt: Date
  updatedAt: Date
}

function DashboardContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()
  
  // Local auth state instead of useAuth hook
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [authLoading, setAuthLoading] = useState(true)
  
  const [books, setBooks] = useState<Book[]>([])
  const [reviews, setReviews] = useState<BookReview[]>([])
  const [loading, setLoading] = useState(false)
  const [booksLoading, setBooksLoading] = useState(false)
  const [isFetchingBooks, setIsFetchingBooks] = useState(false) // Prevent multiple simultaneous calls
  const [selectedGenre, setSelectedGenre] = useState<string>('')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [currentPage, setCurrentPage] = useState(1)
  const [deleteConfirm, setDeleteConfirm] = useState<{ bookId: string; title: string } | null>(null)
  const [reviewModal, setReviewModal] = useState<{
    isOpen: boolean
    bookId: string
    bookTitle: string
    existingReview: BookReview | null
  }>({
    isOpen: false,
    bookId: '',
    bookTitle: '',
    existingReview: null
  })
  
  // Pagination state
  const [booksPerPage] = useState(5)
  
  // Ref to prevent infinite loops when handling success parameter
  const hasHandledSuccess = useRef(false)

  // Check authentication status on component mount
  useEffect(() => {
    console.log('=== Dashboard useEffect triggered ===')
    // Reset state when component mounts
    setLoading(true)
    setBooks([])
    setReviews([])
    
    // Direct auth check with timeout
    const checkAuth = async () => {
      try {
        console.log('Checking auth directly...')
        const { data: { user }, error } = await supabase.auth.getUser()
        
        if (error) {
          console.error('Auth error:', error)
          setUser(null)
          router.push('/auth/login')
        } else {
          console.log('User found:', user?.email)
          setUser(user)
          
          // Fetch user profile
          if (user) {
            const { data: profileData } = await supabase
              .from('users')
              .select('*')
              .eq('id', user.id)
              .single()
            setProfile(profileData)
          }
        }
      } catch (err) {
        console.error('Auth check failed:', err)
        setUser(null)
        router.push('/auth/login')
      } finally {
        setAuthLoading(false)
      }
    }
    
    // Add timeout to prevent hanging
    const authPromise = checkAuth()
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Auth check timeout')), 5000)
    )
    
    Promise.race([authPromise, timeoutPromise]).catch(() => {
      console.warn('Auth check timed out, redirecting to login')
      setUser(null)
      setAuthLoading(false)
      router.push('/auth/login')
    })
    
    // Cleanup function
    return () => {
      console.log('Dashboard page unmounting - cleaning up state')
      setLoading(false)
      setAuthLoading(true)
      setUser(null)
      setProfile(null)
      setBooks([])
      setReviews([])
    }
  }, [router])

  // Handle navigation changes
  useEffect(() => {
    console.log('Pathname changed to:', pathname)
    // Reset loading state when navigating to this page
    if (pathname === '/dashboard') {
      console.log('Navigated to dashboard page - resetting state')
      setLoading(true)
      setBooks([])
      setReviews([])
    }
  }, [pathname])

  // Fetch books when auth is not loading
  useEffect(() => {
    console.log('=== fetchBooks useEffect triggered ===')
    console.log('Auth loading:', authLoading)
    console.log('User:', user)
    
    // Only fetch books when auth is not loading
    if (!authLoading) {
      if (user) {
        console.log('Calling fetchUserBooks...')
        fetchUserBooks(user.id)
      } else {
        console.log('No user, setting loading to false')
        setLoading(false)
      }
    } else {
      console.log('Auth still loading, skipping fetchUserBooks')
    }
  }, [authLoading, user?.id])

  // Handle success parameter changes
  useEffect(() => {
    if (user && !authLoading && !hasHandledSuccess.current) {
      const success = searchParams.get('success')
      if (success === 'book-added') {
        console.log('Detected book added, refreshing books...')
        hasHandledSuccess.current = true
        // Clear the success parameter from URL
        router.replace('/dashboard')
        // Refresh books after clearing the URL
        fetchUserBooks(user.id)
      }
    }
  }, [searchParams, user, authLoading, router])

  // Reset success handling ref when user changes
  useEffect(() => {
    hasHandledSuccess.current = false
  }, [user?.id])

  // Add a safety timeout to prevent books loading from getting stuck
  useEffect(() => {
    if (booksLoading) {
      const timeoutId = setTimeout(() => {
        console.warn('Books loading timeout - forcing loading to false')
        setBooksLoading(false)
      }, 10000) // 10 second timeout
      
      return () => clearTimeout(timeoutId)
    }
  }, [booksLoading])



  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [selectedGenre, sortOrder])

  // Track activity when user changes page
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  // Track activity when user changes genre filter
  const handleGenreFilter = (genre: string) => {
    setSelectedGenre(genre)
  }

  // Track activity when user changes sort order
  const handleSortOrderChange = (order: 'asc' | 'desc') => {
    setSortOrder(order)
  }

  const fetchUserBooks = async (userId: string) => {
    // Prevent multiple simultaneous calls
    if (isFetchingBooks) {
      console.log('fetchUserBooks already in progress, skipping...')
      return
    }
    
    try {
      console.log('fetchUserBooks started for user:', userId)
      setIsFetchingBooks(true)
      setBooksLoading(true)
      
      const { data: booksData, error: booksError } = await supabase
        .from('books')
        .select('*')
        .eq('owner_id', userId)
        .order('created_at', { ascending: false })

      if (booksError) throw booksError

      console.log('Books fetched successfully:', booksData?.length || 0, 'books')

      // Transform the data to match the Book type
      const transformedBooks: Book[] = booksData?.map(book => ({
        id: book.id,
        title: book.title,
        author: book.author,
        isbn: book.isbn,
        genre: book.genre || [],
        description: book.description,
        coverImage: book.cover_image || null,
        publishedYear: book.published_year,
                          language: book.language,
                  condition: book.condition,
                  ownerId: book.owner_id,
                  location: book.location,
                  availableForSwap: book.available_for_swap,
                  swap_status: book.swap_status,
                  created_at: book.created_at,
                  updated_at: book.updated_at
      })) || []

      setBooks(transformedBooks)

      // Fetch reviews for these books
      console.log('Fetching reviews for books...')
      await fetchBookReviews(userId)
      console.log('Reviews fetched successfully')
    } catch (error) {
      console.error('Error fetching user books:', error)
      // Clear books on error to prevent stuck state
      setBooks([])
    } finally {
      // Always ensure loading state is cleared
      console.log('Setting booksLoading to false')
      setBooksLoading(false)
      setIsFetchingBooks(false)
    }
  }

  const fetchBookReviews = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('book_reviews')
        .select('*')
        .eq('user_id', userId)
      
      if (error) {
        console.error('Error fetching reviews:', error)
        return
      }
      
      // Transform the data to match our Review interface
      const transformedReviews = data.map(review => ({
        id: review.id,
        bookId: review.book_id,
        userId: review.user_id,
        rating: review.rating,
        review: review.review,
        createdAt: review.created_at,
        updatedAt: review.updated_at
      }))
      
      setReviews(transformedReviews)
    } catch (error) {
      console.error('Error fetching reviews:', error)
    }
  }



  const handleReviewSubmit = async (reviewData: { bookId: string; rating: number; review: string }) => {
    console.log('Dashboard: handleReviewSubmit called with:', reviewData)
    
    try {
      if (!user) throw new Error('User not authenticated')
      
      console.log('Current user:', user.id)

      const existingReview = reviews.find(r => r.bookId === reviewData.bookId)
      console.log('Existing review found:', existingReview)
      
      if (existingReview) {
        // Update existing review
        console.log('Updating existing review...')
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
        console.log('Creating new review...')
        const { error } = await supabase
          .from('book_reviews')
          .insert([{
            book_id: reviewData.bookId,
            user_id: user.id,
            rating: reviewData.rating,
            review: reviewData.review
          }])

        if (error) throw error

        // Refresh reviews to get the new one
        await fetchBookReviews(user.id)
      }

      // Close modal
      setReviewModal(prev => ({ ...prev, isOpen: false }))
      
      // Show success message
      console.log('Review submitted successfully!')
    } catch (error: any) {
      console.error('Error submitting review:', error)
      // You could add error handling UI here
    }
  }

  const openReviewModal = (bookId: string, bookTitle: string) => {
    console.log('Opening review modal for:', { bookId, bookTitle })
    const existingReview = reviews.find(r => r.bookId === bookId)
    console.log('Existing review found:', existingReview)
    setReviewModal({
      isOpen: true,
      bookId,
      bookTitle,
      existingReview: existingReview || null
    })
  }

  const handleSwapCancelled = () => {
    // Refresh the books list to show updated availability
    if (user) {
      fetchUserBooks(user.id)
    }
  }

  const handleEditBook = (book: Book) => {
    // Implementation for editing book
    console.log('Edit book:', book)
  }

  // Remove the useEffect for success=book-added since we don't need special handling anymore
  // const fetchMissingCovers = async (booksList: Book[]) => {
  //   console.log('fetchMissingCovers called with books:', booksList.map(b => ({ 
  //     title: b.title, 
  //     hasCover: !!b.coverImage,
  //     coverImage: b.coverImage 
  //   })))
    
  //   // Mark books without covers as loading immediately for better UX
  //   const booksWithoutCovers = booksList.filter(book => !book.coverImage)
  //   if (booksWithoutCovers.length > 0) {
  //     console.log(`Marking ${booksWithoutCovers.length} books as loading for covers`)
  //   }
    
  //   await fetchMissingCoversUtil(booksList, {
  //     onUpdate: (bookId: string, coverUrl: string) => {
  //       console.log('Cover update callback called for bookId:', bookId, 'with URL:', coverUrl)
  //       setBooks(prev => prev.map(b => 
  //         b.id === bookId ? { ...b, coverImage: coverUrl } : b
  //       ))
  //     },
  //     onLoadingChange: (bookId: string, isLoading: boolean) => {
  //       // No loading state needed - just update books directly
  //     }
  //   })
  // }



  // Get all unique genres from user's books
  const allGenres = useMemo(() => {
    const genres = new Set<string>()
    books.forEach(book => {
      book.genre.forEach((genre: string) => genres.add(genre))
    })
    return Array.from(genres).sort()
  }, [books])

  // Filter and sort books
  const filteredAndSortedBooks = useMemo(() => {
    let filtered = books
    
    // Filter by genre
    if (selectedGenre) {
      filtered = books.filter(book => book.genre.includes(selectedGenre))
    }
    
    // Sort alphabetically
    filtered = [...filtered].sort((a: Book, b: Book) => {
      const comparison = a.title.localeCompare(b.title)
      return sortOrder === 'asc' ? comparison : -comparison
    })
    
    return filtered
  }, [books, selectedGenre, sortOrder])

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedBooks.length / booksPerPage)
  const startIndex = (currentPage - 1) * booksPerPage
  const endIndex = startIndex + booksPerPage
  const currentBooks = filteredAndSortedBooks.slice(startIndex, endIndex)



  const confirmDelete = (bookId: string, title: string) => {
    setDeleteConfirm({ bookId, title })
  }

  const executeDelete = async () => {
    if (!deleteConfirm) return
    
    try {
      const { error } = await supabase
        .from('books')
        .delete()
        .eq('id', deleteConfirm.bookId)

      if (error) {
        console.error('Error deleting book:', error)
      } else {
        // Refresh the books list
        if (user) {
          fetchUserBooks(user.id)
        }
        setDeleteConfirm(null)
      }
    } catch (error) {
      console.error('Error deleting book:', error)
    }
  }

  const clearGenreFilter = () => {
    setSelectedGenre('')
  }

  // Debug logging
  console.log('Dashboard render state:', { authLoading, user: !!user, profile: !!profile, booksCount: books.length })
  
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your dashboard...</p>
          <p className="mt-2 text-sm text-gray-500">Auth loading: {authLoading ? 'true' : 'false'}</p>
          <p className="mt-1 text-sm text-gray-500">User: {user ? 'loaded' : 'not loaded'}</p>
          <p className="mt-4 text-xs text-gray-400">If this takes too long, try refreshing the page</p>
        </div>
      </div>
    )
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
            <h1 className="text-3xl font-bold text-gray-900">Welcome, {profile?.full_name || user.email?.split('@')[0] || 'User'}!</h1>

          </div>
        </div>
      </div>

      {/* Success Message */}
      {/* The success message block is removed as per the edit hint. */}

      {/* Dashboard Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* User Profile Card */}
          <div className="card">
            <h3 className="text-lg font-semibold mb-4">Your Profile</h3>
            <div className="space-y-2">
              <p><strong>Email:</strong> {user.email}</p>
              <p><strong>Full Name:</strong> {profile?.full_name || 'Not set'}</p>
              <p><strong>Address:</strong> {profile?.address || 'Not set'}</p>
              <p><strong>Member since:</strong> {new Date(user.created_at).toLocaleDateString()}</p>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="card">
            <h3 className="text-lg font-semibold mb-4">Quick Stats</h3>
            <div className="space-y-2">
              <p><strong>Books Shared:</strong> {books.length}</p>
              <p><strong>Reviews Written:</strong> {reviews.length}</p>
              <p><strong>Member since:</strong> {new Date(user.created_at).toLocaleDateString()}</p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="card">
            <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button 
                onClick={() => router.push('/add-book')}
                className="btn-primary w-full"
              >
                Add a Book
              </button>
              <button 
                onClick={() => router.push('/browse')}
                className="btn-secondary w-full"
              >
                Browse Books
              </button>
            </div>
          </div>
        </div>

        {/* User's Books Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Your Books</h2>
            <button 
              onClick={() => router.push('/add-book')}
              className="btn-primary"
            >
              Add Another Book
            </button>
          </div>

          {/* Filters and Sorting */}
          {books.length > 0 && (
            <div className="bg-white p-4 rounded-lg border border-gray-200 mb-6">
              <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="flex items-center gap-4">
                  {/* Genre Filter */}
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-gray-700">Filter by genre:</label>
                    <select
                      value={selectedGenre}
                      onChange={(e) => handleGenreFilter(e.target.value)}
                      className="input-field text-sm"
                    >
                      <option value="">All Genres</option>
                      {allGenres.map(genre => (
                        <option key={genre} value={genre}>{genre}</option>
                      ))}
                    </select>
                    {selectedGenre && (
                      <button
                        onClick={clearGenreFilter}
                        className="text-sm text-gray-500 hover:text-gray-700 underline"
                      >
                        Clear
                      </button>
                    )}
                  </div>

                  {/* Sort Order */}
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-gray-700">Sort:</label>
                    <button
                      onClick={() => handleSortOrderChange(sortOrder === 'asc' ? 'desc' : 'asc')}
                      className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-800"
                    >
                      {sortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
                      {sortOrder === 'asc' ? 'A-Z' : 'Z-A'}
                    </button>
                  </div>
                </div>

                {/* Results Count */}
                <div className="text-sm text-gray-600">
                  Showing {filteredAndSortedBooks.length} of {books.length} books
                  {selectedGenre && ` in ${selectedGenre}`}
                </div>
              </div>
            </div>
          )}

          {booksLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading your books...</p>
            </div>
          ) : books.length > 0 ? (
            <>
              {/* Books Grid */}
              <div className="grid gap-4 mb-6">
                {currentBooks.map(book => {
                  const userReview = reviews.find(r => r.bookId === book.id)
                  
                  return (
                    <BookCard
                      key={book.id}
                      book={book}
                      showOwner={false}
                      onSwapRequest={undefined}
                      onDelete={(bookId) => confirmDelete(bookId, book.title)}
                      onGenreClick={(genre) => handleGenreFilter(genre)}
                      onReviewClick={(bookId) => openReviewModal(bookId, book.title)}
                      showReviewButton={true}
                      userRating={userReview?.rating || 0}
                      userReviewText={userReview?.review || ''}
                      onSwapCancelled={handleSwapCancelled}
                    />
                  )
                })}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2">
                  <button
                    onClick={() => handlePageChange(Math.max(currentPage - 1, 1))}
                    disabled={currentPage === 1}
                    className="btn-secondary px-3 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`px-3 py-2 rounded-md text-sm font-medium ${
                          currentPage === page
                            ? 'bg-primary-600 text-white'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>
                  
                  <button
                    onClick={() => handlePageChange(Math.min(currentPage + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="btn-secondary px-3 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No books yet</h3>
              <p className="text-gray-600 mb-4">
                Start building your book collection by adding your first book.
              </p>
              <button
                onClick={() => router.push('/add-book')}
                className="btn-primary"
              >
                Add Your First Book
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Delete Book</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete "<strong>{deleteConfirm.title}</strong>"? 
              This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={executeDelete}
                className="btn-primary bg-red-600 hover:bg-red-700"
              >
                Delete Book
              </button>
            </div>
          </div>
        </div>
      )}

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

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  )
}