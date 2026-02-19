import { createBrowserClient } from '@supabase/ssr'

// Create a Supabase client for client-side use (uses cookies for session persistence)
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
