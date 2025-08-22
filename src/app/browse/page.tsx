'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Search, Filter } from 'lucide-react'
import BookCard from '@/components/BookCard'
import ReviewModal from '@/components/ReviewModal'
import SwapRequestModal from '@/components/SwapRequestModal'
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
  const pathname = usePathname()
  const [user, setUser] = useState<any>(null)
  const [authLoading, setAuthLoading] = useState(true)
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

  // Swap request modal state
  const [swapRequestModal, setSwapRequestModal] = useState<{
    isOpen: boolean
    requestedBook: Book | null
  }>({
    isOpen: false,
    requestedBook: null
  })
  
  // Add state for user's books
  const [userBooks, setUserBooks] = useState<Book[]>([])
  const [userBooksLoading, setUserBooksLoading] = useState(false)

  const [bookStats, setBookStats] = useState<Map<string, { averageRating: number; reviewCount: number }>>(new Map())

  const genres = ['Fiction', 'Non-Fiction', 'Mystery', 'Romance', 'Science Fiction', 'Fantasy', 'Biography', 'History', 'Self-Help', 'Business', 'Technology', 'Art', 'Poetry', 'Drama', 'Horror', 'Adventure', 'Classic', 'Dystopian', 'Political', 'Historical Fiction']
  const conditions = Object.values(BookCondition)

  // Handle authentication and initial setup
  useEffect(() => {
    console.log('=== Browse page mounted - starting auth check ===')
    setAuthLoading(true)
    setLoading(true)
    setError('')
    
    // Direct auth check with timeout
    const checkAuth = async () => {
      try {
        console.log('Checking auth directly...')
        const { data: { user }, error } = await supabase.auth.getUser()
        
        if (error) {
          console.error('Auth error:', error)
          setUser(null)
        } else {
          console.log('User found:', user?.email)
          setUser(user)
        }
      } catch (err) {
        console.error('Auth check failed:', err)
        setUser(null)
      } finally {
        console.log('Auth check completed, setting authLoading to false')
        setAuthLoading(false)
      }
    }
    
    // Add timeout to prevent hanging
    const authPromise = checkAuth()
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Auth check timeout')), 5000)
    )
    
    Promise.race([authPromise, timeoutPromise]).catch(() => {
      console.warn('Auth check timed out, continuing without user')
      setUser(null)
      setAuthLoading(false)
    })
    
    // Cleanup function
    return () => {
      console.log('Browse page unmounting - cleaning up state')
      // Don't set authLoading to true here as it can cause issues
      setLoading(false)
      setUser(null)
      setBooks([])
      setError('')
    }
  }, [])

  // Handle navigation changes
  useEffect(() => {
    console.log('Pathname changed to:', pathname)
    // Only reset state when actually navigating to this page, not when leaving
    if (pathname === '/browse') {
      console.log('Navigated to browse page - checking if we need to reset state')
      // Only reset if we don't already have books or if there's an error
      if (books.length === 0 || error) {
        console.log('Resetting state for fresh navigation')
        setLoading(true)
        setError('')
        setBooks([])
      } else {
        console.log('Keeping existing state, no reset needed')
      }
    }
  }, [pathname, books.length, error])

  useEffect(() => {
    console.log('=== fetchBooks useEffect triggered ===')
    console.log('Auth loading:', authLoading)
    console.log('User:', user)
    
    // Only fetch books when auth is not loading
    if (!authLoading) {
      console.log('Calling fetchBooks...')
      fetchBooks()
    } else {
      console.log('Auth still loading, skipping fetchBooks')
    }
    
    // Add a fallback timeout to prevent hanging
    const fallbackTimeout = setTimeout(() => {
      if (authLoading) {
        console.warn('Auth loading timeout - forcing authLoading to false')
        setAuthLoading(false)
      }
    }, 10000) // 10 second fallback
    
    return () => {
      clearTimeout(fallbackTimeout)
    }
  }, [authLoading, user?.id]) // Add user.id as dependency

  const fetchBooks = async () => {
    let fetchTimeout: NodeJS.Timeout | undefined;
    try {
      console.log('=== STARTING fetchBooks ===')
      console.log('Auth loading:', authLoading)
      console.log('User:', user)
      
      setLoading(true)
      setError('')
      
      // Add a safety timeout to prevent fetchBooks from hanging
      fetchTimeout = setTimeout(() => {
        console.warn('fetchBooks timeout - forcing loading to false')
        setLoading(false)
        setError('Fetch timeout - please refresh the page')
      }, 15000) // 15 second timeout
      
      console.log('Fetching books from Supabase...')
      const { data: booksData, error } = await supabase
        .from('books')
        .select('*')
        .eq('available_for_swap', true)
        .order('created_at', { ascending: false })

      // Clear the timeout since we succeeded
      if (fetchTimeout) {
        clearTimeout(fetchTimeout)
      }

      console.log('Supabase response:', { booksData, error })

      if (error) {
        clearTimeout(fetchTimeout)
        throw error
      }

      // Now fetch swap requests for all books separately
      console.log('Fetching swap requests for books...')
      const bookIds = booksData?.map(book => book.id) || []
      console.log('Book IDs to fetch swaps for:', bookIds)
      
      let swapRequests: any[] = []
      if (bookIds.length > 0) {
        const { data: swapsData, error: swapsError } = await supabase
          .from('book_swaps')
          .select('*')
          .in('book_requested_id', bookIds)
        
        if (swapsError) {
          console.error('Error fetching swap requests:', swapsError)
        } else {
          swapRequests = swapsData || []
          console.log('Fetched swap requests:', swapRequests)
          console.log('Swap requests details:', swapRequests.map(s => ({
            id: s.id,
            book_requested_id: s.book_requested_id,
            requester_id: s.requester_id,
            status: s.status
          })))
        }
      } else {
        console.log('No book IDs to fetch swaps for')
      }

      // Filter out books owned by the current user and books that are truly unavailable
      const otherUsersBooks = booksData?.filter(book => {
        // Don't show user's own books
        if (book.owner_id === user?.id) {
          console.log(`Filtering out own book: ${book.title}`)
          return false
        }
        
        // Find swaps for this book
        const bookSwaps = swapRequests.filter(swap => swap.book_requested_id === book.id)
        
        // Check if current user has any active swaps for this book
        if (bookSwaps.length > 0 && user) {
          const currentUserSwaps = bookSwaps.filter(swap => swap.requester_id === user.id)
          
          if (currentUserSwaps.length > 0) {
            console.log(`Book "${book.title}" - User has ${currentUserSwaps.length} swaps:`, 
              currentUserSwaps.map(s => s.status))
          }
          
          // If user has a pending swap, show the book (so they can see "Swap Requested")
          const hasPendingSwap = currentUserSwaps.some(swap => swap.status === 'pending')
          if (hasPendingSwap) {
            console.log(`Book "${book.title}" - Showing (pending swap)`)
            return true // Show book so user can see their pending request
          }
          
          // If user has a completed swap, don't show the book (it's no longer available)
          const hasCompletedSwap = currentUserSwaps.some(swap => swap.status === 'completed')
          if (hasCompletedSwap) {
            console.log(`Filtering out book "${book.title}" - completed swap`)
            return false // Book is no longer available for this user
          }
          
          // If user has a cancelled swap, show the book (so they can request again)
          const hasCancelledSwap = currentUserSwaps.some(swap => swap.status === 'cancelled')
          if (hasCancelledSwap) {
            console.log(`Book "${book.title}" - Showing (cancelled swap, can request again)`)
            return true // Show book so user can request again
          }
        }
        
        // Show the book if no filters apply
        console.log(`Book "${book.title}" - Showing (no user swaps)`)
        return true
      }) || []
      
      console.log('Filtered books:', otherUsersBooks)

      // Transform the data to match the Book type
      const transformedBooks: BookWithReviews[] = otherUsersBooks.map(book => {
        // Find swaps for this book
        const bookSwaps = swapRequests.filter(swap => swap.book_requested_id === book.id)
        
        return {
          id: book.id,
          title: book.title,
          author: book.author,
          isbn: book.isbn,
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
          swap_status: book.swap_status,
          created_at: book.created_at,
          updated_at: book.updated_at,
          averageRating: 0,
          reviewCount: 0,
          // Add swap request information
          swapRequests: bookSwaps,
          // Owner information (will be populated later)
          ownerUsername: undefined,
          ownerEmail: undefined
        }
      }) || []

      setBooks(transformedBooks)

      // Fetch owner information for all books
      await fetchOwnerInformation(transformedBooks)
      
      // Try to fetch missing covers for books without them
      await fetchMissingCovers(transformedBooks)
      
      // Fetch reviews and ratings
      await fetchBookReviewsAndRatings(transformedBooks)
    } catch (err: any) {
      console.error('Error fetching books:', err)
      setError(err.message || 'Failed to fetch books')
    } finally {
      // Always ensure loading state is cleared and timeout is cleared
      setLoading(false)
      if (fetchTimeout) {
        clearTimeout(fetchTimeout)
      }
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

  const fetchOwnerInformation = async (booksList: BookWithReviews[]) => {
    const userIds = booksList.map(book => book.ownerId).filter(id => id);
    if (userIds.length === 0) return;

    const { data: users, error } = await supabase
      .from('users')
      .select('id, username, email')
      .in('id', userIds);

    if (error) {
      console.error('Error fetching owner information:', error);
      return;
    }

    const userMap = new Map(users.map(user => [user.id, user]));

    setBooks(prev => prev.map(book => {
      const owner = userMap.get(book.ownerId);
      return {
        ...book,
        ownerUsername: owner?.username,
        ownerEmail: owner?.email
      };
    }));
  };

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
      if (!user) {
        console.error('User not authenticated')
        router.push('/auth/login')
        return
      }

      // Check if user has already reviewed this book
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

  const closeReviewModal = () => {
    setReviewModal({
      isOpen: false,
      bookId: '',
      bookTitle: '',
      existingReview: null
    })
  }

  // Swap request handlers
  const openSwapRequestModal = (bookId: string) => {
    const book = books.find(b => b.id === bookId)
    if (!book) return
    
    // Fetch user's books when opening the modal
    fetchUserBooks()
    
    setSwapRequestModal({
      isOpen: true,
      requestedBook: book
    })
  }

  const closeSwapRequestModal = () => {
    setSwapRequestModal({
      isOpen: false,
      requestedBook: null
    })
  }

  const handleSwapRequested = () => {
    // Refresh the books list to show updated availability
    fetchBooks()
  }

  const handleSwapCancelled = () => {
    // Refresh the books list to show updated availability
    fetchBooks()
  }

  // Fetch user's books for swap modal
  const fetchUserBooks = async () => {
    if (!user) return
    
    setUserBooksLoading(true)
    try {
      console.log('Fetching user books for swap modal...')
      const { data: books, error } = await supabase
        .from('books')
        .select('*')
        .eq('owner_id', user.id)
        .eq('available_for_swap', true)
        .order('title')
      
      if (error) {
        console.error('Error fetching user books:', error)
        return
      }
      
      console.log('User books fetched:', books?.length || 0)
      setUserBooks(books || [])
    } catch (error) {
      console.error('Error fetching user books:', error)
    } finally {
      setUserBooksLoading(false)
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

  // Show loading state while auth is loading
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading authentication...</p>
          <button
            onClick={() => {
              console.log('Manual auth refresh triggered')
              setAuthLoading(false)
              setUser(null)
            }}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Skip Authentication
          </button>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading books...</p>
          <button
            onClick={() => {
              console.log('Manual books refresh triggered')
              setLoading(false)
              fetchBooks()
            }}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Refresh Books
          </button>
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

        {/* Debug Information (Development Only) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Debug Info</h3>
            <div className="text-xs text-gray-600 space-y-1">
              <p>Auth Loading: {authLoading.toString()}</p>
              <p>Loading: {loading.toString()}</p>
              <p>User: {user ? `${user.email} (${user.id})` : 'null'}</p>
              <p>Books Count: {books.length}</p>
              <p>Error: {error || 'none'}</p>
              <p>Pathname: {pathname}</p>
            </div>
            <div className="mt-2 space-x-2">
              <button
                onClick={() => {
                  console.log('Manual state reset triggered')
                  setAuthLoading(false)
                  setLoading(false)
                  setUser(null)
                  setBooks([])
                  setError('')
                }}
                className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
              >
                Reset All State
              </button>
              <button
                onClick={() => {
                  console.log('Manual auth check triggered')
                  setAuthLoading(true)
                  const checkAuth = async () => {
                    try {
                      const { data: { user }, error } = await supabase.auth.getUser()
                      if (error) {
                        console.error('Auth error:', error)
                        setUser(null)
                      } else {
                        console.log('User found:', user?.email)
                        setUser(user)
                      }
                    } catch (err) {
                      console.error('Auth check failed:', err)
                      setUser(null)
                    } finally {
                      setAuthLoading(false)
                    }
                  }
                  checkAuth()
                }}
                className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
              >
                Check Auth
              </button>
            </div>
          </div>
        )}

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
                  onSwapRequest={openSwapRequestModal}
                  onSwapCancelled={handleSwapCancelled}
                  showOwner={true}
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
        onClose={closeReviewModal}
        onSubmit={handleReviewSubmit}
        bookTitle={reviewModal.bookTitle}
        bookId={reviewModal.bookId}
        existingReview={reviewModal.existingReview}
      />

      {/* Swap Request Modal */}
      {swapRequestModal.requestedBook && (
        <SwapRequestModal
          isOpen={swapRequestModal.isOpen}
          onClose={closeSwapRequestModal}
          requestedBook={swapRequestModal.requestedBook}
          onSwapRequested={handleSwapRequested}
          userBooks={userBooks}
        />
      )}
    </div>
  )
}
