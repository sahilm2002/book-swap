import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Keep session alive for 15 minutes without activity
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    // Session timeout: 15 minutes (900 seconds)
    flowType: 'pkce',
    // Note: Inactivity timeouts are handled by the session manager, not the Supabase client
  },
  global: {
    headers: {
      'X-Client-Info': 'book-swap-web'
    }
  }
})
