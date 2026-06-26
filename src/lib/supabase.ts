import { createClient } from '@supabase/supabase-js'

// Singleton — satu instance dipakai seluruh aplikasi (server-side)
// Tidak perlu buat ulang setiap request
let supabaseInstance: ReturnType<typeof createClient> | null = null

export function getSupabase() {
  if (!supabaseInstance) {
    supabaseInstance = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }
  return supabaseInstance
}

// Named export agar tetap kompatibel dengan destructuring lama
export const supabase = getSupabase()
