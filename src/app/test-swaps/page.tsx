'use client'

import { useState } from 'react'
import { BookOpen, User, Calendar, CheckCircle, XCircle, Clock, Bell } from 'lucide-react'

interface MockBook {
  id: string
  title: string
  author: string
  condition: string
  owner: string
}

interface MockSwap {
  id: string
  bookOffered: MockBook
  bookRequested: MockBook
  requester: string
  owner: string
  status: 'pending' | 'approved' | 'denied' | 'completed' | 'cancelled'
  createdAt: string
}

const mockBooks: MockBook[] = [
  { id: '1', title: 'The Great Gatsby', author: 'F. Scott Fitzgerald', condition: 'Good', owner: 'Alice Johnson' },
  { id: '2', title: '1984', author: 'George Orwell', condition: 'Like New', owner: 'Bob Smith' },
  { id: '3', title: 'Pride and Prejudice', author: 'Jane Austen', condition: 'Fair', owner: 'Carol Davis' },
  { id: '4', title: 'To Kill a Mockingbird', author: 'Harper Lee', condition: 'Good', owner: 'Demo User' },
  { id: '5', title: 'The Catcher in the Rye', author: 'J.D. Salinger', condition: 'Like New', owner: 'Demo User' },
]

export default function TestSwapsPage() {
  const [swaps, setSwaps] = useState<MockSwap[]>([
    {
      id: '1',
      bookOffered: mockBooks[3],
      bookRequested: mockBooks[0],
      requester: 'Demo User',
      owner: 'Alice Johnson',
      status: 'pending',
      createdAt: '2024-01-15T10:30:00Z'
    },
    {
      id: '2',
      bookOffered: mockBooks[4],
      bookRequested: mockBooks[1],
      requester: 'Demo User',
      owner: 'Bob Smith',
      status: 'approved',
      createdAt: '2024-01-14T14:20:00Z'
    }
  ])

  const [notifications, setNotifications] = useState<string[]>([
    'Your swap request for "The Great Gatsby" is pending approval',
    'Bob Smith approved your swap for "1984"'
  ])

  const [selectedBook, setSelectedBook] = useState<MockBook | null>(null)
  const [showCreateSwap, setShowCreateSwap] = useState(false)

  const createSwap = (offeredBook: MockBook, requestedBook: MockBook) => {
    const newSwap: MockSwap = {
      id: (swaps.length + 1).toString(),
      bookOffered: offeredBook,
      bookRequested: requestedBook,
      requester: 'Demo User',
      owner: requestedBook.owner,
      status: 'pending',
      createdAt: new Date().toISOString()
    }
    
    setSwaps([...swaps, newSwap])
    setNotifications([...notifications, `New swap request created for "${requestedBook.title}"`])
    setShowCreateSwap(false)
    setSelectedBook(null)
  }

  const updateSwapStatus = (swapId: string, newStatus: MockSwap['status']) => {
    setSwaps(swaps.map(swap => 
      swap.id === swapId ? { ...swap, status: newStatus } : swap
    ))
    
    const swap = swaps.find(s => s.id === swapId)
    if (swap) {
      setNotifications([...notifications, `Swap "${swap.bookRequested.title}" status updated to ${newStatus}`])
    }
  }

  const cancelSwap = (swapId: string) => {
    updateSwapStatus(swapId, 'cancelled')
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4 text-yellow-500" />
      case 'approved': return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'denied': return <XCircle className="w-4 h-4 text-red-500" />
      case 'completed': return <CheckCircle className="w-4 h-4 text-blue-500" />
      case 'cancelled': return <XCircle className="w-4 h-4 text-gray-500" />
      default: return null
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500/20 text-yellow-300'
      case 'approved': return 'bg-green-500/20 text-green-300'
      case 'denied': return 'bg-red-500/20 text-red-300'
      case 'completed': return 'bg-blue-500/20 text-blue-300'
      case 'cancelled': return 'bg-gray-500/20 text-gray-300'
      default: return 'bg-gray-500/20 text-gray-300'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-amber-200 mb-4">📚 Book Swap Testing 🍷</h1>
          <p className="text-slate-300 text-lg">Test all the dynamic book swap functionality, notifications, and status changes!</p>
        </div>

        {/* Notifications Panel */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-amber-500/20 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Bell className="w-5 h-5 text-amber-400" />
            <h2 className="text-xl font-semibold text-amber-200">Live Notifications</h2>
            <span className="bg-amber-500 text-slate-900 text-xs px-2 py-1 rounded-full font-bold">
              {notifications.length}
            </span>
          </div>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {notifications.map((notification, index) => (
              <div key={index} className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 text-slate-300">
                {notification}
              </div>
            ))}
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Current Swaps */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-amber-500/20">
            <h2 className="text-2xl font-semibold text-amber-200 mb-6">Your Active Swaps</h2>
            <div className="space-y-4">
              {swaps.map((swap) => (
                <div key={swap.id} className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(swap.status)}
                      <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${getStatusColor(swap.status)}`}>
                        {swap.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <Calendar className="w-3 h-3" />
                      {new Date(swap.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="text-sm text-slate-400">You're offering:</div>
                        <div className="text-amber-200 font-medium">{swap.bookOffered.title}</div>
                        <div className="text-xs text-slate-500">by {swap.bookOffered.author}</div>
                      </div>
                      <div className="text-2xl">↔️</div>
                      <div className="text-right">
                        <div className="text-sm text-slate-400">Requesting:</div>
                        <div className="text-amber-200 font-medium">{swap.bookRequested.title}</div>
                        <div className="text-xs text-slate-500">by {swap.bookRequested.author}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between pt-3 border-t border-slate-600">
                      <div className="flex items-center gap-2 text-sm text-slate-400">
                        <User className="w-3 h-3" />
                        With: {swap.owner}
                      </div>
                      
                      <div className="flex gap-2">
                        {swap.status === 'pending' && (
                          <button
                            onClick={() => cancelSwap(swap.id)}
                            className="px-3 py-1 bg-red-500/20 text-red-300 rounded text-sm hover:bg-red-500/30 transition-colors"
                          >
                            Cancel
                          </button>
                        )}
                        {swap.status === 'approved' && (
                          <button
                            onClick={() => updateSwapStatus(swap.id, 'completed')}
                            className="px-3 py-1 bg-green-500/20 text-green-300 rounded text-sm hover:bg-green-500/30 transition-colors"
                          >
                            Mark Complete
                          </button>
                        )}
                        {/* Simulate owner actions for testing */}
                        {swap.status === 'pending' && (
                          <>
                            <button
                              onClick={() => updateSwapStatus(swap.id, 'approved')}
                              className="px-3 py-1 bg-green-500/20 text-green-300 rounded text-sm hover:bg-green-500/30 transition-colors"
                            >
                              Approve (Test)
                            </button>
                            <button
                              onClick={() => updateSwapStatus(swap.id, 'denied')}
                              className="px-3 py-1 bg-red-500/20 text-red-300 rounded text-sm hover:bg-red-500/30 transition-colors"
                            >
                              Deny (Test)
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Available Books */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-amber-500/20">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold text-amber-200">Available Books</h2>
              <button
                onClick={() => setShowCreateSwap(!showCreateSwap)}
                className="px-4 py-2 bg-amber-500 text-slate-900 rounded-lg font-semibold hover:bg-amber-600 transition-colors"
              >
                Create New Swap
              </button>
            </div>
            
            <div className="space-y-3">
              {mockBooks.filter(book => book.owner !== 'Demo User').map((book) => (
                <div
                  key={book.id}
                  className={`bg-slate-700/50 rounded-lg p-4 border cursor-pointer transition-all ${
                    selectedBook?.id === book.id ? 'border-amber-500 bg-amber-500/10' : 'border-slate-600 hover:border-amber-500/50'
                  }`}
                  onClick={() => setSelectedBook(book)}
                >
                  <div className="flex items-center gap-3">
                    <BookOpen className="w-5 h-5 text-amber-400" />
                    <div className="flex-1">
                      <div className="text-amber-200 font-medium">{book.title}</div>
                      <div className="text-slate-400 text-sm">by {book.author}</div>
                      <div className="flex items-center gap-4 text-xs text-slate-500 mt-1">
                        <span>Condition: {book.condition}</span>
                        <span>Owner: {book.owner}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Create Swap Form */}
            {showCreateSwap && selectedBook && (
              <div className="mt-6 p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                <h3 className="text-lg font-semibold text-amber-200 mb-3">Create Swap Request</h3>
                <div className="space-y-3">
                  <div>
                    <div className="text-sm text-slate-400">You want:</div>
                    <div className="text-amber-200 font-medium">{selectedBook.title}</div>
                  </div>
                  
                  <div>
                    <div className="text-sm text-slate-400">Choose book to offer:</div>
                    <div className="space-y-2 mt-2">
                      {mockBooks.filter(book => book.owner === 'Demo User').map((book) => (
                        <button
                          key={book.id}
                          onClick={() => createSwap(book, selectedBook)}
                          className="w-full text-left p-3 bg-slate-700 rounded border border-slate-600 hover:border-amber-500/50 transition-colors"
                        >
                          <div className="text-amber-200 font-medium">{book.title}</div>
                          <div className="text-slate-400 text-sm">by {book.author} • {book.condition}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Testing Instructions */}
        <div className="mt-8 bg-blue-500/10 border border-blue-500/30 rounded-xl p-6">
          <h3 className="text-xl font-semibold text-blue-300 mb-3">🧪 Testing Instructions</h3>
          <div className="grid md:grid-cols-2 gap-4 text-slate-300">
            <div>
              <h4 className="font-semibold text-blue-200 mb-2">What you can test:</h4>
              <ul className="space-y-1 text-sm">
                <li>• Create new swap requests</li>
                <li>• Cancel pending swaps</li>
                <li>• Approve/deny swaps (simulated)</li>
                <li>• Mark swaps as completed</li>
                <li>• Watch live notifications update</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-blue-200 mb-2">How it works:</h4>
              <ul className="space-y-1 text-sm">
                <li>• Click on books to select them</li>
                <li>• Use "Create New Swap" to request books</li>
                <li>• Test buttons simulate other user actions</li>
                <li>• All changes update notifications in real-time</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}