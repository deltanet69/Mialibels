import { NextRequest, NextResponse } from 'next/server'
import { getAdminSupabase } from '@/lib/supabase'

const supabase = getAdminSupabase()

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const category = searchParams.get('category')

    let query = supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false })

    if (search) {
      query = query.ilike('title', `%${search}%`)
    }
    
    if (category) {
      query = query.eq('category', category)
    }

    const { data, error } = await query

    if (error) throw error

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error('Error fetching posts:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan internal pada server.' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // generate slug if not provided
    if (!body.slug) {
      body.slug = body.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')
    }

    const { data, error } = await supabase
      .from('posts')
      .insert([body])
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error('Error creating post:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan internal pada server.' }, { status: 500 })
  }
}

