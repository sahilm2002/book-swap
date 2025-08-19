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
  const [pageCount, setPageCount] = useState('')
  const [language, setLanguage] = useState('English')
  const [condition, setCondition] = useState<BookCondition>(BookCondition.GOOD)
  const [location, setLocation] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const genres = [
    'Fiction', 'Non-Fiction', 'Mystery', 'Romance', 'Science Fiction',
    'Fantasy', 'Biography', 'History', 'Self-Help', 'Business',
    'Technology', 'Art', 'Poetry', 'Drama', 'Horror', 'Adventure'
  ]

  const conditions = Object.values(BookCondition)

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

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

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
            location,
            available_for_swap: true
          }
        ])

      if (insertError) throw insertError

      router.push('/dashboard')
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto mt-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Add a New Book</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700">
              Book Title *
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="input-field"
            />
          </div>

          <div>
            <label htmlFor="author" className="block text-sm font-medium text-gray-700">
              Author *
            </label>
            <input
              type="text"
              id="author"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              required
              className="input-field"
            />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="isbn" className="block text-sm font-medium text-gray-700">
              ISBN (Optional)
            </label>
            <input
              type="text"
              id="isbn"
              value={isbn}
              onChange={(e) => setIsbn(e.target.value)}
              className="input-field"
            />
          </div>

          <div>
            <label htmlFor="language" className="block text-sm font-medium text-gray-700">
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
            <label htmlFor="publishedYear" className="block text-sm font-medium text-gray-700">
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
            />
          </div>

          <div>
            <label htmlFor="pageCount" className="block text-sm font-medium text-gray-700">
              Page Count (Optional)
            </label>
            <input
              type="number"
              id="pageCount"
              value={pageCount}
              onChange={(e) => setPageCount(e.target.value)}
              min="1"
              className="input-field"
            />
          </div>
        </div>

        <div>
          <label htmlFor="condition" className="block text-sm font-medium text-gray-700">
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

        <div>
          <label htmlFor="location" className="block text-sm font-medium text-gray-700">
            Your Location *
          </label>
          <input
            type="text"
            id="location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="City, State/Country"
            required
            className="input-field"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Genres (Select all that apply)
          </label>
          <div className="grid grid-cols-3 gap-2">
            {genres.map(genreOption => (
              <label key={genreOption} className="flex items-center">
                <input
                  type="checkbox"
                  checked={genre.includes(genreOption)}
                  onChange={() => handleGenreToggle(genreOption)}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="ml-2 text-sm text-gray-700">{genreOption}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
            Description (Optional)
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="input-field"
            placeholder="Tell others about this book..."
          />
        </div>

        {error && (
          <div className="text-red-600 text-sm">{error}</div>
        )}

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="btn-primary flex-1"
          >
            {loading ? 'Adding Book...' : 'Add Book'}
          </button>
          <button
            type="button"
            onClick={() => router.push('/dashboard')}
            className="btn-secondary flex-1"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}

