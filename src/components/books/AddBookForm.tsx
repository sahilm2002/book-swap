'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { BookCondition } from '@/types/book'

export default function AddBookForm() {
  const [title, setTitle] = useState('')
  const [author, setAuthor] = useState('')
  const [isbn, setIsbn] = useState('')
  const [genre, setGenre] = useState<string[]>([])
  const [description, setDescription] = useState('')
  const [publishedYear, setPublishedYear] = useState('')
  const [language, setLanguage] = useState('English')
  const [condition, setCondition] = useState<BookCondition>(BookCondition.GOOD)
  const [state, setState] = useState('')
  const [city, setCity] = useState('')
  const [zipCode, setZipCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
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

    console.log('Form submission started with data:', {
      title,
      author,
      isbn,
      genre,
      description,
      publishedYear,
      language,
      condition,
      state,
      city,
      zipCode
    })

    // Validate required fields
    if (!title.trim()) {
      setError('Book title is required')
      setLoading(false)
      return
    }

    if (!author.trim()) {
      setError('Author is required')
      setLoading(false)
      return
    }

    if (genre.length === 0) {
      setError('Please select at least one genre')
      setLoading(false)
      return
    }

    // Validate location fields
    if (!state || !city || !zipCode) {
      setError('Please fill in all location fields (State, City, and ZIP Code)')
      setLoading(false)
      return
    }

    // Validate published year if provided
    if (publishedYear && (parseInt(publishedYear) < 1000 || parseInt(publishedYear) > new Date().getFullYear())) {
      setError('Published year must be between 1000 and current year')
      setLoading(false)
      return
    }

    // Add timeout to prevent form from getting stuck
    const timeoutId = setTimeout(() => {
      console.warn('Form submission timeout - forcing loading to false')
      setLoading(false)
      setError('Form submission timed out. Please try again.')
    }, 30000) // 30 second timeout

    try {
      console.log('Getting user from Supabase...')
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      console.log('User authenticated:', user.id)

      const bookLocation = `${city}, ${state} ${zipCode}`.trim()
      
      const bookData = {
        title: title.trim(),
        author: author.trim(),
        isbn: isbn.trim() || null,
        genre,
        description: description.trim() || null,
        published_year: publishedYear ? parseInt(publishedYear) : null,
        language,
        condition,
        owner_id: user.id,
        location: bookLocation,
        available_for_swap: true,
      }

      console.log('Inserting book data:', bookData)
      
      const { error: insertError } = await supabase
        .from('books')
        .insert([bookData])

      if (insertError) {
        console.error('Database insert error:', insertError)
        throw insertError
      }

      console.log('Book inserted successfully, redirecting to dashboard...')
      // Clear timeout since we succeeded
      clearTimeout(timeoutId)
      // Redirect to dashboard with success message
      router.push('/dashboard?success=book-added')
    } catch (error: any) {
      console.error('Form submission error:', error)
      setError(error.message || 'An unexpected error occurred')
    } finally {
      console.log('Setting loading to false')
      clearTimeout(timeoutId)
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

