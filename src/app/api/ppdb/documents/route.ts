import { NextRequest, NextResponse } from 'next/server'
import { getAdminSupabase } from '@/lib/supabase'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      registration_id,
      registration_number,
      document_birth_certificate,
      document_family_card,
      document_parent_id,
      document_photo,
      document_immunization,
      document_report_card,
      special_needs,
      medical_history
    } = body

    if (!registration_id && !registration_number) {
      return NextResponse.json({ error: 'ID atau Nomor Registrasi tidak ditemukan.' }, { status: 400 })
    }

    if (!document_birth_certificate || !document_family_card || !document_parent_id || !document_photo) {
      return NextResponse.json({
        error: 'Berkas wajib belum lengkap. Harap upload Akta Kelahiran, Kartu Keluarga, KTP Orang Tua, dan Pas Foto 3x4.'
      }, { status: 400 })
    }

    const supabase: any = getAdminSupabase()

    // 1. Verify that registration exists and is approved
    let query = supabase.from('ppdb_registrations').select('*')
    if (registration_id) {
      query = query.eq('id', registration_id)
    } else {
      query = query.eq('registration_number', registration_number)
    }

    const { data: reg, error: findError } = await query.single()

    if (findError || !reg) {
      return NextResponse.json({ error: 'Data pendaftaran tidak ditemukan.' }, { status: 404 })
    }

    if (reg.status === 'rejected') {
      return NextResponse.json({ error: 'Pendaftaran berstatus ditolak dan tidak dapat mengunggah berkas lanjutan.' }, { status: 400 })
    }

    // 2. Update documents and status
    const updatePayload: any = {
      document_birth_certificate,
      document_family_card,
      document_parent_id,
      document_photo,
      document_immunization: document_immunization || null,
      document_report_card: document_report_card || null,
      special_needs: special_needs || reg.special_needs,
      medical_history: medical_history || reg.medical_history,
      documents_submitted_at: new Date().toISOString(),
      status: 'documents_submitted',
      updated_at: new Date().toISOString()
    }

    const { data: updatedReg, error: updateError } = await supabase
      .from('ppdb_registrations')
      .update(updatePayload)
      .eq('id', reg.id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating PPDB documents:', updateError)
      return NextResponse.json({ error: 'Gagal menyimpan dokumen: ' + updateError.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Berkas dokumen pendaftaran berhasil diupload dan disimpan.',
      data: updatedReg
    })
  } catch (error: any) {
    console.error('PPDB Documents API Error:', error)
    return NextResponse.json({ error: error.message || 'Terjadi kesalahan saat upload dokumen.' }, { status: 500 })
  }
}
