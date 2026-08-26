import { NextRequest, NextResponse } from 'next/server'
import { getAdminSupabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json()

    if (!query || !query.trim()) {
      return NextResponse.json({ error: 'Harap masukkan Nomor Registrasi atau Nomor WhatsApp yang didaftarkan.' }, { status: 400 })
    }

    const cleanQuery = query.trim()
    const supabase: any = getAdminSupabase()

    // Search by registration_number, father_phone, or father_email
    const { data: records, error } = await supabase
      .from('ppdb_registrations')
      .select('*')
      .or(`registration_number.ilike.%${cleanQuery}%,father_phone.ilike.%${cleanQuery}%,mother_phone.ilike.%${cleanQuery}%,father_email.ilike.%${cleanQuery}%`)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error querying PPDB status:', error)
      return NextResponse.json({ error: 'Gagal mencari data pendaftaran: ' + error.message }, { status: 500 })
    }

    if (!records || records.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'Data pendaftaran tidak ditemukan. Pastikan Nomor Registrasi atau Nomor WhatsApp sesuai saat mendaftar.'
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: records
    })
  } catch (error: any) {
    console.error('PPDB Status API Error:', error)
    return NextResponse.json({ error: error.message || 'Terjadi kesalahan saat memeriksa status.' }, { status: 500 })
  }
}
