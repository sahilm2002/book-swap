'use client'

import { useState, useEffect } from 'react'
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
  const [userStatus, setUserStatus] = useState<{ user: any; loading: boolean; error: string | null }>({ user: null, loading: true, error: null })
  const router = useRouter()

  // Immediate logging when component mounts
  console.log('=== AddBookForm Component Mounted ===')
  console.log('Supabase client exists:', !!supabase)
  console.log('Supabase client:', supabase)
  console.log('Environment variables:')
  console.log('- NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
  console.log('- NEXT_PUBLIC_SUPABASE_ANON_KEY length:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length || 0)

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
    }, 15000) // Increased to 15 seconds

    try {
      console.log('=== STARTING BOOK ADDITION PROCESS ===')
      console.log('Step 1: Getting user from Supabase...')
      
      // First check if we're in a browser environment
      if (typeof window === 'undefined') {
        throw new Error('This form must be run in a browser environment')
      }
      
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      console.log('Auth result:', { user, authError })
      
      if (authError) {
        console.error('Auth error:', authError)
        throw new Error(`Authentication error: ${authError.message}`)
      }
      
      if (!user) {
        console.error('No user found')
        throw new Error('User not authenticated. Please sign in again.')
      }

      console.log('✅ Step 1 complete: User authenticated:', user.id)
      console.log('Step 2: Preparing book data...')

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

      console.log('Book data prepared:', bookData)
      console.log('Step 3: Starting database insert...')
      console.log('Database URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
      console.log('User ID being used:', user.id)
      
      const startTime = Date.now()
      
      // Add timeout specifically for database insert
      const insertTimeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Database insert timeout after 10 seconds')), 10000)
      )
      
      const insertPromise = supabase
        .from('books')
        .insert([bookData])
        .select()
      
      console.log('About to execute database insert...')
      const result = await Promise.race([insertPromise, insertTimeoutPromise])
      const { data, error: insertError } = result as any

      const endTime = Date.now()
      console.log(`✅ Step 3 complete: Database insert completed in ${endTime - startTime}ms`)

      if (insertError) {
        console.error('Database insert error:', insertError)
        throw new Error(`Database error: ${insertError.message}`)
      }

      if (!data || data.length === 0) {
        throw new Error('Book was not inserted. No data returned.')
      }

      console.log('✅ Insert successful! Result data:', data)
      console.log('Step 4: Redirecting to dashboard...')

      // Clear timeout since we succeeded
      clearTimeout(timeoutId)
      // Redirect to dashboard with success message
      router.push('/dashboard?success=book-added')
      
    } catch (error: any) {
      console.error('❌ Form submission error:', error)
      setError(error.message || 'An unexpected error occurred')
    } finally {
      console.log('Setting loading to false')
      clearTimeout(timeoutId)
      setLoading(false)
    }
  }

  // Check user authentication status on component mount
  useEffect(() => {
    console.log('=== useEffect triggered ===')
    const checkUser = async () => {
      try {
        console.log('=== STARTING AUTHENTICATION CHECK ===')
        console.log('Step 1: About to call supabase.auth.getUser()...')
        
        // Add a timeout to prevent hanging
        const authPromise = supabase.auth.getUser()
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Authentication check timeout after 5 seconds')), 5000)
        )
        
        console.log('Step 2: Racing auth call with timeout...')
        const result = await Promise.race([authPromise, timeoutPromise])
        
        // Type assertion since we know what authPromise returns
        const { data: { user }, error } = result as any
        
        console.log('Step 3: Auth call completed:', { user, error })
        setUserStatus({ user, loading: false, error: error?.message || null })
        
      } catch (err: any) {
        console.error('❌ Authentication check error:', err)
        setUserStatus({ user: null, loading: false, error: err.message })
      }
    }
    
    console.log('useEffect triggered, calling checkUser...')
    checkUser()
  }, [])
  
  // Add a manual trigger button for auth check
  const manualAuthCheck = async () => {
    console.log('=== MANUAL AUTH CHECK TRIGGERED ===')
    try {
      console.log('About to call supabase.auth.getUser() manually...')
      const startTime = Date.now()
      
      // Add timeout to prevent hanging
      const authPromise = supabase.auth.getUser()
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Manual auth check timeout after 5 seconds')), 5000)
      )
      
      const { data, error } = await Promise.race([authPromise, timeoutPromise]) as any
      const endTime = Date.now()
      
      console.log(`Manual auth call completed in ${endTime - startTime}ms`)
      console.log('Manual auth result:', { data, error })
      
      if (error) {
        alert(`Manual auth failed: ${error.message}`)
      } else {
        alert(`Manual auth successful! User: ${data.user?.email || 'No email'}`)
        // Update the status
        setUserStatus({ user: data.user, loading: false, error: null })
      }
    } catch (err: any) {
      console.error('Manual auth exception:', err)
      alert(`Manual auth exception: ${err.message}`)
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="card">
        <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Add a New Literary Treasure</h2>
        
        {/* Authentication Status Display */}
        <div className="mb-6 p-4 rounded-lg border">
          <h3 className="font-semibold text-gray-700 mb-2">Authentication Status:</h3>
          {userStatus.loading ? (
            <p className="text-blue-600">Checking authentication...</p>
          ) : userStatus.error ? (
            <p className="text-red-600">❌ Auth Error: {userStatus.error}</p>
          ) : userStatus.user ? (
            <div>
              <p className="text-green-600">✅ Logged in as: {userStatus.user.email} (ID: {userStatus.user.id})</p>
              <button
                type="button"
                onClick={async () => {
                  try {
                    console.log('Testing database connection...')
                    const { data, error } = await supabase
                      .from('books')
                      .select('count')
                      .limit(1)
                    if (error) {
                      console.error('Database test error:', error)
                      alert(`Database test failed: ${error.message}`)
                    } else {
                      console.log('Database test successful:', data)
                      alert('Database connection successful!')
                    }
                  } catch (err: any) {
                    console.error('Database test exception:', err)
                    alert(`Database test exception: ${err.message}`)
                  }
                }}
                className="mt-2 px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
              >
                Test Database Connection
              </button>
              
              <button
                type="button"
                onClick={async () => {
                  try {
                    console.log('Testing Supabase client...')
                    console.log('Supabase client:', supabase)
                    console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
                    console.log('Supabase Key length:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length || 0)
                    alert('Check console for Supabase client details')
                  } catch (err: any) {
                    console.error('Supabase client test error:', err)
                    alert(`Supabase client test error: ${err.message}`)
                  }
                }}
                className="mt-2 ml-2 px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600"
              >
                Test Supabase Client
              </button>
            </div>
          ) : (
            <p className="text-orange-600">⚠️ Not logged in</p>
          )}
          
          {/* Manual Auth Check Button */}
          <button
            type="button"
            onClick={manualAuthCheck}
            className="mt-4 px-4 py-2 bg-indigo-500 text-white text-sm rounded hover:bg-indigo-600"
          >
            🔄 Manual Auth Check
          </button>
          
          {/* Bypass Auth for Testing */}
          <button
            type="button"
            onClick={() => {
              console.log('Bypassing authentication for testing...')
              setUserStatus({ 
                user: { 
                  id: 'test-user-id', 
                  email: 'test@example.com' 
                }, 
                loading: false, 
                error: null 
              })
              alert('Authentication bypassed for testing. You can now try adding a book.')
            }}
            className="mt-2 px-4 py-2 bg-orange-500 text-white text-sm rounded hover:bg-orange-600"
          >
            🚧 Bypass Auth (Testing)
          </button>
          
          {/* Environment Variables Check */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <h4 className="font-semibold text-gray-700 mb-2">Environment Check:</h4>
            <p className="text-sm text-gray-600">
              Supabase URL: {process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing'}
            </p>
            <p className="text-sm text-gray-600">
              Supabase Key: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing'}
            </p>
          </div>
          
          {/* Test Buttons */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <h4 className="font-semibold text-gray-700 mb-2">Connection Tests:</h4>
            <div className="space-y-2">
              <button
                type="button"
                onClick={async () => {
                  try {
                    console.log('Testing basic Supabase connection...')
                    const { data, error } = await supabase
                      .from('books')
                      .select('count')
                      .limit(1)
                    if (error) {
                      console.error('Basic connection test error:', error)
                      alert(`Basic connection failed: ${error.message}`)
                    } else {
                      console.log('Basic connection successful:', data)
                      alert('Basic Supabase connection successful!')
                    }
                  } catch (err: any) {
                    console.error('Basic connection test exception:', err)
                    alert(`Basic connection exception: ${err.message}`)
                  }
                }}
                className="w-full px-3 py-2 bg-yellow-500 text-white text-sm rounded hover:bg-yellow-600"
              >
                Test Basic Connection (No Auth)
              </button>
              
              <button
                type="button"
                onClick={async () => {
                  try {
                    console.log('Testing HTTP connection to Supabase...')
                    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
                    const response = await fetch(`${url}/rest/v1/`, {
                      method: 'GET',
                      headers: {
                        'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
                        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''}`
                      }
                    })
                    if (response.ok) {
                      alert(`HTTP connection successful! Status: ${response.status}`)
                    } else {
                      alert(`HTTP connection failed! Status: ${response.status}`)
                    }
                  } catch (err: any) {
                    alert(`HTTP test exception: ${err.message}`)
                  }
                }}
                className="w-full px-3 py-2 bg-red-500 text-white text-sm rounded hover:bg-red-600"
              >
                Test HTTP Connection
              </button>
              
              <button
                type="button"
                onClick={async () => {
                  try {
                    console.log('Testing Supabase auth endpoint...')
                    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
                    console.log('Testing auth endpoint:', `${url}/auth/v1/user`)
                    
                    const response = await fetch(`${url}/auth/v1/user`, {
                      method: 'GET',
                      headers: {
                        'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
                        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''}`
                      }
                    })
                    
                    console.log('Auth endpoint response status:', response.status)
                    console.log('Auth endpoint response headers:', response.headers)
                    
                    if (response.ok) {
                      const text = await response.text()
                      console.log('Auth endpoint response body:', text)
                      alert(`Auth endpoint test successful! Status: ${response.status}`)
                    } else {
                      alert(`Auth endpoint test failed! Status: ${response.status}`)
                    }
                  } catch (err: any) {
                    console.error('Auth endpoint test exception:', err)
                    alert(`Auth endpoint test exception: ${err.message}`)
                  }
                }}
                className="w-full px-3 py-2 bg-green-500 text-white text-sm rounded hover:bg-green-600"
              >
                Test Auth Endpoint
              </button>
            </div>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
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
              <label htmlFor="author" className="block text-sm font-medium text-gray-700 mb-2">
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
              <label htmlFor="isbn" className="block text-sm font-medium text-gray-700 mb-2">
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
              <label htmlFor="language" className="block text-sm font-medium text-gray-700 mb-2">
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
              <label htmlFor="publishedYear" className="block text-sm font-medium text-gray-700 mb-2">
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
              <label htmlFor="condition" className="block text-sm font-medium text-gray-700 mb-2">
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
              <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-2">
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
              <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
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
              <label htmlFor="zipCode" className="block text-sm font-medium text-gray-700 mb-2">
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
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Genres (Select all that apply)
            </label>
            <div className="grid grid-cols-3 gap-3">
              {genres.map(genreOption => (
                <label key={genreOption} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={genre.includes(genreOption)}
                    onChange={() => handleGenreToggle(genreOption)}
                    className="rounded border-amber-500/30 text-amber-500 focus:ring-amber-500/50 bg-white"
                  />
                                      <span className="ml-3 text-sm text-gray-700">{genreOption}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
                          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
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

