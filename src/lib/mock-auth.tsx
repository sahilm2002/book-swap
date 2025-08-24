'use client'

import { createContext, useContext, useState, ReactNode } from 'react'

interface MockUser {
  id: string
  email: string
  full_name?: string
}

interface MockAuthContextType {
  user: MockUser | null
  loading: boolean
  signIn: (email: string) => void
  signOut: () => void
}

const MockAuthContext = createContext<MockAuthContextType | undefined>(undefined)

export function MockAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<MockUser | null>({
    id: 'mock-user-1',
    email: 'demo@booksandbooze.com',
    full_name: 'Demo User'
  })
  const [loading] = useState(false)

  const signIn = (email: string) => {
    setUser({
      id: 'mock-user-1',
      email,
      full_name: 'Demo User'
    })
  }

  const signOut = () => {
    setUser(null)
  }

  return (
    <MockAuthContext.Provider value={{ user, loading, signIn, signOut }}>
      {children}
    </MockAuthContext.Provider>
  )
}

export function useMockAuth() {
  const context = useContext(MockAuthContext)
  if (context === undefined) {
    throw new Error('useMockAuth must be used within a MockAuthProvider')
  }
  return context
}