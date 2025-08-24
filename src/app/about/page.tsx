'use client'

import Link from 'next/link'
import { BookOpen, Heart, Users, Truck } from 'lucide-react'

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900">About BookSwap</h1>
            <Link href="/dashboard" className="btn-secondary">
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <BookOpen className="w-12 h-12 text-blue-600" />
            </div>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Welcome to BookSwap
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              A community-driven platform where book lovers can share their favorite reads 
              and discover new literary treasures through the art of book swapping.
            </p>
          </div>

          {/* What We Do */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-8">
            <h3 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center gap-3">
              <BookOpen className="w-6 h-6 text-blue-600" />
              What We Do
            </h3>
            <p className="text-lg text-gray-700 mb-4">
              BookSwap is a book exchange platform that connects readers who want to share 
              their beloved books with others. Users can add books from their personal 
              collection that they'd like to swap with fellow book enthusiasts.
            </p>
            <p className="text-lg text-gray-700">
              Our mission is to create a community where books can find new homes and 
              readers can discover stories that might otherwise remain hidden.
            </p>
          </div>

          {/* Our Philosophy */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-8">
            <h3 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center gap-3">
              <Heart className="w-6 h-6 text-red-600" />
              Our Philosophy
            </h3>
            <div className="space-y-4">
              <p className="text-lg text-gray-700">
                <strong>Share What You Love:</strong> We encourage users to swap books 
                they have read and genuinely enjoyed. These are the books that have touched 
                your heart, expanded your mind, or provided hours of entertainment.
              </p>
              <p className="text-lg text-gray-700">
                <strong>Quality Over Quantity:</strong> While we understand that not every 
                book will be a favorite, we gently ask that you don't use BookSwap as a 
                way to offload books you didn't enjoy. Instead, focus on sharing the 
                stories that have meant something to you.
              </p>
              <p className="text-lg text-gray-700">
                <strong>Build Meaningful Connections:</strong> Every book swap is an 
                opportunity to connect with someone who shares your literary interests 
                and to introduce them to a story that has been meaningful in your life.
              </p>
            </div>
          </div>

          {/* How It Works */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-8">
            <h3 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center gap-3">
              <Users className="w-6 h-6 text-green-600" />
              How It Works
            </h3>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-blue-600">1</span>
                </div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">Add Your Books</h4>
                <p className="text-gray-600">
                  Browse your bookshelf and add books you'd love to share with others.
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-green-600">2</span>
                </div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">Connect</h4>
                <p className="text-gray-600">
                  Find other readers interested in your books and arrange swaps.
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-purple-600">3</span>
                </div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">Share & Discover</h4>
                <p className="text-gray-600">
                  Send your books and receive new ones to explore and enjoy.
                </p>
              </div>
            </div>
          </div>

          {/* Financial Guidelines */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-8">
            <h3 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center gap-3">
              <Truck className="w-6 h-6 text-orange-600" />
              Financial Guidelines
            </h3>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h4 className="text-lg font-semibold text-blue-900 mb-3">
                💝 Spread the Love of Books
              </h4>
              <p className="text-blue-800 mb-3">
                <strong>No Profit, Just Passion:</strong> BookSwap is built on the principle 
                that sharing knowledge and stories should be accessible to everyone.
              </p>
              <p className="text-blue-800">
                <strong>Cover Shipping Only:</strong> We ask that users cover the shipping 
                costs for their books. This ensures that the platform remains sustainable 
                while keeping book swapping affordable and accessible to all.
              </p>
            </div>
          </div>

          {/* Community Guidelines */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-8">
            <h3 className="text-2xl font-semibold text-gray-900 mb-6">
              Community Guidelines
            </h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                <p className="text-gray-700">
                  <strong>Be Honest:</strong> Accurately describe the condition of your books 
                  and be truthful about your reading experience.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                <p className="text-gray-700">
                  <strong>Communicate Clearly:</strong> Keep in touch with your swap partners 
                  and be responsive to messages.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                <p className="text-gray-700">
                  <strong>Ship Promptly:</strong> Send your books within a reasonable timeframe 
                  and provide tracking information when possible.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                <p className="text-gray-700">
                  <strong>Respect Differences:</strong> Everyone has different tastes in books. 
                  Be respectful of others' preferences and choices.
                </p>
              </div>
            </div>
          </div>

          {/* Call to Action */}
          <div className="text-center bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-8 border border-blue-200">
            <h3 className="text-2xl font-semibold text-gray-900 mb-4">
              Ready to Start Swapping?
            </h3>
            <p className="text-lg text-gray-600 mb-6">
              Join our community of book lovers and start sharing your favorite stories today.
            </p>
            <div className="flex gap-4 justify-center">
              <Link href="/auth/signup" className="btn-primary">
                Get Started
              </Link>
              <Link href="/browse" className="btn-secondary">
                Browse Books
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
