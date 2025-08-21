// Google Books API utility functions
const GOOGLE_BOOKS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_BOOKS_API_KEY

export interface GoogleBook {
  id: string
  volumeInfo: {
    title: string
    authors: string[]
    description?: string
    imageLinks?: {
      thumbnail?: string
      smallThumbnail?: string
    }
    publishedDate?: string
    pageCount?: number
    language?: string
    previewLink?: string
    infoLink?: string
  }
}

export async function searchGoogleBooks(query: string): Promise<GoogleBook[]> {
  if (!GOOGLE_BOOKS_API_KEY) {
    console.warn('Google Books API key not found')
    return []
  }

  try {
    const response = await fetch(
      `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&key=${GOOGLE_BOOKS_API_KEY}`
    )
    
    if (!response.ok) {
      throw new Error(`Google Books API error: ${response.status}`)
    }
    
    const data = await response.json()
    return data.items || []
  } catch (error) {
    console.error('Error searching Google Books:', error)
    return []
  }
}

export function getGoogleBooksUrl(bookId: string): string {
  return `https://books.google.com/books?id=${bookId}`
}

export function getGoogleBooksSearchUrl(title: string, author: string): string {
  const query = `${title} ${author}`.trim()
  return `https://books.google.com/books?q=${encodeURIComponent(query)}`
}
