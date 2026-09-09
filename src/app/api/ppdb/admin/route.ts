import { NextRequest, NextResponse } from 'next/server'
import { getAdminSupabase } from '@/lib/supabase'
import { getSession } from '@/lib/session'
import { canAccessSpmb, canManageSpmb } from '@/lib/rbac'

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

    // Send approval email via Resend if status is approved
    if (status === 'approved' && updated && updated.father_email) {
      const RESEND_KEY = process.env.RESEND_API_KEY
      if (RESEND_KEY) {
        try {
          const { Resend } = await import('resend')
          const resend = new Resend(RESEND_KEY)
          const senderEmail = 'ppdb@miattaqwa15.sch.id'
          const programLabel = updated.special_needs || (updated.student_nickname === 'fullday' ? 'Kelas Fullday' : 'Kelas Regular')

          const approvalHtml = `
            <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 620px; margin: 0 auto; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 20px; overflow: hidden; color: #1e293b;">
              <div style="background: linear-gradient(135deg, #065f46 0%, #047857 100%); padding: 36px 30px; text-align: center;">
                <span style="display: inline-block; background-color: #d1fae5; color: #065f46; font-size: 11px; font-weight: 800; padding: 4px 14px; border-radius: 999px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px;">PENGUMUMAN KELULUSAN SPMB</span>
                <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">Selamat! Pendaftaran Diterima</h1>
                <p style="color: #a7f3d0; margin: 8px 0 0 0; font-size: 14px;">MI Attaqwa 15 Babelan Kota, Kab. Bekasi</p>
              </div>
              
              <div style="padding: 32px 28px; background-color: #ffffff;">
                <p style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.6;">
                  Yth. Bapak/Ibu <strong>${updated.father_name || updated.mother_name}</strong>,
                </p>
                <p style="margin: 0 0 24px 0; font-size: 15px; line-height: 1.6; color: #475569;">
                  Alhamdulillah, setelah melalui proses verifikasi berkas dan administrasi, panitia SPMB MI Attaqwa 15 Babelan menyatakan bahwa calon siswa:
                </p>
                
                <!-- Acceptance Card -->
                <div style="background-color: #ecfdf5; border: 2px solid #10b981; border-radius: 16px; padding: 22px; margin-bottom: 24px; text-align: center;">
                  <span style="font-size: 12px; font-weight: 700; color: #047857; text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 4px;">DINYATAKAN DITERIMA DI</span>
                  <span style="font-size: 22px; font-weight: 900; color: #065f46; display: block; margin-bottom: 4px;">MI ATTAQWA 15 BABELAN</span>
                  <span style="font-size: 14px; font-weight: 700; color: #059669; display: block;">${programLabel} &bull; T.A ${updated.academic_year}</span>
                  <div style="margin-top: 12px; padding-top: 10px; border-top: 1px dashed #6ee7b7; font-size: 13px; color: #047857; font-weight: 700;">
                    Nomor Registrasi: <span style="font-family: monospace; font-size: 15px;">${updated.registration_number}</span>
                  </div>
                </div>

                <!-- Next Steps Table -->
                <h3 style="font-size: 14px; font-weight: 800; color: #0f172a; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 12px 0; border-bottom: 2px solid #f1f5f9; padding-bottom: 8px;">Informasi Tahapan Selanjutnya (Daftar Ulang)</h3>
                <ol style="margin: 0 0 24px 0; padding-left: 20px; font-size: 14px; color: #475569; line-height: 1.7;">
                  <li>Orang tua/wali murid dimohon hadir ke madrasah untuk pengambilan seragam dan pengukuran baju sesuai jadwal yang diumumkan panitia.</li>
                  <li>Masa Pengenalan Lingkungan Madrasah (MPLM) akan dilaksanakan 1-2 minggu sebelum hari pertama masuk sekolah.</li>
                  <li>Simpan bukti pendaftaran dan Nomor Registrasi <strong>${updated.registration_number}</strong> sebagai dokumen resmi ananda.</li>
                </ol>

                <p style="margin: 0 0 8px 0; font-size: 14px; color: #475569; line-height: 1.6;">
                  Selamat bergabung dalam keluarga besar MI Attaqwa 15 Babelan. Semoga ananda menjadi putra/putri yang sholeh/sholehah, berakhlak mulia, dan berprestasi.
                </p>
              </div>
              
              <div style="background-color: #f1f5f9; padding: 20px 24px; text-align: center; border-top: 1px solid #e2e8f0;">
                <p style="margin: 0; font-size: 12px; color: #64748b;">
                  Informasi lebih lanjut, silakan hubungi Panitia SPMB: <strong>+62 812-3456-7890</strong>
                </p>
                <p style="margin: 6px 0 0 0; font-size: 11px; color: #94a3b8;">
                  &copy; ${new Date().getFullYear()} MI Attaqwa 15 Babelan. All rights reserved.
                </p>
              </div>
            </div>
          `

          await resend.emails.send({
            from: 'Panitia SPMB MI Attaqwa 15 <' + senderEmail + '>',
            to: updated.father_email,
            subject: `[DITERIMA] Pengumuman Kelulusan SPMB MI Attaqwa 15 - ${updated.student_name} (${updated.registration_number})`,
            html: approvalHtml
          })
        } catch (mailErr) {
          console.error('Failed to send approval email:', mailErr)
        }
      }
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
