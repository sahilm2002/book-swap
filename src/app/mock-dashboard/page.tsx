'use client'

import { useState } from 'react'
import { BookOpen, Users, TrendingUp, Bell, Star, Calendar, ArrowUpRight } from 'lucide-react'

export default function MockDashboard() {
  const [stats] = useState({
    totalBooks: 24,
    activeSwaps: 5,
    completedSwaps: 12,
    communityMembers: 247,
    averageRating: 4.6,
    booksThisMonth: 3
  })

  const recentActivity = [
    { action: 'Book swap completed', book: 'The Great Gatsby', time: '2 hours ago', type: 'success' },
    { action: 'New swap request', book: '1984', time: '5 hours ago', type: 'info' },
    { action: 'Book added to library', book: 'Pride and Prejudice', time: '1 day ago', type: 'info' },
    { action: 'Swap request approved', book: 'To Kill a Mockingbird', time: '2 days ago', type: 'success' },
    { action: 'Review received', book: 'The Catcher in the Rye', time: '3 days ago', type: 'rating' }
  ]

  const topBooks = [
    { title: 'The Great Gatsby', author: 'F. Scott Fitzgerald', swaps: 12, rating: 4.8 },
    { title: '1984', author: 'George Orwell', swaps: 10, rating: 4.7 },
    { title: 'Pride and Prejudice', author: 'Jane Austen', swaps: 8, rating: 4.9 },
    { title: 'To Kill a Mockingbird', author: 'Harper Lee', swaps: 7, rating: 4.6 }
  ]

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'success': return <div className="w-2 h-2 bg-green-500 rounded-full" />
      case 'info': return <div className="w-2 h-2 bg-blue-500 rounded-full" />
      case 'rating': return <div className="w-2 h-2 bg-yellow-500 rounded-full" />
      default: return <div className="w-2 h-2 bg-gray-500 rounded-full" />
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-amber-200 mb-2">Dashboard</h1>
          <p className="text-slate-300">Welcome back to Books & Booze! Here's your reading activity overview.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-amber-500/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Total Books</p>
                <p className="text-3xl font-bold text-amber-200">{stats.totalBooks}</p>
              </div>
              <BookOpen className="w-8 h-8 text-amber-500" />
            </div>
            <div className="flex items-center mt-4 text-sm">
              <ArrowUpRight className="w-4 h-4 text-green-500 mr-1" />
              <span className="text-green-500">+3 this month</span>
            </div>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-amber-500/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Active Swaps</p>
                <p className="text-3xl font-bold text-amber-200">{stats.activeSwaps}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-amber-500" />
            </div>
            <div className="flex items-center mt-4 text-sm">
              <span className="text-slate-400">{stats.completedSwaps} completed</span>
            </div>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-amber-500/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Community</p>
                <p className="text-3xl font-bold text-amber-200">{stats.communityMembers}</p>
              </div>
              <Users className="w-8 h-8 text-amber-500" />
            </div>
            <div className="flex items-center mt-4 text-sm">
              <span className="text-slate-400">Active members</span>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Recent Activity */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-amber-500/20">
            <div className="flex items-center gap-2 mb-6">
              <Bell className="w-5 h-5 text-amber-400" />
              <h2 className="text-xl font-semibold text-amber-200">Recent Activity</h2>
            </div>
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-slate-700/30 rounded-lg">
                  {getActivityIcon(activity.type)}
                  <div className="flex-1">
                    <p className="text-slate-300 text-sm">{activity.action}</p>
                    <p className="text-amber-200 font-medium">{activity.book}</p>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Calendar className="w-3 h-3" />
                    {activity.time}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Books */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-amber-500/20">
            <h2 className="text-xl font-semibold text-amber-200 mb-6">Popular Books</h2>
            <div className="space-y-4">
              {topBooks.map((book, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-slate-700/30 rounded-lg">
                  <div className="w-8 h-8 bg-amber-500/20 rounded-lg flex items-center justify-center">
                    <BookOpen className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-amber-200 font-medium">{book.title}</p>
                    <p className="text-slate-400 text-sm">by {book.author}</p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-yellow-400 text-sm">
                      <Star className="w-3 h-3 fill-current" />
                      {book.rating}
                    </div>
                    <p className="text-slate-500 text-xs">{book.swaps} swaps</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 bg-gradient-to-r from-amber-500/20 to-orange-500/20 backdrop-blur-sm rounded-xl p-6 border border-amber-500/30">
          <h2 className="text-xl font-semibold text-amber-200 mb-4">Quick Actions</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <button className="bg-amber-500 text-slate-900 font-semibold py-3 px-6 rounded-lg hover:bg-amber-600 transition-colors">
              Add New Book
            </button>
            <button className="bg-slate-700 text-slate-200 font-semibold py-3 px-6 rounded-lg hover:bg-slate-600 transition-colors">
              Browse Library
            </button>
            <button className="bg-slate-700 text-slate-200 font-semibold py-3 px-6 rounded-lg hover:bg-slate-600 transition-colors">
              View Swap History
            </button>
          </div>
        </div>

        {/* Reading Progress */}
        <div className="mt-8 bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-amber-500/20">
          <h2 className="text-xl font-semibold text-amber-200 mb-4">Your Reading Stats</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-slate-300">Books Read This Year</span>
                <span className="text-amber-200 font-bold">24 / 30</span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2">
                <div className="bg-amber-500 h-2 rounded-full" style={{ width: '80%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-slate-300">Average Rating Given</span>
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-400 fill-current" />
                  <span className="text-amber-200 font-bold">{stats.averageRating}</span>
                </div>
              </div>
              <div className="text-slate-400 text-sm">Based on 45 reviews</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}