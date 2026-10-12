// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { getAdminSupabase } from '@/lib/supabase'
import { sendSpmbRegistrationEmail } from '@/lib/spmb-email'

export const runtime = 'nodejs'

// Helper to calculate exact age in years & months as of 16 July 2027
function calculateAgeAsOfJuly16_2027(birthDateStr: string, cutoffYear = 2027) {
  let bYear: number, bMonth: number, bDay: number
  let cleanStr = birthDateStr
  if (cleanStr.includes('T')) {
    cleanStr = cleanStr.split('T')[0]
  }
  const parts = cleanStr.split('-').map(Number)
  if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
    bYear = parts[0]
    bMonth = parts[1] - 1 // 0-indexed month
    bDay = parts[2]
  } else {
    const d = new Date(birthDateStr)
    bYear = d.getFullYear()
    bMonth = d.getMonth()
    bDay = d.getDate()
  }

  const cYear = cutoffYear
  const cMonth = 6 // July (0-indexed)
  const cDay = 16 // 16 July

  let years = cYear - bYear
  let months = cMonth - bMonth
  let days = cDay - bDay

  if (days < 0) {
    months -= 1
    const daysInPrevMonth = new Date(cYear, cMonth, 0).getDate()
    days += daysInPrevMonth
  }
  if (months < 0) {
    years -= 1
    months += 12
  }

  const totalMonths = years * 12 + months
  // Syarat minimum usia: 6 tahun 5 bulan pertanggal 16 Juli 2027
  const isValid = years > 6 || (years === 6 && months >= 5)

  return { years, months, days, totalMonths, isValid }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const supabase: any = getAdminSupabase()

    // 1. Fetch current settings
    const { data: settings } = await supabase
      .from('ppdb_settings')
      .select('*')
      .eq('id', 'current')
      .single()

    const ppdbSettings = settings || {
      academic_year: '2027/2028',
      is_active: false,
      active_batch: 1,
      batch_1_quota: 150,
      registration_fee: 300000,
    }

    if (!ppdbSettings.is_active) {
      return NextResponse.json({
        error: 'Pendaftaran SPMB Tahun Ajaran ' + ppdbSettings.academic_year + ' saat ini sedang ditutup.'
      }, { status: 403 })
    }

    // 2. Extract input fields
    const {
      // Data Siswa
      student_name,
      nisn,
      birth_place,
      birth_date,
      gender,
      religion = 'Islam',
      class_program = 'regular', // 'fullday' | 'regular'

      // Data Orang Tua / Wali
      parent_name,
      parent_nik,
      parent_occupation,
      parent_religion = 'Islam',
      parent_relation = 'Ayah Kandung', // 'Ayah Kandung' | 'Ibu Kandung' | 'Wali'
      parent_phone,
      parent_email,
      home_address,

      // Dokumen Pendukung
      document_birth_certificate,
      document_family_card,
      document_parent_id,
      document_report_card, // SK Tamat Belajar PAUD/TK/SD (Opsional)

      // Declaration Checklist (WAJIB)
      declaration_agreed,

      // Pembayaran
      payment_method = 'transfer_btn',
      payment_proof_url
    } = body

    // 3. Validation
    if (!student_name?.trim() || !birth_place?.trim() || !birth_date) {
      return NextResponse.json({ error: 'Data calon siswa (Nama Lengkap, Tempat Lahir, Tanggal Lahir) wajib diisi lengkap.' }, { status: 400 })
    }

    if (!parent_name?.trim() || !parent_nik?.trim() || !parent_occupation?.trim() || !parent_phone?.trim() || !parent_email?.trim() || !home_address?.trim()) {
      return NextResponse.json({ error: 'Data orang tua/wali (Nama, NIK, Pekerjaan, No WA, Email, Alamat) wajib diisi lengkap.' }, { status: 400 })
    }

    if (parent_nik.trim().length !== 16 || !/^\d{16}$/.test(parent_nik.trim())) {
      return NextResponse.json({ error: 'NIK Orang Tua/Wali harus terdiri dari 16 digit angka.' }, { status: 400 })
    }

    if (!document_birth_certificate || !document_family_card || !document_parent_id) {
      return NextResponse.json({ error: 'Dokumen wajib (Akta Kelahiran Anak, Kartu Keluarga, dan KTP Orang Tua/Wali) wajib diunggah.' }, { status: 400 })
    }

    if (!declaration_agreed) {
      return NextResponse.json({ error: 'Anda wajib menyetujui Surat Pernyataan Calon Siswa & Wali Murid (Declaration Checklist) sebelum melanjutkan.' }, { status: 400 })
    }

    if (!payment_proof_url) {
      return NextResponse.json({ error: 'Bukti transfer biaya pendaftaran ke rekening Bank BTN sekolah wajib diunggah.' }, { status: 400 })
    }

    // 4. Age validation (Minimum 6 years 5 months as of 16 July 2027)
    const age = calculateAgeAsOfJuly16_2027(birth_date, 2027)
    if (!age.isValid) {
      return NextResponse.json({
        error: `Usia calon siswa pada 16 Juli 2027 adalah ${age.years} tahun ${age.months} bulan. Syarat usia minimum pendaftaran adalah 6 tahun 5 bulan pertanggal 16 Juli 2027 (lahir maksimal 16 Februari 2021).`
      }, { status: 400 })
    }

    // 5. Check Quota: Total Quota (150) & Class Quotas (Fullday 75, Regular 75)
    const { data: existingRegs, count: totalCount } = await supabase
      .from('ppdb_registrations')
      .select('student_nickname, special_needs', { count: 'exact' })
      .eq('academic_year', ppdbSettings.academic_year)

    const totalRegistered = totalCount || 0
    const totalQuota = Number(ppdbSettings.batch_1_quota) || 150
    const fulldayQuota = 75
    const regularQuota = 75

    if (totalRegistered >= totalQuota) {
      return NextResponse.json({
        error: `Pendaftaran SPMB Tahun Ajaran ${ppdbSettings.academic_year} telah ditutup karena kuota penerimaan (${totalQuota} siswa) telah terpenuhi.`
      }, { status: 400 })
    }

    const isFullday = String(class_program).toLowerCase() === 'fullday'
    const fulldayCount = (existingRegs || []).filter((r: any) => 
      (r.student_nickname && String(r.student_nickname).toLowerCase().includes('fullday')) ||
      (r.special_needs && String(r.special_needs).toLowerCase().includes('fullday'))
    ).length
    const regularCount = Math.max(0, totalRegistered - fulldayCount)

    if (isFullday) {
      if (fulldayCount >= fulldayQuota) {
        return NextResponse.json({
          error: `Kuota Program Kelas Fullday (Maksimal ${fulldayQuota} Siswa) telah terpenuhi. Silakan pilih Program Kelas Regular.`
        }, { status: 400 })
      }
    } else {
      if (regularCount >= regularQuota) {
        return NextResponse.json({
          error: `Kuota Program Kelas Regular (Maksimal ${regularQuota} Siswa) telah terpenuhi. Silakan pilih Program Kelas Fullday.`
        }, { status: 400 })
      }
    }

    // 6. Generate Unique Registration Number: MI2027xxx (e.g. MI2027001)
    const sequence = totalRegistered + 1
    const regNumber = `MI2027${String(sequence).padStart(3, '0')}`

    // 7. Temporary password
    const tempPassword = `MIA${Math.floor(100000 + Math.random() * 900000)}`

    // 8. Prepare Database Payload (using existing columns safely)
    const insertPayload = {
      registration_number: regNumber,
      academic_year: ppdbSettings.academic_year || '2027/2028',
      batch: 1, // Single period
      assigned_batch: 1,
      student_name: student_name.trim(),
      student_nickname: isFullday ? 'fullday' : 'regular',
      birth_place: birth_place.trim(),
      birth_date,
      gender: gender || 'Laki-laki',
      nisn: nisn ? nisn.trim() : null,
      previous_school: religion ? `Agama: ${religion}` : 'Agama: Islam',
      special_needs: isFullday ? 'Program Kelas Fullday (75 Siswa)' : 'Program Kelas Regular (75 Siswa)',
      medical_history: `Hubungan: ${parent_relation} | Agama Ortu: ${parent_religion}`,
      father_name: parent_name.trim(),
      father_nik: parent_nik.trim(),
      father_occupation: parent_occupation.trim(),
      father_phone: parent_phone.trim(),
      father_email: parent_email.trim(),
      mother_name: parent_name.trim(),
      mother_nik: parent_nik.trim(),
      mother_occupation: parent_occupation.trim(),
      mother_phone: parent_phone.trim(),
      mother_email: parent_email.trim(),
      home_address: home_address.trim(),
      document_birth_certificate: document_birth_certificate || null,
      document_family_card: document_family_card || null,
      document_parent_id: document_parent_id || null,
      document_report_card: document_report_card || null,
      documents_submitted_at: new Date().toISOString(),
      payment_method: payment_method || 'transfer_btn',
      payment_amount: Number(ppdbSettings.registration_fee) || 300000,
      payment_proof_url,
      payment_status: 'pending',
      status: 'pending_verification',
      parent_password_hash: tempPassword,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const { data: newReg, error: insertError } = await supabase
      .from('ppdb_registrations')
      .insert(insertPayload)
      .select()
      .single()

    if (insertError) {
      console.error('Error inserting SPMB registration:', insertError)
      return NextResponse.json({ error: 'Gagal menyimpan pendaftaran: ' + insertError.message }, { status: 500 })
    }

    // 9. Send Resend Confirmation Email to Parent & Notify Admin
    try {
      await sendSpmbRegistrationEmail({
        registration: newReg,
        settings: ppdbSettings
      })
    } catch (emailErr) {
      console.error('[SPMB Register] Failed to send notification email:', emailErr)
    }

    return NextResponse.json({
      success: true,
      message: 'Pendaftaran SPMB berhasil dikirimkan.',
      data: {
        id: newReg.id,
        registration_number: regNumber,
        student_name: newReg.student_name,
        academic_year: newReg.academic_year,
        class_program: isFullday ? 'fullday' : 'regular',
        status: newReg.status,
        payment_amount: newReg.payment_amount,
        payment_status: newReg.payment_status,
        created_at: newReg.created_at
      },
      temporaryPassword: tempPassword
    })
  } catch (error: any) {
    console.error('SPMB Register API Error:', error)
    return NextResponse.json({ error: error.message || 'Terjadi kesalahan pada sistem pendaftaran' }, { status: 500 })
  }
}
