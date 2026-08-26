import { NextRequest, NextResponse } from 'next/server'
import { getAdminSupabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

// GET: List all PPDB applicants
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const batch = searchParams.get('batch')
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    const sort = searchParams.get('sort') || 'newest'

    const supabase: any = getAdminSupabase()

    let query = supabase
      .from('ppdb_registrations')
      .select('*')

    if (batch && batch !== 'all') {
      query = query.eq('batch', Number(batch))
    }

    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    if (search && search.trim()) {
      const q = search.trim()
      query = query.or(`student_name.ilike.%${q}%,registration_number.ilike.%${q}%,father_name.ilike.%${q}%,father_phone.ilike.%${q}%,mother_name.ilike.%${q}%`)
    }

    if (sort === 'oldest') {
      query = query.order('created_at', { ascending: true })
    } else {
      query = query.order('created_at', { ascending: false })
    }

    const { data: applicants, error } = await query

    if (error) {
      console.error('Error fetching PPDB applicants:', error)
      return NextResponse.json({ error: 'Gagal mengambil data pendaftar: ' + error.message }, { status: 500 })
    }

    // Summary counters
    const all = applicants || []
    const summary = {
      total: all.length,
      pending: all.filter((a: any) => a.status === 'pending_verification').length,
      approved: all.filter((a: any) => a.status === 'approved' || a.status === 'documents_submitted' || a.status === 'documents_verified').length,
      rejected: all.filter((a: any) => a.status === 'rejected').length,
      documents_submitted: all.filter((a: any) => a.status === 'documents_submitted').length,
      batch1: all.filter((a: any) => a.batch === 1).length,
      batch2: all.filter((a: any) => a.batch === 2).length,
      batch3: all.filter((a: any) => a.batch === 3).length,
      totalPaymentAmount: all.filter((a: any) => a.payment_status === 'verified').reduce((acc: number, curr: any) => acc + (Number(curr.payment_amount) || 0), 0)
    }

    return NextResponse.json({
      success: true,
      data: all,
      summary
    })
  } catch (error: any) {
    console.error('Admin PPDB List Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PUT: Update single applicant status / batch / notes / payment verification
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      id,
      status,
      assigned_batch,
      payment_status,
      admin_notes
    } = body

    if (!id) {
      return NextResponse.json({ error: 'ID pendaftar diperlukan.' }, { status: 400 })
    }

    const supabase: any = getAdminSupabase()

    const updatePayload: any = {
      updated_at: new Date().toISOString()
    }

    if (status !== undefined) updatePayload.status = status
    if (assigned_batch !== undefined) updatePayload.assigned_batch = Number(assigned_batch)
    if (payment_status !== undefined) updatePayload.payment_status = payment_status
    if (admin_notes !== undefined) updatePayload.admin_notes = admin_notes

    // Auto-sync payment_status with status
    if (status === 'approved' && !payment_status) {
      updatePayload.payment_status = 'verified'
    }

    const { data: updated, error } = await supabase
      .from('ppdb_registrations')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating PPDB applicant:', error)
      return NextResponse.json({ error: 'Gagal memperbarui status: ' + error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Status pendaftar berhasil diperbarui.',
      data: updated
    })
  } catch (error: any) {
    console.error('Admin PPDB Update Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE: Delete single applicant
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID pendaftar diperlukan.' }, { status: 400 })
    }

    const supabase: any = getAdminSupabase()

    const { error } = await supabase
      .from('ppdb_registrations')
      .delete()
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: 'Gagal menghapus pendaftar: ' + error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Data pendaftar berhasil dihapus.' })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
