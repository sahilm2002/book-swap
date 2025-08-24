// Book Swap Utility Functions for the BookSwap platform

import { supabase } from './supabase'
import { 
  BookSwap, 
  SwapRequest, 
  SwapApproval, 
  SwapCancellation, 
  SwapCompletion,
  SwapWithBooks,
  SwapHistoryWithBooks,
  SwapStats,
  SwapFilters,
  BookWithSwapInfo
} from '@/types/swap'

// 1. Book Availability Management
export async function toggleBookAvailability(bookId: string, available: boolean): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('books')
      .update({ 
        available_for_swap: available,
        swap_status: available ? 'available' : 'unavailable'
      })
      .eq('id', bookId)

    if (error) throw error

    return { success: true }
  } catch (error) {
    console.error('Error toggling book availability:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

// 2. Get books available for swap (for browsing)
export async function getAvailableBooksForSwap(filters?: { genre?: string; condition?: string; search?: string }): Promise<{ books: BookWithSwapInfo[]; error?: string }> {
  try {
    let query = supabase
      .from('books')
      .select(`
        *,
        users!books_user_id_fkey(full_name, email)
      `)
      .eq('available_for_swap', true)
      .eq('swap_status', 'available')

    if (filters?.genre) {
      query = query.contains('genre', [filters.genre])
    }

    if (filters?.condition) {
      query = query.eq('condition', filters.condition)
    }

    if (filters?.search) {
      query = query.or(`title.ilike.%${filters.search}%,author.ilike.%${filters.search}%`)
    }

    const { data: books, error } = await query.order('created_at', { ascending: false })

    if (error) throw error

    const booksWithOwnerInfo = books?.map(book => ({
      ...book,
      owner_name: book.users?.full_name,
      owner_email: book.users?.email
    })) || []

    return { books: booksWithOwnerInfo }
  } catch (error) {
    console.error('Error fetching available books:', error)
    return { books: [], error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

// 3. Create swap request
export async function createSwapRequest(request: SwapRequest, userId: string): Promise<{ success: boolean; swapId?: string; error?: string }> {
  try {
    console.log('Creating swap request with userId:', userId)
    
    // Debug: Check Supabase client state
    console.log('=== Supabase Client Debug ===')
    console.log('Supabase client exists:', !!supabase)
    console.log('Supabase auth exists:', !!supabase.auth)
    
    // Debug: Check current session with timeout
    console.log('Checking session...')
    const sessionPromise = supabase.auth.getSession()
    const sessionTimeout = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Session check timeout after 5 seconds')), 5000)
    )
    
    let { data: { session }, error: sessionError } = await Promise.race([
      sessionPromise,
      sessionTimeout
    ]) as { data: { session: any }; error: any }
    
    console.log('Current session:', session ? 'Valid' : 'None')
    console.log('Session error:', sessionError)
    console.log('Session user ID:', session?.user?.id)
    console.log('Session expires:', session?.expires_at)
    
    if (!session) {
      throw new Error('No valid session found')
    }
    
    // Debug: Test basic connection
    console.log('Testing basic connection...')
    const { data: testData, error: testError } = await supabase
      .from('book_swaps')
      .select('count')
      .limit(1)
    
    console.log('Connection test result:', testData ? 'Success' : 'Failed')
    console.log('Connection test error:', testError)
    
    // Add timeout to prevent hanging
    const insertPromise = supabase
      .from('book_swaps')
      .insert({
        requester_id: userId,
        book_requested_id: request.book_requested_id,
        book_offered_id: request.book_offered_id,
        status: 'pending'
      })
      .select()
      .single()
    
    const insertTimeout = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Database insert timeout after 10 seconds')), 10000)
    )
    
    const { data: swap, error } = await Promise.race([
      insertPromise,
      insertTimeout
    ]) as { data: any; error: any }

    if (error) throw error

    // Insert swap history for both users
    await supabase
      .from('swap_history')
      .insert([
        {
          swap_id: swap.id,
          user_id: swap.requester_id,
          partner_id: swap.book_owner_id, // changed from swap.book_requested_id to swap.book_owner_id
          action: 'requested',
          timestamp: swap.created_at,
        },
        {
          swap_id: swap.id,
          user_id: swap.book_owner_id,
          partner_id: swap.requester_id, // changed from swap.book_requested_id to swap.requester_id
          action: 'received_request',
          timestamp: swap.created_at,
        }
      ])

    console.log('Swap request created successfully:', swap.id)
    return { success: true, swapId: swap.id }
  } catch (error) {
    console.error('Error creating swap request:', error)
    
    // If it's a timeout error, suggest client refresh
    if (error instanceof Error && error.message?.includes('timeout')) {
      console.warn('⚠️ Supabase client may be stuck. Try refreshing the page or logging out/in.')
    }
    
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

// 4. Get user's swap requests (incoming and outgoing)
export async function getUserSwapRequests(): Promise<{ swaps: SwapWithBooks[]; error?: string }> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { data: swaps, error } = await supabase
      .from('book_swaps')
      .select(`
        *,
        book_requested:books!book_swaps_book_requested_id_fkey(*),
        book_offered:books!book_swaps_book_offered_id_fkey(*),
        requester:users!book_swaps_requester_id_fkey(full_name, email),
        book_owner:users!books_user_id_fkey(full_name, email)
      `)
      .or(`requester_id.eq.${user.id},book_requested.user_id.eq.${user.id}`)
      .order('created_at', { ascending: false })

    if (error) throw error

    const swapsWithBooks = swaps?.map(swap => ({
      ...swap,
      book_requested: {
        ...swap.book_requested,
        owner_name: swap.book_owner?.full_name,
        owner_email: swap.book_owner?.email
      },
      book_offered: {
        ...swap.book_offered,
        owner_name: swap.requester?.full_name,
        owner_email: swap.requester?.email
      },
      requester_name: swap.requester?.full_name,
      requester_email: swap.requester?.email,
      book_owner_name: swap.book_owner?.full_name,
      book_owner_email: swap.book_owner?.email
    })) || []

    return { swaps: swapsWithBooks }
  } catch (error) {
    console.error('Error fetching user swap requests:', error)
    return { swaps: [], error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

// 5. Approve or deny swap request
export async function handleSwapRequest(approval: SwapApproval): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const updateData: any = {
      status: approval.action === 'approve' ? 'approved' : 'denied',
      updated_at: new Date().toISOString()
    }

    if (approval.action === 'approve') {
      updateData.approved_at = new Date().toISOString()
    }

    const { error } = await supabase
      .from('book_swaps')
      .update(updateData)
      .eq('id', approval.swap_id)

    if (error) throw error

    return { success: true }
  } catch (error) {
    console.error('Error handling swap request:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

// 6. Cancel swap request
export async function cancelSwapRequest(cancellation: SwapCancellation): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { error } = await supabase
      .from('book_swaps')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        cancel_reason: cancellation.cancel_reason,
        updated_at: new Date().toISOString()
      })
      .eq('id', cancellation.swap_id)

    if (error) throw error

    return { success: true }
  } catch (error) {
    console.error('Error cancelling swap request:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

// 7. Complete swap (both users confirm receipt) - now uses atomic DB function
export async function completeSwap(completion: SwapCompletion): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    // Call atomic PostgreSQL function for swap completion
    const { error } = await supabase.rpc('complete_swap', {
      p_swap_id: completion.swap_id,
      p_user_id: user.id
    })

    if (error) {
      console.error('Error completing swap (RPC):', error)
      return { success: false, error: error.message || 'Failed to complete swap' }
    }

    return { success: true }
  } catch (error) {
    console.error('Error completing swap:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

// 8. Get user's swap history
export async function getUserSwapHistory(filters?: SwapFilters): Promise<{ swaps: SwapHistoryWithBooks[]; error?: string }> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    let query = supabase
      .from('swap_history')
      .select(`
        *,
        book_given:books!swap_history_book_given_id_fkey(*),
        book_received:books!swap_history_book_received_id_fkey(*),
        partner:users!swap_history_partner_id_fkey(full_name, email)
      `)
      .eq('user_id', user.id)

    if (filters?.status) {
      query = query.eq('status', filters.status)
    }

    if (filters?.date_from) {
      query = query.gte('swap_date', filters.date_from)
    }

    if (filters?.date_to) {
      query = query.lte('swap_date', filters.date_to)
    }

    const { data: swaps, error } = await query.order('swap_date', { ascending: false })

    if (error) throw error

    const swapsWithBooks = swaps?.map(swap => ({
      ...swap,
      book_given: swap.book_given,
      book_received: swap.book_received,
      partner_name: swap.partner?.full_name,
      partner_email: swap.partner?.email
    })) || []

    return { swaps: swapsWithBooks }
  } catch (error) {
    console.error('Error fetching swap history:', error)
    return { swaps: [], error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

// 9. Get swap statistics
export async function getSwapStats(): Promise<{ stats: SwapStats; error?: string }> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    // Get total swaps
    const { count: totalSwaps } = await supabase
      .from('book_swaps')
      .select('*', { count: 'exact', head: true })
      .or(`requester_id.eq.${user.id},book_requested.user_id.eq.${user.id}`)

    // Get completed swaps
    const { count: completedSwaps } = await supabase
      .from('swap_history')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('status', 'completed')

    // Get pending requests
    const { count: pendingRequests } = await supabase
      .from('book_swaps')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending')
      .or(`requester_id.eq.${user.id},book_requested.user_id.eq.${user.id}`)

    // Get active swaps (approved but not completed)
    const { count: activeSwaps } = await supabase
      .from('book_swaps')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'approved')
      .or(`requester_id.eq.${user.id},book_requested.user_id.eq.${user.id}`)

    // Get cancelled swaps
    const { count: cancelledSwaps } = await supabase
      .from('book_swaps')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'cancelled')
      .or(`requester_id.eq.${user.id},book_requested.user_id.eq.${user.id}`)

    const stats: SwapStats = {
      total_swaps: totalSwaps || 0,
      completed_swaps: completedSwaps || 0,
      pending_requests: pendingRequests || 0,
      active_swaps: activeSwaps || 0,
      cancelled_swaps: cancelledSwaps || 0
    }

    return { stats }
  } catch (error) {
    console.error('Error fetching swap stats:', error)
    return { 
      stats: { total_swaps: 0, completed_swaps: 0, pending_requests: 0, active_swaps: 0, cancelled_swaps: 0 },
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

// 10. Get user's notifications
export async function getUserNotifications(): Promise<{ notifications: any[]; error?: string }> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { data: notifications, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) throw error

    return { notifications: notifications || [] }
  } catch (error) {
    console.error('Error fetching notifications:', error)
    return { notifications: [], error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

// 11. Mark notification as read
export async function markNotificationAsRead(notificationId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('id', notificationId)

    if (error) throw error

    return { success: true }
  } catch (error) {
    console.error('Error marking notification as read:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}
