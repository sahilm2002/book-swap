import AddBookForm from '@/components/books/AddBookForm'

export default function AddBookPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <div className="glass-effect border-b border-amber-500/20">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-4xl font-bold gradient-text">Share a Literary Treasure</h1>
          <p className="text-slate-300 mt-3 text-lg">
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
