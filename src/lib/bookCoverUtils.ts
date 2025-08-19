import { supabase } from './supabase'
import { fetchBookCover } from './bookCovers'

export interface BookCoverUpdate {
  bookId: string
  coverUrl: string
}

export interface BookCoverUtilsCallbacks {
  onUpdate: (bookId: string, coverUrl: string) => void
  onLoadingChange: (bookId: string, isLoading: boolean) => void
}

/**
 * Fetches missing book covers for a list of books
 * @param books - Array of books to check for missing covers
 * @param callbacks - Object containing onUpdate and onLoadingChange functions
 * @param concurrencyLimit - Number of covers to fetch concurrently (default: 5)
 */
export const fetchMissingCovers = async <T extends { id: string; title: string; author: string; coverImage?: string }>(
  books: T[],
  callbacks: BookCoverUtilsCallbacks,
  concurrencyLimit: number = 5
): Promise<void> => {
  const booksWithoutCovers = books.filter(book => !book.coverImage)
  
  if (booksWithoutCovers.length === 0) {
    console.log('No books without covers found')
    return
  }
  
  console.log(`Fetching missing covers for ${booksWithoutCovers.length} books`)
  
  // Process books in batches to control concurrency
  for (let i = 0; i < booksWithoutCovers.length; i += concurrencyLimit) {
    const batch = booksWithoutCovers.slice(i, i + concurrencyLimit)
    const batchIds = batch.map(book => book.id)
    
    // Mark all batch IDs as loading in a single state update
    batchIds.forEach(id => callbacks.onLoadingChange(id, true))
    
    // Process batch concurrently
    const batchPromises = batch.map(async (book) => {
      try {
        console.log(`Fetching cover for: ${book.title} by ${book.author}`)
        const coverUrl = await fetchBookCover(book.title, book.author)
        
        if (coverUrl) {
          console.log(`Found cover for ${book.title}:`, coverUrl)
          
          // Update the book in the database
          const { error } = await supabase
            .from('books')
            .update({ cover_image: coverUrl })
            .eq('id', book.id)
          
          if (error) {
            console.error(`Error updating cover in database for ${book.title}:`, error)
            return { success: false, bookId: book.id, error: error.message }
          } else {
            console.log(`Successfully updated cover in database for ${book.title}`)
            
            // Call the update callback to update local state
            callbacks.onUpdate(book.id, coverUrl)
            
            return { success: true, bookId: book.id, coverUrl }
          }
        } else {
          console.log(`No cover found for ${book.title}`)
          return { success: false, bookId: book.id, error: 'No cover found' }
        }
      } catch (error) {
        console.error(`Failed to fetch cover for ${book.title}:`, error)
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        return { success: false, bookId: book.id, error: errorMessage }
      }
    })
    
    // Wait for all promises in the batch to settle
    const results = await Promise.allSettled(batchPromises)
    
    // Log results for debugging
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        const { success, bookId, coverUrl, error } = result.value
        if (success) {
          console.log(`Successfully fetched cover for book ${bookId}`)
        } else {
          console.warn(`No cover found for book ${bookId}: ${error}`)
        }
      } else {
        console.error(`Promise rejected for book in batch:`, result.reason)
      }
    })
    
    // Remove all batch IDs from loading state in a single update
    batchIds.forEach(id => callbacks.onLoadingChange(id, false))
  }
}
