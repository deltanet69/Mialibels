import { createClient } from '@supabase/supabase-js'

// Singleton — satu instance dipakai seluruh aplikasi (server-side)
// Tidak perlu buat ulang setiap request
let supabaseInstance: ReturnType<typeof createClient> | null = null
let adminSupabaseInstance: ReturnType<typeof createClient> | null = null

export function getSupabase() {
  if (!supabaseInstance) {
    supabaseInstance = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          fetch: (url, options) => fetch(url, { ...options, cache: 'no-store' })
        }
      }
    )
  }
  return supabaseInstance
}

export function getAdminSupabase() {
  if (!adminSupabaseInstance) {
    adminSupabaseInstance = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { 
        auth: { persistSession: false },
        global: {
          fetch: (url, options) => fetch(url, { ...options, cache: 'no-store' })
        }
      }
    );
  }
  return adminSupabaseInstance;
}

// Named export agar tetap kompatibel dengan destructuring lama
// MENGGUNAKAN ADMIN SUPABASE AGAR BISA MEMBACA DATA WALAUPUN RLS AKTIF
export const supabase = getAdminSupabase()
