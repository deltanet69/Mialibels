import { createClient } from '@supabase/supabase-js'
// @ts-ignore
import ws from 'ws'

// Default timeout untuk query Supabase (8 detik) agar request tidak menggantung di server
const DEFAULT_TIMEOUT_MS = 8000

function createTimeoutFetch() {
  return (url: RequestInfo | URL, options?: RequestInit) => {
    // Jika caller sudah menyertakan signal sendiri, gunakan itu. Jika belum, pasang AbortSignal.timeout
    const signal = options?.signal || AbortSignal.timeout(DEFAULT_TIMEOUT_MS)
    return fetch(url, {
      ...options,
      cache: 'no-store',
      signal,
    })
  }
}

// Helper untuk membungkus promise query dengan timeout eksplisit
export async function withTimeout<T>(
  promise: PromiseLike<T> | Promise<T>,
  ms: number = 6000,
  fallbackMsg: string = 'Koneksi database timeout'
): Promise<T> {
  let timeoutId: NodeJS.Timeout
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(fallbackMsg))
    }, ms)
  })

  try {
    return await Promise.race([Promise.resolve(promise), timeoutPromise])
  } finally {
    // @ts-ignore
    clearTimeout(timeoutId)
  }
}

// Singleton — satu instance dipakai seluruh aplikasi (server-side)
let supabaseInstance: ReturnType<typeof createClient> | null = null
let adminSupabaseInstance: ReturnType<typeof createClient> | null = null

export function getSupabase() {
  if (!supabaseInstance) {
    supabaseInstance = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: { persistSession: false },
        realtime: { transport: ws },
        global: {
          fetch: createTimeoutFetch()
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
        realtime: { transport: ws },
        global: {
          fetch: createTimeoutFetch()
        }
      }
    );
  }
  return adminSupabaseInstance;
}

// Named export agar tetap kompatibel dengan destructuring lama
export const supabase = getAdminSupabase()

