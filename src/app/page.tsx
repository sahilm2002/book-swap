import Link from 'next/link'
import { BookOpen, Users, Heart, Search, Wine, Sparkles, GlassWater } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.03%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%222%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')]"></div>
        </div>
        
        <div className="container mx-auto px-4 py-24 text-center relative z-10">
          {/* Logo/Brand */}
          <div className="mb-8">
            <div className="inline-flex items-center gap-3 bg-gradient-to-r from-amber-400 to-orange-500 text-slate-900 px-6 py-3 rounded-full text-sm font-semibold mb-6">
              <BookOpen className="w-5 h-5" />
              <span>Books & Booze</span>
              <Wine className="w-5 h-5" />
            </div>
          </div>
          
          <h1 className="text-6xl font-bold mb-6 bg-gradient-to-r from-amber-200 via-orange-200 to-amber-200 bg-clip-text text-transparent">
            Where Literature Meets Libations
          </h1>
          <p className="text-xl mb-8 max-w-3xl mx-auto text-slate-300 leading-relaxed">
            A sophisticated community for bibliophiles who appreciate fine literature and craft cocktails. 
            Share your favorite reads while discovering the perfect drink pairings for every genre.
          </p>
          <div className="flex gap-4 justify-center">
            <Link 
              href="/browse" 
              className="btn-primary bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-900 font-semibold px-8 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <BookOpen className="w-5 h-5 mr-2" />
              Browse the Library
            </Link>
            <Link 
              href="/auth/signup" 
              className="btn-secondary bg-transparent border-2 border-amber-400 text-amber-400 hover:bg-amber-400 hover:text-slate-900 font-semibold px-8 py-3 rounded-lg transition-all duration-300"
            >
              <GlassWater className="w-5 h-5 mr-2" />
              Join the Club
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-gradient-to-b from-slate-900 to-slate-800">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 text-amber-200">
              The Perfect Blend of Culture & Craft
            </h2>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto">
              Experience the art of book swapping in an atmosphere that celebrates both literary excellence and cocktail craftsmanship.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center group">
              <div className="bg-gradient-to-br from-amber-500/20 to-orange-500/20 backdrop-blur-sm w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-amber-500/30 group-hover:border-amber-400/50 transition-all duration-300">
                <BookOpen className="w-10 h-10 text-amber-400" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-amber-200">Curated Collections</h3>
              <p className="text-slate-400 leading-relaxed">
                Discover handpicked books from fellow connoisseurs who share your taste for quality literature.
              </p>
            </div>
            
            <div className="text-center group">
              <div className="bg-gradient-to-br from-amber-500/20 to-orange-500/20 backdrop-blur-sm w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-amber-500/30 group-hover:border-amber-400/50 transition-all duration-300">
                <Users className="w-10 h-10 text-amber-400" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-amber-200">Literary Society</h3>
              <p className="text-slate-400 leading-relaxed">
                Connect with fellow bibliophiles in an exclusive community that values both reading and refined taste.
              </p>
            </div>
            
            <div className="text-center group">
              <div className="bg-gradient-to-br from-amber-500/20 to-orange-500/20 backdrop-blur-sm w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-amber-500/30 group-hover:border-amber-400/50 transition-all duration-300">
                <Heart className="w-10 h-10 text-amber-400" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-amber-200">Elegant Exchange</h3>
              <p className="text-slate-400 leading-relaxed">
                Sophisticated book swapping with trusted members who appreciate the finer things in life.
              </p>
            </div>
            
            <div className="text-center group">
              <div className="bg-gradient-to-br from-amber-500/20 to-orange-500/20 backdrop-blur-sm w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-amber-500/30 group-hover:border-amber-400/50 transition-all duration-300">
                <Search className="w-10 h-10 text-amber-400" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-amber-200">Smart Discovery</h3>
              <p className="text-slate-400 leading-relaxed">
                Find your next great read with intelligent recommendations and curated genre collections.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Cocktail Pairing Section */}
      <section className="py-24 bg-gradient-to-b from-slate-800 to-slate-900">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 text-amber-200">
              Literary Libations
            </h2>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto">
              Every great book deserves the perfect drink companion. Discover curated pairings that enhance your reading experience.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 backdrop-blur-sm rounded-2xl p-8 border border-amber-500/20 hover:border-amber-400/40 transition-all duration-300">
              <div className="text-amber-400 text-4xl mb-4">📚</div>
              <h3 className="text-xl font-semibold mb-3 text-amber-200">Classic Literature</h3>
              <p className="text-slate-400 mb-4">Pair with a sophisticated Old Fashioned or Manhattan</p>
              <div className="text-sm text-amber-500/70">Perfect for: Austen, Dickens, Hemingway</div>
            </div>
            
            <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 backdrop-blur-sm rounded-2xl p-8 border border-amber-500/20 hover:border-amber-400/40 transition-all duration-300">
              <div className="text-amber-400 text-4xl mb-4">🕵️</div>
              <h3 className="text-xl font-semibold mb-3 text-amber-200">Mystery & Thriller</h3>
              <p className="text-slate-400 mb-4">Accompanied by a crisp Gin & Tonic or Negroni</p>
              <div className="text-sm text-amber-500/70">Perfect for: Christie, Chandler, King</div>
            </div>
            
            <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 backdrop-blur-sm rounded-2xl p-8 border border-amber-500/20 hover:border-amber-400/40 transition-all duration-300">
              <div className="text-amber-400 text-4xl mb-4">🌟</div>
              <h3 className="text-xl font-semibold mb-3 text-amber-200">Fantasy & Sci-Fi</h3>
              <p className="text-slate-400 mb-4">Enhanced by a creative craft cocktail or aged whiskey</p>
              <div className="text-sm text-amber-500/70">Perfect for: Tolkien, Asimov, Le Guin</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-b from-slate-900 to-slate-800">
        <div className="container mx-auto px-4 text-center">
          <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 backdrop-blur-sm rounded-3xl p-12 border border-amber-500/30">
            <h2 className="text-4xl font-bold mb-6 text-amber-200">
              Ready to Elevate Your Reading Experience?
            </h2>
            <p className="text-xl mb-8 text-slate-300 max-w-2xl mx-auto">
              Join our exclusive community of literary enthusiasts who appreciate both fine literature and craft cocktails.
            </p>
            <Link 
              href="/auth/signup" 
              className="inline-flex items-center bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-900 font-bold text-lg px-10 py-4 rounded-xl shadow-2xl hover:shadow-amber-500/25 transition-all duration-300"
            >
              <Sparkles className="w-6 h-6 mr-3" />
              Join Books & Booze Today
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-16 border-t border-amber-500/20">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <BookOpen className="w-6 h-6 text-amber-400" />
                <span className="text-xl font-bold text-amber-200">Books & Booze</span>
              </div>
              <p className="text-slate-400 leading-relaxed">
                Where sophisticated readers gather to share literature and celebrate the art of fine drinking.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-amber-200">Platform</h4>
              <ul className="space-y-2 text-slate-400">
                <li><Link href="/browse" className="hover:text-amber-400 transition-colors">Browse Books</Link></li>
                <li><Link href="/literary-society" className="hover:text-amber-400 transition-colors">Literary Society</Link></li>
                <li><Link href="/about" className="hover:text-amber-400 transition-colors">About Us</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-amber-200">Support</h4>
              <ul className="space-y-2 text-slate-400">
                <li><Link href="/help" className="hover:text-amber-400 transition-colors">Help Center</Link></li>
                <li><Link href="/contact" className="hover:text-amber-400 transition-colors">Contact</Link></li>
                <li><Link href="/faq" className="hover:text-amber-400 transition-colors">FAQ</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-amber-200">Legal</h4>
              <ul className="space-y-2 text-slate-400">
                <li><Link href="/privacy" className="hover:text-amber-400 transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-amber-400 transition-colors">Terms of Service</Link></li>
                <li><Link href="/cookies" className="hover:text-amber-400 transition-colors">Cookie Policy</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-amber-500/20 mt-12 pt-8 text-center text-slate-400">
            <p>&copy; 2024 Books & Booze. All rights reserved. | A sophisticated community for literary enthusiasts.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
