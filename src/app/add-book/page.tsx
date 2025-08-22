import AddBookForm from '@/components/books/AddBookForm'

export default function AddBookPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header */}
      <div className="bg-white border-b border-amber-200 shadow-sm">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-4xl font-bold text-gray-900">Share a Literary Treasure</h1>
          <p className="text-gray-600 mt-3 text-lg">
            Add a book to your collection and make it available for the discerning readers in our literary society
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="container mx-auto px-4 py-12">
        <AddBookForm />
      </div>
    </div>
  )
}
