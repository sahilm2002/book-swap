'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'
import { History, BookOpen, Calendar, MapPin, ArrowRight } from 'lucide-react'
import Link from 'next/link'

interface SwapRecord {
  id: string
  book_given_id: string
  book_received_id: string
  book_given_title: string
  book_given_author: string
  book_received_title: string
  book_received_author: string
  swap_date: string
  status: 'completed' | 'pending' | 'cancelled'
  partner_name?: string
  partner_email?: string
}

export default function SwapHistoryPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [swaps, setSwaps] = useState<SwapRecord[]>([])
  const [filter, setFilter] = useState<'all' | 'completed' | 'pending' | 'cancelled'>('all')

  useEffect(() => {
    if (!user) {
      router.push('/auth/login')
      return
    }
    
    fetchSwapHistory()
  }, [user, router])

  const fetchSwapHistory = async () => {
    if (!user) return
    
    try {
      setLoading(true)
      
      // Fetch swaps where user is either the giver or receiver
      const { data: swapsData, error } = await supabase
        .from('book_swaps')
        .select(`
          id,
          book_given_id,
          book_received_id,
          swap_date,
          status,
          books_given:books!book_swaps_book_given_id_fkey(title, author),
          books_received:books!book_swaps_book_received_id_fkey(title, author),
          partner:users!book_swaps_partner_id_fkey(full_name, email)
        `)
        .or(`giver_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('swap_date', { ascending: false })
      
      if (error) throw error
      
      // Transform the data to match our interface
      const transformedSwaps: SwapRecord[] = swapsData?.map(swap => ({
        id: swap.id,
        book_given_id: swap.book_given_id,
        book_received_id: swap.book_received_id,
        book_given_title: (swap.books_given as any)?.title || 'Unknown Book',
        book_given_author: (swap.books_given as any)?.author || 'Unknown Author',
        book_received_title: (swap.books_received as any)?.title || 'Unknown Book',
        book_received_author: (swap.books_received as any)?.author || 'Unknown Author',
        swap_date: swap.swap_date,
        status: swap.status,
        partner_name: (swap.partner as any)?.full_name,
        partner_email: (swap.partner as any)?.email
      })) || []
      
      setSwaps(transformedSwaps)
    } catch (error) {
      console.error('Error fetching swap history:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Completed'
      case 'pending':
        return 'Pending'
      case 'cancelled':
        return 'Cancelled'
      default:
        return 'Unknown'
    }
  }

  const filteredSwaps = swaps.filter(swap => {
    if (filter === 'all') return true
    return swap.status === filter
  })

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900">Swap History</h1>
            <Link href="/dashboard" className="btn-secondary">
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Stats Overview */}
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {swaps.length}
              </div>
              <div className="text-gray-600">Total Swaps</div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">
                {swaps.filter(s => s.status === 'completed').length}
              </div>
              <div className="text-gray-600">Completed</div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
              <div className="text-3xl font-bold text-yellow-600 mb-2">
                {swaps.filter(s => s.status === 'pending').length}
              </div>
              <div className="text-gray-600">Pending</div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
              <div className="text-3xl font-bold text-red-600 mb-2">
                {swaps.filter(s => s.status === 'cancelled').length}
              </div>
              <div className="text-gray-600">Cancelled</div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Filter Swaps</h2>
            <div className="flex flex-wrap gap-3">
              {(['all', 'completed', 'pending', 'cancelled'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setFilter(status)}
                  className={`px-4 py-2 rounded-lg border transition-all duration-200 ${
                    filter === status
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {status === 'all' ? 'All Swaps' : getStatusText(status)}
                </button>
              ))}
            </div>
          </div>

          {/* Swap History List */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-3">
                <History className="w-6 h-6 text-blue-600" />
                Swap History
              </h2>
            </div>

            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading swap history...</p>
              </div>
            ) : filteredSwaps.length === 0 ? (
              <div className="p-8 text-center">
                <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No swaps found</h3>
                <p className="text-gray-600 mb-4">
                  {filter === 'all' 
                    ? "You haven't made any book swaps yet." 
                    : `No ${filter} swaps found.`
                  }
                </p>
                <Link href="/browse" className="btn-primary">
                  Browse Books to Swap
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {filteredSwaps.map((swap) => (
                  <div key={swap.id} className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(swap.status)}`}>
                          {getStatusText(swap.status)}
                        </span>
                        <span className="text-sm text-gray-500">
                          {new Date(swap.swap_date).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6 items-center">
                      {/* Book Given */}
                      <div className="text-center">
                        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                          <h4 className="font-medium text-blue-900 mb-2">Book You Gave</h4>
                          <div className="space-y-2">
                            <p className="font-semibold text-blue-800">{swap.book_given_title}</p>
                            <p className="text-sm text-blue-700">by {swap.book_given_author}</p>
                          </div>
                        </div>
                      </div>

                      {/* Swap Arrow */}
                      <div className="flex justify-center">
                        <div className="bg-gray-100 rounded-full p-3">
                          <ArrowRight className="w-6 h-6 text-gray-600" />
                        </div>
                      </div>

                      {/* Book Received */}
                      <div className="text-center">
                        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                          <h4 className="font-medium text-green-900 mb-2">Book You Received</h4>
                          <div className="space-y-2">
                            <p className="font-semibold text-green-800">{swap.book_received_title}</p>
                            <p className="text-sm text-green-700">by {swap.book_received_author}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Partner Information */}
                    {swap.partner_name && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <MapPin className="w-4 h-4" />
                          <span>
                            Swapped with: <span className="font-medium text-gray-900">{swap.partner_name}</span>
                            {swap.partner_email && ` (${swap.partner_email})`}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Empty State for No Swaps */}
          {!loading && swaps.length === 0 && (
            <div className="text-center py-12">
              <History className="w-24 h-24 text-gray-400 mx-auto mb-6" />
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">Start Your Book Swapping Journey</h3>
              <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
                You haven't made any book swaps yet. Start by browsing available books 
                or adding your own books to share with the community.
              </p>
              <div className="flex gap-4 justify-center">
                <Link href="/browse" className="btn-primary">
                  Browse Books
                </Link>
                <Link href="/add-book" className="btn-secondary">
                  Add Your Books
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
