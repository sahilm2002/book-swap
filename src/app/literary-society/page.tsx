export default function LiterarySocietyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <div className="glass-effect border-b border-amber-500/20">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-4xl font-bold gradient-text">Literary Society</h1>
          <p className="text-slate-300 mt-3 text-lg">
            Join our exclusive community of bibliophiles who appreciate both fine literature and craft cocktails
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="card mb-8">
            <h2 className="text-2xl font-bold text-amber-200 mb-4">Welcome to Our Literary Society</h2>
            <p className="text-slate-300 mb-4">
              Our Literary Society is more than just a book club—it's a sophisticated gathering of readers who appreciate 
              the finer things in life. Here, literature meets libations, and every book discussion is enhanced by 
              carefully curated cocktail pairings.
            </p>
            <p className="text-slate-300">
              Whether you're a fan of classic literature, contemporary fiction, or niche genres, you'll find 
              like-minded enthusiasts who share your passion for quality reading and refined taste.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="card">
              <h3 className="text-xl font-bold text-amber-200 mb-3">Monthly Book Discussions</h3>
              <p className="text-slate-300 mb-4">
                Join our monthly virtual and in-person book discussions, where we explore themes, 
                analyze characters, and share insights over carefully selected beverages.
              </p>
              <div className="text-amber-400 text-sm">Coming Soon: Virtual Discussion Groups</div>
            </div>

            <div className="card">
              <h3 className="text-xl font-bold text-amber-200 mb-3">Cocktail Pairing Events</h3>
              <p className="text-slate-300 mb-4">
                Experience our signature cocktail pairing events, where expert mixologists create 
                drinks that perfectly complement each month's featured literature.
              </p>
              <div className="text-amber-400 text-sm">Coming Soon: Mixology Workshops</div>
            </div>
          </div>

          <div className="card mt-8">
            <h3 className="text-xl font-bold text-amber-200 mb-3">Get Involved</h3>
            <p className="text-slate-300 mb-4">
              The Literary Society is currently in development. We're building an exclusive community 
              where book lovers can connect, share recommendations, and participate in sophisticated 
              literary events.
            </p>
            <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 rounded-lg p-4 border border-amber-500/30">
              <p className="text-amber-200 font-medium">
                🚧 Under Construction - Coming Soon! 🚧
              </p>
              <p className="text-slate-300 text-sm mt-2">
                We're crafting the perfect literary society experience. Stay tuned for updates on 
                discussion groups, events, and exclusive member benefits.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
