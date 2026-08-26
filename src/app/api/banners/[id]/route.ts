import { NextRequest, NextResponse } from 'next/server'
import { getAdminSupabase } from '@/lib/supabase'

export const runtime = 'nodejs'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase: any = getAdminSupabase()

    const { data, error } = await supabase
      .from('banners')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error('Error fetching banner:', error)
    return NextResponse.json({ error: error.message || 'Banner tidak ditemukan' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const supabase: any = getAdminSupabase()

    const updatePayload: Record<string, any> = {
      updated_at: new Date().toISOString()
    }

    if (body.title !== undefined) updatePayload.title = body.title.trim()
    if (body.description !== undefined) updatePayload.description = body.description?.trim() || null
    if (body.image !== undefined) updatePayload.image = body.image.trim()
    if (body.link !== undefined) updatePayload.link = body.link?.trim() || null
    if (body.is_active !== undefined) updatePayload.is_active = Boolean(body.is_active)
    if (body.start_date !== undefined) updatePayload.start_date = body.start_date || null
    if (body.end_date !== undefined) updatePayload.end_date = body.end_date || null
    if (body.target_pages !== undefined) updatePayload.target_pages = body.target_pages

    const { data, error } = await supabase
      .from('banners')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error('Error updating banner:', error)
    return NextResponse.json({ error: error.message || 'Gagal memperbarui banner' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase: any = getAdminSupabase()

    const { error } = await supabase
      .from('banners')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true, message: 'Banner berhasil dihapus' })
  } catch (error: any) {
    console.error('Error deleting banner:', error)
    return NextResponse.json({ error: error.message || 'Gagal menghapus banner' }, { status: 500 })
  }
}
