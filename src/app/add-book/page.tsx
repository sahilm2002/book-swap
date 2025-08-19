import AddBookForm from '@/components/books/AddBookForm'

export default function AddBookPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Share a Book</h1>
          <p className="text-gray-600 mt-2">
            Add a book to your collection and make it available for swapping
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="container mx-auto px-4 py-8">
        <AddBookForm />
      </div>
    </div>
  )
}
