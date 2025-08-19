interface GoogleBooksResponse {
  items?: Array<{
    volumeInfo: {
      title: string
      authors?: string[]
      imageLinks?: {
        thumbnail?: string
        smallThumbnail?: string
      }
    }
  }>
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

export async function fetchBookCover(title: string, author?: string): Promise<string | null> {
  try {
    // Create search query
    let query = `"${title}"`
    if (author) {
      query += ` "${author}"`
    }
    
    // Encode the query for URL
    const encodedQuery = encodeURIComponent(query)
    
    // Fetch from Google Books API
    const response = await fetch(
      `https://www.googleapis.com/books/v1/volumes?q=${encodedQuery}&maxResults=1`
    )
    
    if (!response.ok) {
      throw new Error('Failed to fetch book cover')
    }
    
    const data: GoogleBooksResponse = await response.json()
    
    // Check if we got results and if the first result has an image
    if (data.items && data.items.length > 0) {
      const book = data.items[0]
      const imageLinks = book.volumeInfo.imageLinks
      
      // Return the best available image
      if (imageLinks?.thumbnail) {
        // Enhance the thumbnail URL for better quality
        const enhancedUrl = enhanceGoogleBooksImageUrl(imageLinks.thumbnail)
        return enhancedUrl
      } else if (imageLinks?.smallThumbnail) {
        // Enhance the small thumbnail URL as well
        const enhancedUrl = enhanceGoogleBooksImageUrl(imageLinks.smallThumbnail)
        return enhancedUrl
      }
    }
    
    return null
  } catch (error) {
    console.error('Error fetching book cover:', error)
    return null
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
