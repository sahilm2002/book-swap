import pLimit from 'p-limit'

// Configuration
const GOOGLE_BOOKS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_BOOKS_API_KEY || process.env.GOOGLE_BOOKS_API_KEY
const RATE_LIMIT_CONCURRENCY = parseInt(process.env.BOOK_COVERS_CONCURRENCY || '3')
const CACHE_TTL_MS = parseInt(process.env.BOOK_COVERS_CACHE_TTL || '3600000') // 1 hour default
const MAX_RETRIES = parseInt(process.env.BOOK_COVERS_MAX_RETRIES || '3')
const RETRY_DELAY_MS = parseInt(process.env.BOOK_COVERS_RETRY_DELAY || '1000') // 1 second default

// In-memory cache for book covers
interface CacheEntry {
  url: string
  timestamp: number
}

const coverCache = new Map<string, CacheEntry>()

// Rate limiter using p-limit
const rateLimiter = pLimit(RATE_LIMIT_CONCURRENCY)

// Retry helper with exponential backoff
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = MAX_RETRIES,
  baseDelay: number = RETRY_DELAY_MS
): Promise<T> {
  let lastError: Error
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error as Error
      
      if (attempt === maxRetries) {
        throw lastError
      }
      
      // Don't retry on client errors (4xx) except 429 (rate limited)
      if (error instanceof Response && error.status >= 400 && error.status < 500 && error.status !== 429) {
        throw lastError
      }
      
      // Exponential backoff with jitter
      const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  
  throw lastError!
}

// Enhanced fetch helper with proper error handling
async function fetchWithRetry(url: string, options: RequestInit = {}): Promise<Response> {
  return retryWithBackoff(async () => {
    const response = await fetch(url, {
      ...options,
      headers: {
        'User-Agent': 'BookSwap/1.0',
        ...options.headers,
      },
    })
    
    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error')
      throw new Error(`HTTP ${response.status}: ${errorText}`)
    }
    
    return response
  })
}

// Helper function to enhance Google Books image URL quality
function enhanceGoogleBooksImageUrl(url: string): string {
  try {
    const urlObj = new URL(url)
    
    // Check if this is a Google Books URL
    if (urlObj.hostname.includes('books.google.com')) {
      // Set zoom parameter to 2 for higher quality
      urlObj.searchParams.set('zoom', '2')
      
      // Also try to get the best available image size
      // Google Books often has multiple size options
      if (urlObj.searchParams.has('img')) {
        // Try to get a larger image if available
        const currentImg = urlObj.searchParams.get('img')
        if (currentImg && parseInt(currentImg) < 5) {
          // Increment image size for better quality
          urlObj.searchParams.set('img', String(parseInt(currentImg) + 1))
        }
      }
      
      return urlObj.toString()
    }
    
    return url
  } catch (error) {
    // If URL parsing fails, return original URL
    console.warn('Failed to enhance Google Books image URL:', error)
    return url
  }
}

// Cache management
function getCacheKey(title: string, author?: string): string {
  const normalizedTitle = title.toLowerCase().trim()
  const normalizedAuthor = author ? author.toLowerCase().trim() : ''
  return `${normalizedTitle}|${normalizedAuthor}`
}

function getFromCache(title: string, author?: string): string | null {
  const key = getCacheKey(title, author)
  const entry = coverCache.get(key)
  
  if (entry && Date.now() - entry.timestamp < CACHE_TTL_MS) {
    return entry.url
  }
  
  // Remove expired entry
  if (entry) {
    coverCache.delete(key)
  }
  
  return null
}

function setCache(title: string, author: string | undefined, url: string): void {
  const key = getCacheKey(title, author)
  coverCache.set(key, {
    url,
    timestamp: Date.now()
  })
  
  // Clean up old entries if cache gets too large
  if (coverCache.size > 1000) {
    const now = Date.now()
    for (const [key, entry] of coverCache.entries()) {
      if (now - entry.timestamp > CACHE_TTL_MS) {
        coverCache.delete(key)
      }
    }
  }
}

// Main function to fetch book cover with all enhancements
export async function fetchBookCover(title: string, author?: string): Promise<string | null> {
  // Check cache first
  const cachedUrl = getFromCache(title, author)
  if (cachedUrl) {
    console.log(`Cache hit for "${title}" by ${author || 'unknown'}`)
    return cachedUrl
  }
  
  // Validate API key
  if (!GOOGLE_BOOKS_API_KEY) {
    console.warn('Google Books API key not configured. Book cover fetching disabled.')
    return null
  }
  
  // Use rate limiter to enforce concurrency limits
  return rateLimiter(async () => {
    try {
      // Create search query
      let query = `"${title}"`
      if (author) {
        query += ` "${author}"`
      }
      
      // Encode the query for URL
      const encodedQuery = encodeURIComponent(query)
      
      // Build URL with API key
      const url = `https://www.googleapis.com/books/v1/volumes?q=${encodedQuery}&maxResults=1&key=${GOOGLE_BOOKS_API_KEY}`
      
      console.log(`Fetching cover for "${title}" by ${author || 'unknown'}`)
      
      // Fetch from Google Books API with retry logic
      const response = await fetchWithRetry(url)
      const data: GoogleBooksResponse = await response.json()
      
      // Check if we got results and if the first result has an image
      if (data.items && data.items.length > 0) {
        const book = data.items[0]
        const imageLinks = book.volumeInfo.imageLinks
        
        // Return the best available image
        if (imageLinks?.thumbnail) {
          // Enhance the thumbnail URL for better quality
          const enhancedUrl = enhanceGoogleBooksImageUrl(imageLinks.thumbnail)
          setCache(title, author, enhancedUrl)
          return enhancedUrl
        } else if (imageLinks?.smallThumbnail) {
          // Enhance the small thumbnail URL as well
          const enhancedUrl = enhanceGoogleBooksImageUrl(imageLinks.smallThumbnail)
          setCache(title, author, enhancedUrl)
          return enhancedUrl
        }
      }
      
      // Cache negative results to avoid repeated failed requests
      setCache(title, author, '')
      return null
      
    } catch (error) {
      console.error(`Error fetching book cover for "${title}":`, error)
      
      // Cache negative results for failed requests
      setCache(title, author, '')
      return null
    }
  })
}

// Batch fetch multiple book covers with rate limiting
export async function fetchBookCoversBatch(
  books: Array<{ title: string; author?: string }>
): Promise<Map<string, string | null>> {
  const results = new Map<string, string | null>()
  
  // Process books in batches to respect rate limits
  const batchSize = Math.ceil(books.length / Math.ceil(books.length / RATE_LIMIT_CONCURRENCY))
  
  for (let i = 0; i < books.length; i += batchSize) {
    const batch = books.slice(i, i + batchSize)
    
    const batchPromises = batch.map(async (book) => {
      const key = `${book.title}|${book.author || ''}`
      const coverUrl = await fetchBookCover(book.title, book.author)
      return { key, coverUrl }
    })
    
    const batchResults = await Promise.allSettled(batchPromises)
    
    batchResults.forEach((result) => {
      if (result.status === 'fulfilled') {
        results.set(result.value.key, result.value.coverUrl)
      } else {
        console.error('Batch fetch failed for book:', result.reason)
        // Set null for failed fetches
        const book = books.find(b => `${b.title}|${b.author || ''}` === result.reason?.key)
        if (book) {
          const key = `${book.title}|${book.author || ''}`
          results.set(key, null)
        }
      }
    })
    
    // Small delay between batches to be respectful
    if (i + batchSize < books.length) {
      await new Promise(resolve => setTimeout(resolve, 100))
    }
  }
  
  return results
}

// Cache management functions
export function clearCoverCache(): void {
  coverCache.clear()
  console.log('Book cover cache cleared')
}

export function getCacheStats(): { size: number; hitRate: number } {
  // This is a simplified implementation - in production you'd want more sophisticated metrics
  return {
    size: coverCache.size,
    hitRate: 0.5 // Placeholder - would need to track actual hits/misses
  }
}

export function getBookCoverUrl(book: { title: string; author: string; coverImage?: string | null }): string | null {
  // If we already have a cover image, use it
  if (book.coverImage) {
    return book.coverImage
  }
  
  // For now, return null - we'll implement the fetching logic in the components
  // This allows us to gradually implement the feature
  return null
}

// Helper function to validate image URLs
export function isValidImageUrl(url: string): boolean {
  try {
    const urlObj = new URL(url)
    const allowedHostnames = [
      'books.google.com',
      'covers.openlibrary.org',
      'images-na.ssl-images-amazon.com',
      'm.media-amazon.com',
      'images.booksense.com',
      'bookcoverarchive.com'
    ]
    
    return allowedHostnames.some(hostname => urlObj.hostname.includes(hostname))
  } catch {
    return false
  }
}

// Types
interface GoogleBooksResponse {
  items?: Array<{
    volumeInfo: {
      imageLinks?: {
        thumbnail?: string
        smallThumbnail?: string
      }
    }
  }>
}
