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
        // Convert thumbnail URL to higher quality
        const thumbnailUrl = imageLinks.thumbnail
        // Replace zoom=1 with zoom=2 for better quality
        const highQualityUrl = thumbnailUrl.replace('zoom=1', 'zoom=2')
        return highQualityUrl
      } else if (imageLinks?.smallThumbnail) {
        return imageLinks.smallThumbnail
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
