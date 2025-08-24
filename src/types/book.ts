export interface Book {
  id: string
  title: string
  author: string
  isbn?: string
  genre: string[]
  description?: string
  coverImage?: string
  publishedYear?: number
  pageCount?: number
  language: string
  condition: BookCondition
  ownerId: string // Database field name
  location: string
  availableForSwap: boolean
  swapStatus: SwapStatus // use camelCase and enum
  swap_status?: SwapStatus // optional snake_case for DB compatibility
  createdAt?: string // camelCase alias
  updatedAt?: string // camelCase alias
  created_at?: string // optional snake_case for DB compatibility
  updated_at?: string // optional snake_case for DB compatibility
  swapRequests?: Array<{
    id: string
    // Accept both DB and domain shapes; normalize at boundaries.
    requester_id?: string
    requesterId?: string
    status: SwapStatus // narrow to enum
    createdAt?: string
    updatedAt?: string
    created_at?: string
    updated_at?: string
  }>
  // Owner information
  ownerUsername?: string
  ownerEmail?: string
}

export interface User {
  id: string
  email: string
  username: string
  fullName: string
  avatar?: string
  bio?: string
  location: string
  preferences: UserPreferences
  rating: number
  totalSwaps: number
  createdAt: Date
  updatedAt: Date
}

export interface UserPreferences {
  favoriteGenres: string[]
  preferredLanguages: string[]
  maxDistance: number // in kilometers
  notifications: NotificationSettings
}

export interface NotificationSettings {
  email: boolean
  push: boolean
  newBooks: boolean
  swapRequests: boolean
  messages: boolean
}

export interface SwapRequest {
  id: string
  requesterId: string
  bookId: string
  status: SwapStatus
  message?: string
  createdAt: Date
  updatedAt: Date
}

export interface Message {
  id: string
  senderId: string
  receiverId: string
  swapRequestId?: string
  content: string
  read: boolean
  createdAt: Date
}

export interface Review {
  id: string
  reviewerId: string
  reviewedUserId: string
  swapId: string
  rating: number
  comment?: string
  createdAt: Date
}

export interface BookReview {
  id?: string
  bookId: string
  userId?: string
  rating: number
  review: string
  createdAt?: Date
  updatedAt?: Date
}

export enum BookCondition {
  NEW = 'new',
  LIKE_NEW = 'like_new',
  VERY_GOOD = 'very_good',
  GOOD = 'good',
  ACCEPTABLE = 'acceptable',
  POOR = 'poor'
}

export enum SwapStatus {
  Available = 'available',
  Pending = 'pending',
  Swapped = 'swapped',
  Unavailable = 'unavailable',
  Approved = 'approved',
  Denied = 'denied',
  Cancelled = 'cancelled',
  Completed = 'completed'
}

export interface SearchFilters {
  query?: string
  genre?: string[]
  author?: string
  location?: string
  maxDistance?: number
  condition?: BookCondition[]
  availableOnly?: boolean
  language?: string[]
}

export interface PaginationParams {
  page: number
  limit: number
  total?: number
}

export interface ApiResponse<T> {
  data: T
  message?: string
  error?: string
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: PaginationParams
}
