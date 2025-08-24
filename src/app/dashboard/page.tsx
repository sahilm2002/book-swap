'use client'

import { useAuth } from '@/lib/auth-context'
import AuthGuard from '@/components/AuthGuard'
import Navigation from '@/components/Navigation'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Book } from '@/types/book'
import LoadingSpinner from '@/components/LoadingSpinner'
import Link from 'next/link'

export default function Dashboard() {
  const { user } = useAuth()
  const [books, setBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!user) return

    let mounted = true
    const abortController = new AbortController()

    const fetchUserBooks = async () => {
      try {
        setLoading(true)
        const { data: booksData, error: booksError } = await supabase
          .from('books')
          .select('*')
          .eq('owner_id', user.id)
          .order('created_at', { ascending: false })

        if (booksError) throw booksError

        // Only update state if component is still mounted and user hasn't changed
        if (mounted) {
          // Transform the data to match the Book type
          const transformedBooks: Book[] = booksData?.map(book => ({
            id: book.id,
            title: book.title,
            author: book.author,
            isbn: book.isbn,
            genre: book.genre || [],
            description: book.description,
            coverImage: book.cover_image || null,
            publishedYear: book.published_year,
            language: book.language,
            condition: book.condition,
            ownerId: book.owner_id,
            location: book.location,
            availableForSwap: book.available_for_swap,
            swapStatus: book.swap_status,
            createdAt: book.created_at,
            updatedAt: book.updated_at
          })) || []

          setBooks(transformedBooks)
        }
      } catch (error) {
        if (mounted) {
          console.error('Error fetching user books:', error)
          setBooks([])
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    fetchUserBooks()

    return () => {
      mounted = false
      abortController.abort()
    }
  }, [user])

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <Navigation />
        
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-amber-200 mb-4">Dashboard</h1>
            <p className="text-slate-400">Welcome back, {user?.email}</p>
          </div>

          <div className="grid gap-6">
            {/* Quick Stats */}
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-6 border border-slate-700">
                <h3 className="text-lg font-semibold text-amber-200 mb-2">Total Books</h3>
                <p className="text-3xl font-bold text-white">{books.length}</p>
              </div>
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-6 border border-slate-700">
                <h3 className="text-lg font-semibold text-amber-200 mb-2">Available for Swap</h3>
                <p className="text-3xl font-bold text-white">{books.filter(b => b.availableForSwap).length}</p>
              </div>
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-6 border border-slate-700">
                <h3 className="text-lg font-semibold text-amber-200 mb-2">Active Swaps</h3>
                <p className="text-3xl font-bold text-white">0</p>
              </div>
            </div>

            {/* User's Books */}
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-6 border border-slate-700">
              <h2 className="text-2xl font-bold text-amber-200 mb-6">Your Books</h2>
              
              {loading ? (
                <div className="flex justify-center py-8">
                  <LoadingSpinner size="lg" />
                </div>
              ) : books.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-slate-400 mb-4">You haven't added any books yet.</p>
                  <Link 
                    href="/add-book" 
                    className="inline-flex items-center px-4 py-2 bg-amber-500 text-slate-900 font-semibold rounded-lg hover:bg-amber-600 transition-colors"
                  >
                    Add Your First Book
                  </Link>
                </div>
              ) : (
                <div className="grid gap-4">
                  {books.map(book => (
                    <div key={book.id} className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
                      <h3 className="text-lg font-semibold text-white mb-2">{book.title}</h3>
                      <p className="text-slate-300 mb-2">by {book.author}</p>
                      <div className="flex items-center gap-4 text-sm text-slate-400">
                        <span>Condition: {book.condition}</span>
                        <span>Location: {book.location}</span>
                        <span className={book.availableForSwap ? 'text-green-400' : 'text-red-400'}>
                          {book.availableForSwap ? 'Available for Swap' : 'Not Available'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}