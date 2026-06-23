import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  supabaseServiceKey
)

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error('Error fetching post:', error)
    return NextResponse.json({ error: error.message || 'Server Error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json()

    // ensure slug is updated if necessary or handled by user
    if (body.title && !body.slug) {
      body.slug = body.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')
    }
    
    // updated_at can be set automatically or handled by supabase trigger, but let's be explicit
    body.updated_at = new Date().toISOString()

    const { data, error } = await supabase
      .from('posts')
      .update(body)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error('Error updating post:', error)
    return NextResponse.json({ error: error.message || 'Server Error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true, message: 'Post deleted successfully' })
  } catch (error: any) {
    console.error('Error deleting post:', error)
    return NextResponse.json({ error: error.message || 'Server Error' }, { status: 500 })
  }
}
