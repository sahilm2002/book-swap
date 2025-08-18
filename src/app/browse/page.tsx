'use client'

import { useState } from 'react'
import { Search, Filter } from 'lucide-react'
import BookCard from '@/components/BookCard'
import { Book, BookCondition } from '@/types/book'

// Mock data for demonstration
const mockBooks: Book[] = [
  {
    id: '1',
    title: 'The Great Gatsby',
    author: 'F. Scott Fitzgerald',
    genre: ['Classic', 'Fiction', 'Romance'],
    description: 'A story of the fabulously wealthy Jay Gatsby and his love for the beautiful Daisy Buchanan.',
    coverImage: '/api/placeholder/80/120',
    publishedYear: 1925,
    pageCount: 180,
    language: 'English',
    condition: BookCondition.GOOD,
    ownerId: 'john_doe',
    location: 'New York, NY',
    availableForSwap: true,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15')
  },
  {
    id: '2',
    title: '1984',
    author: 'George Orwell',
    genre: ['Dystopian', 'Science Fiction', 'Political'],
    description: 'A dystopian social science fiction novel and cautionary tale.',
    coverImage: '/api/placeholder/80/120',
    publishedYear: 1949,
    pageCount: 328,
    language: 'English',
    condition: BookCondition.VERY_GOOD,
    ownerId: 'jane_smith',
    location: 'San Francisco, CA',
    availableForSwap: true,
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-10')
  },
  {
    id: '3',
    title: 'Pride and Prejudice',
    author: 'Jane Austen',
    genre: ['Classic', 'Romance', 'Historical Fiction'],
    description: 'A romantic novel of manners that follows the emotional development of Elizabeth Bennet.',
    coverImage: '/api/placeholder/80/120',
    publishedYear: 1813,
    pageCount: 432,
    language: 'English',
    condition: BookCondition.LIKE_NEW,
    ownerId: 'book_lover',
    location: 'Boston, MA',
    availableForSwap: false,
    createdAt: new Date('2024-01-05'),
    updatedAt: new Date('2024-01-05')
  }
]

export default function BrowsePage() {
  const [books, setBooks] = useState<Book[]>(mockBooks)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedGenre, setSelectedGenre] = useState<string>('')
  const [selectedCondition, setSelectedCondition] = useState<BookCondition | ''>('')
  const [showFilters, setShowFilters] = useState(false)

  const genres = ['Classic', 'Fiction', 'Romance', 'Dystopian', 'Science Fiction', 'Political', 'Historical Fiction']
  const conditions = Object.values(BookCondition)

  const filteredBooks = books.filter(book => {
    const matchesSearch = book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         book.author.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesGenre = !selectedGenre || book.genre.includes(selectedGenre)
    const matchesCondition = !selectedCondition || book.condition === selectedCondition
    
    return matchesSearch && matchesGenre && matchesCondition
  })

  const handleSwapRequest = (bookId: string) => {
    // TODO: Implement swap request functionality
    console.log(`Swap requested for book: ${bookId}`)
  }

  const clearFilters = () => {
    setSearchQuery('')
    setSelectedGenre('')
    setSelectedCondition('')
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
                    className="input-field"
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

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-gray-600">
            Showing {filteredBooks.length} of {books.length} books
          </p>
        </div>

        {/* Books Grid */}
        {filteredBooks.length > 0 ? (
          <div className="grid gap-6">
            {filteredBooks.map(book => (
              <BookCard
                key={book.id}
                book={book}
                onSwapRequest={handleSwapRequest}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No books found</h3>
            <p className="text-gray-600 mb-4">
              Try adjusting your search terms or filters to find more books.
            </p>
            <button
              onClick={clearFilters}
              className="btn-primary"
            >
              Clear All Filters
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
