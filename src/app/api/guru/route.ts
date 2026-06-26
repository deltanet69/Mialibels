import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')

    let query = supabase
      .from('staffs')
      .select('*')
      .order('created_at', { ascending: false })

    if (search) {
      query = query.or(`name.ilike.%${search}%,position.ilike.%${search}%`)
    }

    const { data, error } = await query

    if (error) throw error

    const res = NextResponse.json({ success: true, data })
    res.headers.set('Cache-Control', 'private, max-age=10, stale-while-revalidate=30')
    return res
  } catch (error: any) {
    console.error('Error fetching guru:', error)
    return NextResponse.json({ error: error.message || 'Server Error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const { data: guru, error } = await supabase
      .from('staffs')
      .insert([body])
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, data: guru })
  } catch (error: any) {
    console.error('Error creating guru:', error)
    return NextResponse.json({ error: error.message || 'Server Error' }, { status: 500 })
  }
}
