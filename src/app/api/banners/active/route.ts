import { NextRequest, NextResponse } from 'next/server'
import { getAdminSupabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const currentPath = searchParams.get('path') || '/'

    const supabase: any = getAdminSupabase()
    const now = new Date().toISOString()

    // Fetch all active banners
    const { data, error } = await supabase
      .from('banners')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (error) throw error

    // Filter date validity in server memory
    const activeBanners = (data || []).filter((banner: any) => {
      // Check start date
      if (banner.start_date && new Date(banner.start_date) > new Date(now)) {
        return false
      }
      // Check end date
      if (banner.end_date) {
        const endDateObj = new Date(banner.end_date)
        // If end_date is just YYYY-MM-DD or time, make sure full day is included if at 00:00
        if (endDateObj < new Date(now)) {
          return false
        }
      }

      // Check target page filter
      const target = banner.target_pages || 'all'
      if (target === 'all') return true
      if (target === 'home') {
        return currentPath === '/' || currentPath === ''
      }

      // If target_pages is json array or comma separated
      try {
        if (target.startsWith('[') && target.endsWith(']')) {
          const parsed = JSON.parse(target)
          if (Array.isArray(parsed)) {
            return parsed.includes(currentPath) || (parsed.includes('home') && (currentPath === '/' || currentPath === ''))
          }
        }
      } catch (e) {
        // Not JSON
      }

      const paths = target.split(',').map((p: string) => p.trim())
      return paths.includes(currentPath) || (paths.includes('home') && (currentPath === '/' || currentPath === ''))
    })

    return NextResponse.json({ success: true, data: activeBanners })
  } catch (error: any) {
    console.error('Error fetching active banners:', error)
    return NextResponse.json({ error: error.message || 'Gagal mengambil banner aktif' }, { status: 500 })
  }
}
