import { createClient } from '@supabase/supabase-js'

// Service role client — bypasses RLS entirely.
// NEVER import this in browser-side code.
export const serviceSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
