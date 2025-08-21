'use client'

import Link from 'next/link'
import { BookOpen, Users, Globe, Calendar, MapPin, Library } from 'lucide-react'

export default function LiterarySocietyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900">Literary Societies</h1>
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
            <div className="w-24 h-24 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Library className="w-12 h-12 text-purple-600" />
            </div>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              A Journey Through Literary History
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Explore the fascinating world of historical literary societies and discover 
              how book lovers have been gathering and sharing knowledge for centuries.
            </p>
          </div>

          {/* Introduction */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-8">
            <h3 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center gap-3">
              <BookOpen className="w-6 h-6 text-blue-600" />
              The Legacy of Literary Societies
            </h3>
            <p className="text-lg text-gray-700 mb-4">
              Literary societies have been the cornerstone of intellectual discourse and 
              cultural exchange for hundreds of years. These organizations brought together 
              people from all walks of life who shared a common passion for literature, 
              philosophy, and the exchange of ideas.
            </p>
            <p className="text-lg text-gray-700">
              From the coffeehouses of 18th-century London to the reading rooms of 
              colonial America, literary societies created spaces where knowledge could 
              flow freely and books could find new readers eager to explore their contents.
            </p>
          </div>

          {/* Three Most Famous Literary Societies */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-8">
            <h3 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center gap-3">
              <Globe className="w-6 h-6 text-green-600" />
              Three Most Famous Literary Societies
            </h3>
            
            <div className="space-y-8">
              {/* Society 1 */}
              <div className="border-l-4 border-blue-500 pl-6">
                <h4 className="text-xl font-semibold text-gray-900 mb-2">
                  The Literary Club (London, 1764)
                </h4>
                <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    <span>London, England</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>1764-1844</span>
                  </div>
                </div>
                <p className="text-gray-700 mb-3">
                  Founded by Samuel Johnson and Joshua Reynolds, The Literary Club was one 
                  of the most prestigious intellectual gatherings of the 18th century. 
                  Members included luminaries such as Edmund Burke, Oliver Goldsmith, 
                  and James Boswell.
                </p>
                <p className="text-gray-700">
                  The club met weekly at the Turk's Head Tavern in Soho, where members 
                  would discuss literature, politics, and philosophy over dinner. While 
                  not primarily focused on book swapping, the club's influence on literary 
                  culture was profound, and members often shared and recommended books 
                  to one another.
                </p>
              </div>

              {/* Society 2 */}
              <div className="border-l-4 border-green-500 pl-6">
                <h4 className="text-xl font-semibold text-gray-900 mb-2">
                  The Saturday Club (Boston, 1855)
                </h4>
                <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    <span>Boston, Massachusetts</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>1855-1950s</span>
                  </div>
                </div>
                <p className="text-gray-700 mb-3">
                  Founded by Ralph Waldo Emerson and other prominent New England intellectuals, 
                  The Saturday Club was a monthly gathering of writers, scientists, and 
                  thinkers. Members included Henry Wadsworth Longfellow, Nathaniel Hawthorne, 
                  and Oliver Wendell Holmes.
                </p>
                <p className="text-gray-700">
                  The club met at the Parker House Hotel, where members would read their 
                  latest works, discuss current literature, and engage in intellectual 
                  debate. The Saturday Club played a crucial role in establishing 
                  Boston as America's literary capital in the 19th century.
                </p>
              </div>

              {/* Society 3 */}
              <div className="border-l-4 border-purple-500 pl-6">
                <h4 className="text-xl font-semibold text-gray-900 mb-2">
                  The Bloomsbury Group (London, 1905)
                </h4>
                <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    <span>London, England</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>1905-1940s</span>
                  </div>
                </div>
                <p className="text-gray-700 mb-3">
                  While not a formal society, the Bloomsbury Group was an influential 
                  collective of writers, intellectuals, and artists who lived and worked 
                  in the Bloomsbury area of London. Key members included Virginia Woolf, 
                  E.M. Forster, and John Maynard Keynes.
                </p>
                <p className="text-gray-700">
                  The group met regularly at various members' homes, particularly at 
                  the Woolfs' house in Gordon Square. They shared books, manuscripts, 
                  and ideas, creating a vibrant intellectual community that influenced 
                  modernist literature and thought.
                </p>
              </div>
            </div>
          </div>

          {/* Book Swapping Societies */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-8">
            <h3 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center gap-3">
              <Users className="w-6 h-6 text-orange-600" />
              Literary Societies with Book Swapping
            </h3>
            <p className="text-lg text-gray-700 mb-6">
              While many literary societies focused on discussion and intellectual 
              exchange, some specifically facilitated the sharing and swapping of books 
              among members. Here are three notable examples:
            </p>
            
            <div className="space-y-8">
              {/* Swapping Society 1 */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h4 className="text-xl font-semibold text-blue-900 mb-3">
                  The Philadelphia Library Company (1731)
                </h4>
                <div className="flex items-center gap-4 text-sm text-blue-700 mb-3">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    <span>Philadelphia, Pennsylvania</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>1731-Present</span>
                  </div>
                </div>
                <p className="text-blue-800 mb-3">
                  Founded by Benjamin Franklin, the Philadelphia Library Company was 
                  America's first successful lending library. Members paid an annual 
                  subscription fee and could borrow books from the collection.
                </p>
                <p className="text-blue-800">
                  <strong>Book Sharing Practices:</strong> Members were encouraged to 
                  donate books to the collection and could request specific titles. 
                  The library maintained a catalog of all available books, and members 
                  would often discuss and recommend books to one another during their visits.
                </p>
              </div>

              {/* Swapping Society 2 */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <h4 className="text-xl font-semibold text-green-900 mb-3">
                  The Boston Athenæum (1807)
                </h4>
                <div className="flex items-center gap-4 text-sm text-green-700 mb-3">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    <span>Boston, Massachusetts</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>1807-Present</span>
                  </div>
                </div>
                <p className="text-green-800 mb-3">
                  Founded as a private library and cultural institution, the Boston 
                  Athenæum was one of the most important literary societies in early 
                  America. It served as both a library and a meeting place for intellectuals.
                </p>
                <p className="text-green-800">
                  <strong>Book Sharing Practices:</strong> Members could borrow books 
                  from the extensive collection and were encouraged to contribute their 
                  own books to the library. The Athenæum also hosted regular literary 
                  discussions where members would share their thoughts on recently read books.
                </p>
              </div>

              {/* Swapping Society 3 */}
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
                <h4 className="text-xl font-semibold text-purple-900 mb-3">
                  The London Library (1841)
                </h4>
                <div className="flex items-center gap-4 text-sm text-purple-700 mb-3">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    <span>London, England</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>1841-Present</span>
                  </div>
                </div>
                <p className="text-purple-800 mb-3">
                  Founded by Thomas Carlyle, the London Library was established to provide 
                  a comprehensive collection of books for serious readers and researchers. 
                  It became a hub for London's intellectual community.
                </p>
                <p className="text-purple-800">
                  <strong>Book Sharing Practices:</strong> Members could borrow books 
                  for extended periods and were encouraged to suggest new acquisitions. 
                  The library maintained reading rooms where members could meet to discuss 
                  books and exchange recommendations. Many members would leave notes 
                  in books they returned, sharing their thoughts with future readers.
                </p>
              </div>
            </div>
          </div>

          {/* Modern Connection */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-8">
            <h3 className="text-2xl font-semibold text-gray-900 mb-6">
              Connecting Past to Present
            </h3>
            <p className="text-lg text-gray-700 mb-4">
              These historical literary societies laid the foundation for modern book 
              sharing practices. While they may not have used the term "book swapping" 
              in the way we do today, they created the cultural and intellectual framework 
              that makes platforms like BookSwap possible.
            </p>
            <p className="text-lg text-gray-700 mb-4">
              The core principles remain the same: bringing together people who love 
              books, facilitating the exchange of knowledge and stories, and building 
              communities around shared literary interests.
            </p>
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6">
              <h4 className="text-lg font-semibold text-blue-900 mb-3">
                🚀 BookSwap: Continuing the Legacy
              </h4>
              <p className="text-blue-800">
                Today, BookSwap carries forward this rich tradition of literary exchange. 
                We use modern technology to connect book lovers across the globe, but 
                our mission remains the same: to spread the love of books and build 
                meaningful connections through the sharing of stories.
              </p>
            </div>
          </div>

          {/* Call to Action */}
          <div className="text-center bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-8 border border-purple-200">
            <h3 className="text-2xl font-semibold text-gray-900 mb-4">
              Join the Literary Tradition
            </h3>
            <p className="text-lg text-gray-600 mb-6">
              Become part of a community that continues the centuries-old tradition 
              of sharing knowledge and building connections through books.
            </p>
            <div className="flex gap-4 justify-center">
              <Link href="/auth/signup" className="btn-primary">
                Start Swapping
              </Link>
              <Link href="/about" className="btn-secondary">
                Learn More
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
