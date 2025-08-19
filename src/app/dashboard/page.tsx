'use client'

import { useEffect, useState, Suspense, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter, useSearchParams } from 'next/navigation'
import BookCard from '@/components/BookCard'
import ReviewModal from '@/components/ReviewModal'
import { Book } from '@/types/book'
import { ChevronLeft, ChevronRight, SortAsc, SortDesc, Clock, Shield } from 'lucide-react'
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

function DashboardContent() {
  const [user, setUser] = useState<any>(null)
  const [books, setBooks] = useState<Book[]>([])
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [booksLoading, setBooksLoading] = useState(true)
  const [showSuccess, setShowSuccess] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<{ bookId: string; title: string } | null>(null)
  
  // Session status state
  const [sessionStatus, setSessionStatus] = useState<{
    isActive: boolean
    expiresAt: Date | null
    timeRemaining: string
  }>({
    isActive: false,
    expiresAt: null,
    timeRemaining: ''
  })
  
  // Review modal state
  const [reviewModal, setReviewModal] = useState<{
    isOpen: boolean
    bookId: string
    bookTitle: string
    existingReview?: Review | null
  }>({
    isOpen: false,
    bookId: '',
    bookTitle: '',
    existingReview: null
  })
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [booksPerPage] = useState(5)
  
  // Sorting and filtering state
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [selectedGenre, setSelectedGenre] = useState<string>('')
  
  // Cover loading state
  const [coverLoading, setCoverLoading] = useState<Set<string>>(new Set())
  
  const router = useRouter()
  const searchParams = useSearchParams()

  // Session status tracking
  useEffect(() => {
    const updateSessionStatus = () => {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          const expiresAt = new Date(session.expires_at! * 1000)
          const now = new Date()
          const timeRemaining = expiresAt.getTime() - now.getTime()
          
          if (timeRemaining > 0) {
            const minutes = Math.floor(timeRemaining / (1000 * 60))
            const seconds = Math.floor((timeRemaining % (1000 * 60)) / 1000)
            
            setSessionStatus({
              isActive: true,
              expiresAt,
              timeRemaining: `${minutes}m ${seconds}s`
            })
          } else {
            setSessionStatus({
              isActive: false,
              expiresAt: null,
              timeRemaining: 'Expired'
            })
          }
        } else {
          setSessionStatus({
            isActive: false,
            expiresAt: null,
            timeRemaining: 'No session'
          })
        }
      })
    }

    // Update immediately
    updateSessionStatus()
    
    // Update every second
    const interval = setInterval(updateSessionStatus, 1000)
    
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          // Get user profile from database
          const { data: profile } = await supabase
            .from('users')
            .select('*')
            .eq('id', user.id)
            .single()
          
          setUser(profile)
          
          // Fetch user's books
          await fetchUserBooks(user.id)
        } else {
          router.push('/auth/login')
        }
      } catch (error) {
        console.error('Error fetching user:', error)
        router.push('/auth/login')
      } finally {
        setLoading(false)
      }
    }

    getUser()
  }, [router])

  useEffect(() => {
    // Check for success message from add book form
    const success = searchParams.get('success')
    if (success === 'book-added') {
      setShowSuccess(true)
      // Refresh books if user is already loaded
      if (user) {
        fetchUserBooks(user.id)
      }
      // Hide success message after 5 seconds
      setTimeout(() => setShowSuccess(false), 5000)
    }
  }, [searchParams, user])

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [selectedGenre, sortOrder])

  const fetchUserBooks = async (userId: string) => {
    try {
      setBooksLoading(true)
      const { data: userBooks, error } = await supabase
        .from('books')
        .select('*')
        .eq('owner_id', userId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching books:', error)
      } else {
        // Transform the data to match the Book type
        const transformedBooks: Book[] = userBooks?.map(book => ({
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
          ownerId: book.owner_id,
          location: book.location,
          availableForSwap: book.available_for_swap,
          createdAt: new Date(book.created_at),
          updatedAt: new Date(book.updated_at)
        })) || []
        
        setBooks(transformedBooks)
        
        console.log('Loaded books:', transformedBooks.map(b => ({ 
          title: b.title, 
          hasCover: !!b.coverImage, 
          coverImage: b.coverImage 
        })))
        
        // Try to fetch missing covers for books without them
        await fetchMissingCovers(transformedBooks)
        
        // Fetch reviews for these books
        await fetchBookReviews(userId)
      }
    } catch (error) {
      console.error('Error fetching books:', error)
    } finally {
      setBooksLoading(false)
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
      const { data: { user } } = await supabase.auth.getUser()
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

  const refreshBookCover = async (bookId: string, title: string, author: string) => {
    console.log(`Manually refreshing cover for: ${title} by ${author}`)
    
    setCoverLoading(prev => new Set(prev).add(bookId))
    
    try {
      const coverUrl = await fetchBookCover(title, author)
      
      if (coverUrl) {
        console.log(`Found new cover for ${title}:`, coverUrl)
        
        // Update the book in the database
        const { error } = await supabase
          .from('books')
          .update({ cover_image: coverUrl })
          .eq('id', bookId)
        
        if (error) {
          console.error(`Error updating cover in database for ${title}:`, error)
        } else {
          console.log(`Successfully updated cover in database for ${title}`)
          
          // Update the local state
          setBooks(prev => prev.map(b => 
            b.id === bookId ? { ...b, coverImage: coverUrl } : b
          ))
        }
      } else {
        console.log(`No cover found for ${title}`)
      }
    } catch (error) {
      console.error(`Failed to fetch cover for ${title}:`, error)
    } finally {
      setCoverLoading(prev => {
        const newSet = new Set(prev)
        newSet.delete(bookId)
        return newSet
      })
    }
  }

  const checkBookCoverStatus = async () => {
    try {
      console.log('=== Checking Book Cover Status ===')
      
      // Get current books from database
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      
      const { data: currentBooks, error } = await supabase
        .from('books')
        .select('id, title, author, cover_image')
        .eq('owner_id', user.id)
      
      if (error) {
        console.error('Error fetching current books:', error)
        return
      }
      
      console.log('Current books in database:', currentBooks)
      
      // Check local state
      console.log('Current books in local state:', books.map(b => ({
        id: b.id,
        title: b.title,
        hasCover: !!b.coverImage,
        coverImage: b.coverImage
      })))
      
      // Check for mismatches
      currentBooks.forEach(dbBook => {
        const localBook = books.find(b => b.id === dbBook.id)
        if (localBook) {
          if (dbBook.cover_image !== localBook.coverImage) {
            console.warn(`Mismatch for ${dbBook.title}:`, {
              database: dbBook.cover_image,
              local: localBook.coverImage
            })
          }
        }
      })
      
    } catch (error) {
      console.error('Error checking book cover status:', error)
    }
  }



  const clearAndRefetchAllCovers = async () => {
    try {
      console.log('=== Clearing and Re-fetching All Book Covers ===')
      
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      
      // Clear all cover images from database
      const { error: clearError } = await supabase
        .from('books')
        .update({ cover_image: null })
        .eq('owner_id', user.id)
      
      if (clearError) {
        console.error('Error clearing covers:', clearError)
        return
      }
      
      console.log('Successfully cleared all cover images')
      
      // Update local state to remove covers
      setBooks(prev => prev.map(book => ({ ...book, coverImage: undefined })))
      
      // Re-fetch all covers
      await fetchMissingCovers(books)
      
    } catch (error) {
      console.error('Error clearing and re-fetching covers:', error)
    }
  }

  const fetchMissingCovers = async (booksList: Book[]) => {
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

  // Get all unique genres from user's books
  const allGenres = useMemo(() => {
    const genres = new Set<string>()
    books.forEach(book => {
      book.genre.forEach(genre => genres.add(genre))
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
    filtered = [...filtered].sort((a, b) => {
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

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

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
          await fetchUserBooks(user.id)
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your dashboard...</p>
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
            <h1 className="text-3xl font-bold text-gray-900">Welcome, {user.full_name}!</h1>
            <button
              onClick={handleSignOut}
              className="btn-secondary"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* Success Message */}
      {showSuccess && (
        <div className="bg-green-50 border-b border-green-200">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-green-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <p className="text-green-800">Book added successfully! It's now visible in your collection.</p>
              </div>
              <button
                onClick={() => setShowSuccess(false)}
                className="text-green-400 hover:text-green-600"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dashboard Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* User Profile Card */}
          <div className="card">
            <h3 className="text-lg font-semibold mb-4">Your Profile</h3>
            <div className="space-y-2">
              <p><strong>Username:</strong> @{user.username}</p>
              <p><strong>Email:</strong> {user.email}</p>
              <p><strong>Location:</strong> {user.location}</p>
              <p><strong>Member since:</strong> {new Date(user.created_at).toLocaleDateString()}</p>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="card">
            <h3 className="text-lg font-semibold mb-4">Quick Stats</h3>
            <div className="space-y-2">
              <p><strong>Rating:</strong> {user.rating}/5.0</p>
              <p><strong>Total Swaps:</strong> {user.total_swaps}</p>
              <p><strong>Books Shared:</strong> {books.length}</p>
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

          {/* Session Status */}
          <div className="card">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-amber-500" />
              Session Status
            </h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Status:</span>
                <span className={`text-sm font-medium ${sessionStatus.isActive ? 'text-green-600' : 'text-red-600'}`}>
                  {sessionStatus.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              {sessionStatus.expiresAt && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Expires:</span>
                  <span className="text-sm text-gray-800">
                    {sessionStatus.expiresAt.toLocaleTimeString()}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Time Remaining:</span>
                <span className={`text-sm font-medium flex items-center gap-1 ${
                  sessionStatus.isActive && sessionStatus.timeRemaining.includes('m') && 
                  parseInt(sessionStatus.timeRemaining.split('m')[0]) < 5 ? 'text-amber-600' : 'text-gray-800'
                }`}>
                  <Clock className="w-4 h-4" />
                  {sessionStatus.timeRemaining}
                </span>
              </div>
              <div className="pt-2 text-xs text-gray-500 border-t">
                Your session will stay active for 15 minutes without activity
              </div>
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
                      onChange={(e) => setSelectedGenre(e.target.value)}
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
                      onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
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
                  const isCoverLoading = coverLoading.has(book.id)
                  
                  return (
                    <BookCard
                      key={book.id}
                      book={book}
                      showOwner={false}
                      onSwapRequest={undefined}
                      onDelete={(bookId) => confirmDelete(bookId, book.title)}
                      onGenreClick={(genre) => setSelectedGenre(genre)}
                      onReviewClick={(bookId) => openReviewModal(bookId, book.title)}
                      onRefreshCover={refreshBookCover}
                      showReviewButton={true}
                      showRefreshButton={true}
                      userRating={userReview?.rating || 0}
                      userReviewText={userReview?.review || ''}
                      isCoverLoading={isCoverLoading}
                    />
                  )
                })}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="btn-secondary px-3 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
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
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
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