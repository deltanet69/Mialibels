// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { getAdminSupabase } from '@/lib/supabase'
import { getSession } from '@/lib/session'
import { canAccessSpmb, canManageSpmb } from '@/lib/rbac'
import { sendSpmbApprovalEmail, sendSpmbRejectionEmail } from '@/lib/spmb-email'
import { parseRegistration, isFulldayRow } from '@/lib/spmb-registration'

export const dynamic = 'force-dynamic'

// GET: List all PPDB applicants
export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || !canAccessSpmb(session.role)) {
      return NextResponse.json({ error: 'Akses ditolak. Anda tidak memiliki izin untuk melihat data SPMB.' }, { status: 403 })
    }
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
    const session = await getSession()
    if (!session || !canManageSpmb(session.role)) {
      return NextResponse.json({ error: 'Akses ditolak. Anda tidak memiliki izin untuk mengubah data SPMB.' }, { status: 403 })
    }

    const body = await request.json()
    const {
      id,
      status,
      assigned_batch,
      payment_status,
      admin_notes,
      edit // data form lengkap (sama dengan form pendaftaran) untuk mengubah isi pendaftaran
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

    if (edit) {
      const parsed = parseRegistration(edit)
      if ('error' in parsed) {
        return NextResponse.json({ error: parsed.error }, { status: 400 })
      }
      const { data: current } = await supabase.from('ppdb_registrations').select('id, academic_year, student_nickname, special_needs').eq('id', id).single()
      if (!current) {
        return NextResponse.json({ error: 'Data pendaftar tidak ditemukan.' }, { status: 404 })
      }
      // Pindah program kelas: kuota program tujuan (75) tidak boleh terlampaui.
      if (parsed.isFullday !== isFulldayRow(current)) {
        const { data: regs } = await supabase.from('ppdb_registrations').select('id, student_nickname, special_needs').eq('academic_year', current.academic_year)
        const inTarget = (regs || []).filter((r: any) => r.id !== id && isFulldayRow(r) === parsed.isFullday).length
        if (inTarget >= 75) {
          return NextResponse.json({ error: `Kuota Program Kelas ${parsed.isFullday ? 'Fullday' : 'Regular'} (Maksimal 75 Siswa) telah terpenuhi.` }, { status: 400 })
        }
      }
      Object.assign(updatePayload, parsed.fields)
    }

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

    // Send status notification emails (Approval or Rejection)
    // Email selalu dikirim lebih dulu; WhatsApp bersifat best-effort —
    // kegagalan WA (nomor salah / sesi terputus) tidak menggagalkan email.
    // Hasil kedua jalur dilaporkan ke admin lewat field `notification`.
    let notification: any = undefined
    if (status === 'approved' || status === 'documents_verified') {
      try {
        const r: any = await sendSpmbApprovalEmail({ registration: updated })
        notification = {
          email: r?.success ? 'terkirim' : 'gagal',
          whatsapp: r?.waSent ? 'terkirim' : 'gagal',
          detail: r?.waError || r?.error || null
        }
      } catch (mailErr: any) {
        console.error('[SPMB Admin] Failed to send approval email:', mailErr)
        notification = { email: 'gagal', whatsapp: 'gagal', detail: mailErr?.message || 'Gagal mengirim notifikasi' }
      }
    } else if (status === 'rejected') {
      try {
        const r: any = await sendSpmbRejectionEmail({ registration: updated, adminNotes: admin_notes })
        notification = {
          email: r?.success ? 'terkirim' : 'gagal',
          whatsapp: r?.waSent ? 'terkirim' : 'gagal',
          detail: r?.waError || r?.error || null
        }
      } catch (mailErr: any) {
        console.error('[SPMB Admin] Failed to send rejection email:', mailErr)
        notification = { email: 'gagal', whatsapp: 'gagal', detail: mailErr?.message || 'Gagal mengirim notifikasi' }
      }
    }

    return NextResponse.json({
      success: true,
      message: edit ? 'Data pendaftar berhasil diperbarui.' : 'Status pendaftar berhasil diperbarui.',
      data: updated,
      notification
    })
  } catch (error: any) {
    console.error('Admin PPDB Update Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE: Delete single applicant
export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || !canManageSpmb(session.role)) {
      return NextResponse.json({ error: 'Akses ditolak. Anda tidak memiliki izin untuk menghapus data SPMB.' }, { status: 403 })
    }

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
