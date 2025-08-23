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
  concurrencyLimit: number = 3
): Promise<void> => {
  const booksWithoutCovers = books.filter(book => !book.coverImage)
  
  if (booksWithoutCovers.length === 0) {
    console.log('No books without covers found')
    return
  }
  
  console.log(`Fetching missing covers for ${booksWithoutCovers.length} books`)
  
  // Process books sequentially for more reliable results
  for (const book of booksWithoutCovers) {
    try {
      // Mark as loading
      callbacks.onLoadingChange(book.id, true)
      
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
        } else {
          console.log(`Successfully updated cover in database for ${book.title}`)
          
          // Call the update callback to update local state
          callbacks.onUpdate(book.id, coverUrl)
        }
      } else {
        console.log(`No cover found for ${book.title}`)
      }
      
      // Reduced delay for faster response while still being respectful to the API
      await new Promise(resolve => setTimeout(resolve, 200))
      
    } catch (error) {
      console.error(`Failed to fetch cover for ${book.title}:`, error)
    } finally {
      // Mark as not loading
      callbacks.onLoadingChange(book.id, false)
    }
  }
  
  console.log('Finished fetching all missing covers')
}
