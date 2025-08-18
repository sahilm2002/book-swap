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
  ownerId: string
  location: string
  availableForSwap: boolean
  createdAt: Date
  updatedAt: Date
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

export enum BookCondition {
  NEW = 'new',
  LIKE_NEW = 'like_new',
  VERY_GOOD = 'very_good',
  GOOD = 'good',
  ACCEPTABLE = 'acceptable',
  POOR = 'poor'
}

export enum SwapStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
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
