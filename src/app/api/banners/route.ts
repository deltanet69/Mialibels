import { NextRequest, NextResponse } from 'next/server'
import { getAdminSupabase } from '@/lib/supabase'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const status = searchParams.get('status')

    const supabase: any = getAdminSupabase()
    let query = supabase
      .from('banners')
      .select('*')
      .order('created_at', { ascending: false })

    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`)
    }

    if (status === 'active') {
      query = query.eq('is_active', true)
    } else if (status === 'inactive') {
      query = query.eq('is_active', false)
    }

    const { data, error } = await query

    if (error) throw error

    return NextResponse.json({ success: true, data: data || [] })
  } catch (error: any) {
    console.error('Error fetching banners:', error)
    return NextResponse.json({ error: error.message || 'Gagal mengambil data banner' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (!body.title || !body.title.trim()) {
      return NextResponse.json({ error: 'Nama/Judul pengumuman wajib diisi' }, { status: 400 })
    }

    if (!body.image || !body.image.trim()) {
      return NextResponse.json({ error: 'Gambar banner wajib diunggah' }, { status: 400 })
    }

    const supabase: any = getAdminSupabase()
    const payload = {
      title: body.title.trim(),
      description: body.description?.trim() || null,
      image: body.image.trim(),
      link: body.link?.trim() || null,
      is_active: typeof body.is_active === 'boolean' ? body.is_active : true,
      start_date: body.start_date || null,
      end_date: body.end_date || null,
      target_pages: body.target_pages || 'all',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('banners')
      .insert([payload])
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error('Error creating banner:', error)
    return NextResponse.json({ error: error.message || 'Gagal membuat banner' }, { status: 500 })
  }
}
