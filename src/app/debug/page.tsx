'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function DebugPage() {
  const [results, setResults] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  const addLog = (message: string) => {
    setResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  const testAuth = async () => {
    setLoading(true)
    addLog('Testing authentication...')
    
    try {
      const { data: { user }, error } = await supabase.auth.getUser()
      
      if (error) {
        addLog(`❌ Auth error: ${error.message}`)
      } else if (user) {
        addLog(`✅ User authenticated: ${user.id}`)
        addLog(`📧 Email: ${user.email}`)
      } else {
        addLog('❌ No user found')
      }
    } catch (error: any) {
      addLog(`❌ Exception: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const testDatabase = async () => {
    setLoading(true)
    addLog('Testing database connection...')
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        addLog('❌ No user to test with')
        setLoading(false)
        return
      }

      // Test reading from users table
      addLog('Testing users table read...')
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()
      
      if (userError) {
        addLog(`❌ Users table error: ${userError.message}`)
        if (userError.details) addLog(`Details: ${userError.details}`)
        if (userError.hint) addLog(`Hint: ${userError.hint}`)
      } else {
        addLog(`✅ Users table read successful`)
        addLog(`📊 User data: ${JSON.stringify(userData, null, 2)}`)
      }

      // Test reading from books table
      addLog('Testing books table read...')
      const { data: booksData, error: booksError } = await supabase
        .from('books')
        .select('*')
        .limit(1)
      
      if (booksError) {
        addLog(`❌ Books table error: ${booksError.message}`)
        if (booksError.details) addLog(`Details: ${booksError.details}`)
        if (booksError.hint) addLog(`Hint: ${booksError.hint}`)
      } else {
        addLog(`✅ Books table read successful`)
        addLog(`📚 Books count: ${booksData?.length || 0}`)
      }

    } catch (error: any) {
      addLog(`❌ Database test exception: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const testBookInsert = async () => {
    setLoading(true)
    addLog('Testing book insert...')
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        addLog('❌ No user to test with')
        setLoading(false)
        return
      }

      const testBook = {
        title: 'Test Book',
        author: 'Test Author',
        genre: ['Fiction'],
        condition: 'good',
        owner_id: user.id,
        location: 'Test City, Test State 12345',
        available_for_swap: true,
        language: 'English'
      }

      addLog(`📖 Inserting test book: ${JSON.stringify(testBook, null, 2)}`)
      
      const { data, error } = await supabase
        .from('books')
        .insert([testBook])
        .select()

      if (error) {
        addLog(`❌ Book insert error: ${error.message}`)
        if (error.details) addLog(`Details: ${error.details}`)
        if (error.hint) addLog(`Hint: ${error.hint}`)
      } else {
        addLog(`✅ Book insert successful`)
        addLog(`📊 Inserted data: ${JSON.stringify(data, null, 2)}`)
      }

    } catch (error: any) {
      addLog(`❌ Book insert exception: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const clearLogs = () => {
    setResults([])
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Database Debug Page</h1>
        
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <button
            onClick={testAuth}
            disabled={loading}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
          >
            Test Authentication
          </button>
          
          <button
            onClick={testDatabase}
            disabled={loading}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50"
          >
            Test Database Connection
          </button>
          
          <button
            onClick={testBookInsert}
            disabled={loading}
            className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 disabled:opacity-50"
          >
            Test Book Insert
          </button>
          
          <button
            onClick={clearLogs}
            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
          >
            Clear Logs
          </button>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Debug Results</h2>
          <div className="bg-gray-100 p-4 rounded font-mono text-sm max-h-96 overflow-y-auto">
            {results.length === 0 ? (
              <p className="text-gray-500">Click a test button to see results...</p>
            ) : (
              results.map((result, index) => (
                <div key={index} className="mb-2">
                  {result}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
