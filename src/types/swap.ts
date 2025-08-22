// Book Swap Types for the BookSwap platform

export interface BookSwap {
  id: string
  requester_id: string
  book_requested_id: string
  book_offered_id: string
  status: SwapStatus
  created_at: string
  updated_at: string
  cancelled_at?: string
  cancel_reason?: string
  approved_at?: string
  completed_at?: string
}

export interface SwapHistory {
  id: string
  swap_id: string
  user_id: string
  partner_id: string
  book_given_id: string
  book_received_id: string
  swap_date: string
  status: 'completed' | 'cancelled'
  created_at: string
}

export interface Notification {
  id: string
  user_id: string
  type: NotificationType
  title: string
  message: string
  related_swap_id?: string
  read_at?: string
  created_at: string
}

export type SwapStatus = 'pending' | 'approved' | 'denied' | 'cancelled' | 'completed'

export type NotificationType = 
  | 'swap_request' 
  | 'swap_approved' 
  | 'swap_denied' 
  | 'swap_cancelled' 
  | 'swap_completed' 
  | 'offer_cancelled'

export interface SwapRequest {
  book_requested_id: string
  book_offered_id: string
}

export interface SwapApproval {
  swap_id: string
  action: 'approve' | 'deny'
  cancel_reason?: string
}

export interface SwapCancellation {
  swap_id: string
  cancel_reason: string
}

export interface SwapCompletion {
  swap_id: string
}

export interface BookWithSwapInfo {
  id: string
  title: string
  author: string
  genre: string[]
  description?: string
  isbn?: string
  language?: string
  published_year?: number
  condition?: string
  available_for_swap: boolean
  swap_status: string
  user_id: string
  owner_name?: string
  owner_email?: string
  created_at: string
  updated_at: string
}

export interface SwapWithBooks {
  id: string
  requester_id: string
  book_requested: BookWithSwapInfo
  book_offered: BookWithSwapInfo
  status: SwapStatus
  created_at: string
  updated_at: string
  cancelled_at?: string
  cancel_reason?: string
  approved_at?: string
  completed_at?: string
  requester_name?: string
  requester_email?: string
  book_owner_name?: string
  book_owner_email?: string
}

export interface SwapHistoryWithBooks {
  id: string
  swap_id: string
  user_id: string
  partner_id: string
  book_given: BookWithSwapInfo
  book_received: BookWithSwapInfo
  swap_date: string
  status: 'completed' | 'cancelled'
  created_at: string
  partner_name?: string
  partner_email?: string
}

export interface SwapStats {
  total_swaps: number
  completed_swaps: number
  pending_requests: number
  active_swaps: number
  cancelled_swaps: number
}

export interface SwapFilters {
  status?: SwapStatus
  date_from?: string
  date_to?: string
  book_title?: string
  partner_name?: string
}
