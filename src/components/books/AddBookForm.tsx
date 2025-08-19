'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { BookCondition } from '@/types/book'
import { fetchBookCover } from '@/lib/bookCovers'

export default function AddBookForm() {
  const [title, setTitle] = useState('')
  const [author, setAuthor] = useState('')
  const [isbn, setIsbn] = useState('')
  const [genre, setGenre] = useState<string[]>([])
  const [description, setDescription] = useState('')
  const [publishedYear, setPublishedYear] = useState('')
  const [pageCount, setPageCount] = useState('')
  const [language, setLanguage] = useState('English')
  const [condition, setCondition] = useState<BookCondition>(BookCondition.GOOD)
  const [state, setState] = useState('')
  const [city, setCity] = useState('')
  const [zipCode, setZipCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [coverLoading, setCoverLoading] = useState(false)
  const router = useRouter()

  const genres = [
    'Fiction', 'Non-Fiction', 'Mystery', 'Romance', 'Science Fiction',
    'Fantasy', 'Biography', 'History', 'Self-Help', 'Business',
    'Technology', 'Art', 'Poetry', 'Drama', 'Horror', 'Adventure'
  ]

  const conditions = Object.values(BookCondition)

  const states = [
    'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut',
    'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana',
    'Iowa', 'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts',
    'Michigan', 'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska',
    'Nevada', 'New Hampshire', 'New Jersey', 'New Mexico', 'New York', 'North Carolina',
    'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island',
    'South Carolina', 'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont',
    'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming'
  ]

  const handleGenreToggle = (selectedGenre: string) => {
    setGenre(prev => 
      prev.includes(selectedGenre)
        ? prev.filter(g => g !== selectedGenre)
        : [...prev, selectedGenre]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Validate location fields
    if (!state || !city || !zipCode) {
      setError('Please fill in all location fields (State, City, and ZIP Code)')
      setLoading(false)
      return
    }

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      // Try to fetch book cover automatically
      let coverImage = null
      if (title && author) {
        setCoverLoading(true)
        try {
          coverImage = await fetchBookCover(title, author)
        } catch (coverError) {
          console.log('Could not fetch book cover:', coverError)
          // Continue without cover - not a critical error
        } finally {
          setCoverLoading(false)
        }
      }

      const bookLocation = `${city}, ${state} ${zipCode}`.trim()
      
      const { error: insertError } = await supabase
        .from('books')
        .insert([
          {
            title,
            author,
            isbn: isbn || null,
            genre,
            description: description || null,
            published_year: publishedYear ? parseInt(publishedYear) : null,
            page_count: pageCount ? parseInt(pageCount) : null,
            language,
            condition,
            owner_id: user.id,
            location: bookLocation,
            available_for_swap: true,
            cover_image: coverImage
          }
        ])

      if (insertError) throw insertError

      // Redirect to dashboard with success message
      router.push('/dashboard?success=book-added')
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="card">
        <h2 className="text-3xl font-bold gradient-text mb-8 text-center">Add a New Literary Treasure</h2>
        
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-amber-200 mb-2">
                Book Title *
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="input-field"
                placeholder="Enter the book title"
              />
            </div>

            <div>
              <label htmlFor="author" className="block text-sm font-medium text-amber-200 mb-2">
                Author *
              </label>
              <input
                type="text"
                id="author"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                required
                className="input-field"
                placeholder="Enter the author's name"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="isbn" className="block text-sm font-medium text-amber-200 mb-2">
                ISBN (Optional)
              </label>
              <input
                type="text"
                id="isbn"
                value={isbn}
                onChange={(e) => setIsbn(e.target.value)}
                className="input-field"
                placeholder="Enter ISBN if available"
              />
            </div>

            <div>
              <label htmlFor="language" className="block text-sm font-medium text-amber-200 mb-2">
                Language *
              </label>
              <select
                id="language"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="input-field"
              >
                <option value="English">English</option>
                <option value="Spanish">Spanish</option>
                <option value="French">French</option>
                <option value="German">German</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="publishedYear" className="block text-sm font-medium text-amber-200 mb-2">
                Published Year (Optional)
              </label>
              <input
                type="number"
                id="publishedYear"
                value={publishedYear}
                onChange={(e) => setPublishedYear(e.target.value)}
                min="1000"
                max={new Date().getFullYear()}
                className="input-field"
                placeholder="e.g., 1999"
              />
            </div>

            <div>
              <label htmlFor="pageCount" className="block text-sm font-medium text-amber-200 mb-2">
                Page Count (Optional)
              </label>
              <input
                type="number"
                id="pageCount"
                value={pageCount}
                onChange={(e) => setPageCount(e.target.value)}
                min="1"
                className="input-field"
                placeholder="e.g., 320"
              />
            </div>
          </div>

          <div>
            <label htmlFor="condition" className="block text-sm font-medium text-amber-200 mb-2">
              Book Condition *
            </label>
            <select
              id="condition"
              value={condition}
              onChange={(e) => setCondition(e.target.value as BookCondition)}
              className="input-field"
            >
              {conditions.map(cond => (
                <option key={cond} value={cond}>
                  {cond.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </option>
              ))}
            </select>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="state" className="block text-sm font-medium text-amber-200 mb-2">
                State *
              </label>
              <select
                id="state"
                value={state}
                onChange={(e) => setState(e.target.value)}
                required
                className="input-field"
              >
                <option value="">Select State</option>
                {states.map(stateOption => (
                  <option key={stateOption} value={stateOption}>
                    {stateOption}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="city" className="block text-sm font-medium text-amber-200 mb-2">
                City *
              </label>
              <input
                type="text"
                id="city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Enter city name"
                required
                className="input-field"
              />
            </div>

            <div>
              <label htmlFor="zipCode" className="block text-sm font-medium text-amber-200 mb-2">
                ZIP Code *
              </label>
              <input
                type="text"
                id="zipCode"
                value={zipCode}
                onChange={(e) => setZipCode(e.target.value)}
                placeholder="12345"
                required
                pattern="[0-9]{5}"
                title="Please enter a valid 5-digit ZIP code"
                className="input-field"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-amber-200 mb-3">
              Genres (Select all that apply)
            </label>
            <div className="grid grid-cols-3 gap-3">
              {genres.map(genreOption => (
                <label key={genreOption} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={genre.includes(genreOption)}
                    onChange={() => handleGenreToggle(genreOption)}
                    className="rounded border-amber-500/30 text-amber-500 focus:ring-amber-500/50 bg-slate-800/50"
                  />
                  <span className="ml-3 text-sm text-slate-300">{genreOption}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-amber-200 mb-2">
              Description (Optional)
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="input-field"
              placeholder="Tell others about this literary treasure..."
            />
          </div>

          {/* Book Cover Info */}
          <div className="glass-effect rounded-xl p-6 border-amber-500/30">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="w-6 h-6 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-amber-200">Automatic Book Cover</h3>
                <div className="mt-2 text-slate-300">
                  <p>
                    {coverLoading ? (
                      <span className="flex items-center text-amber-400">
                        <svg className="animate-spin -ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Fetching book cover...
                      </span>
                    ) : (
                      "We'll automatically try to find the book cover for you when you submit the form. Make sure the title and author are accurate for the best results."
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4 text-red-400 text-sm">{error}</div>
          )}

          <div className="flex gap-6 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex-1 text-lg py-3"
            >
              {loading ? 'Adding Literary Treasure...' : 'Add Literary Treasure'}
            </button>
            <button
              type="button"
              onClick={() => router.push('/dashboard')}
              className="btn-secondary flex-1 text-lg py-3"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

