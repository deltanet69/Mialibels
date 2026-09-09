import { NextRequest, NextResponse } from 'next/server'
import { getAdminSupabase } from '@/lib/supabase'

export const runtime = 'nodejs'

// Helper to calculate exact age in years & months as of 1 July 2027
function calculateAgeAsOfJuly2027(birthDateStr: string, cutoffYear = 2027) {
  const birthDate = new Date(birthDateStr)
  const cutoffDate = new Date(cutoffYear, 6, 1) // 1 July of cutoffYear

  let years = cutoffDate.getFullYear() - birthDate.getFullYear()
  let months = cutoffDate.getMonth() - birthDate.getMonth()
  let days = cutoffDate.getDate() - birthDate.getDate()

  if (days < 0) {
    months -= 1
  }
  if (months < 0) {
    years -= 1
    months += 12
  }

  const totalMonths = years * 12 + months
  return { years, months, totalMonths }
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
      is_active: true,
      active_batch: 1,
      batch_1_quota: 120,
      registration_fee: 300000,
    }

    if (!ppdbSettings.is_active) {
      return NextResponse.json({
        error: 'Pendaftaran SPMB Tahun Ajaran ' + ppdbSettings.academic_year + ' saat ini sedang ditutup.'
      }, { status: 400 })
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

    // 4. Age validation (Minimum 6 years per 1 July 2027)
    const age = calculateAgeAsOfJuly2027(birth_date, 2027)
    if (age.totalMonths < 72) { // 6 tahun = 72 bulan
      return NextResponse.json({
        error: `Usia calon siswa pada 1 Juli 2027 adalah ${age.years} tahun ${age.months} bulan. Syarat usia minimum pendaftaran adalah 6 tahun.`
      }, { status: 400 })
    }

    // 5. Check Quota: Total Quota & Fullday Class Quota (Max 30 Siswa)
    const { data: existingRegs, count: totalCount } = await supabase
      .from('ppdb_registrations')
      .select('student_nickname, special_needs', { count: 'exact' })
      .eq('academic_year', ppdbSettings.academic_year)

    const totalRegistered = totalCount || 0
    const totalQuota = Number(ppdbSettings.batch_1_quota) || 120

    if (totalRegistered >= totalQuota) {
      return NextResponse.json({
        error: `Pendaftaran SPMB Tahun Ajaran ${ppdbSettings.academic_year} telah ditutup karena kuota penerimaan (${totalQuota} siswa) telah terpenuhi.`
      }, { status: 400 })
    }

    const isFullday = String(class_program).toLowerCase() === 'fullday'
    if (isFullday) {
      const fulldayCount = (existingRegs || []).filter((r: any) => 
        (r.student_nickname && String(r.student_nickname).toLowerCase().includes('fullday')) ||
        (r.special_needs && String(r.special_needs).toLowerCase().includes('fullday'))
      ).length

      if (fulldayCount >= 30) {
        return NextResponse.json({
          error: 'Kuota Program Kelas Fullday (Maksimal 30 Siswa) telah terpenuhi. Silakan pilih Program Kelas Regular.'
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
      special_needs: isFullday ? 'Program Kelas Fullday (Maks 30 Siswa)' : 'Program Kelas Regular',
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

    // 9. Send Resend Confirmation Email to Parent
    const RESEND_KEY = process.env.RESEND_API_KEY
    if (RESEND_KEY) {
      try {
        const { Resend } = await import('resend')
        const resend = new Resend(RESEND_KEY)
        const senderEmail = 'ppdb@miattaqwa15.sch.id'
        const adminEmail = process.env.ADMIN_EMAIL || 'admin@miattaqwa15.sch.id'
        const programLabel = isFullday ? 'Kelas Fullday (Maks 30 Siswa)' : 'Kelas Regular'

        const parentHtml = `
          <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 620px; margin: 0 auto; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 20px; overflow: hidden; color: #1e293b;">
            <div style="background: linear-gradient(135deg, #001d3d 0%, #003566 100%); padding: 36px 30px; text-align: center;">
              <span style="display: inline-block; background-color: #ffd60a; color: #001d3d; font-size: 11px; font-weight: 800; padding: 4px 14px; border-radius: 999px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px;">SPMB ONLINE T.A ${ppdbSettings.academic_year}</span>
              <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">Bukti Pendaftaran Siswa Baru</h1>
              <p style="color: #93c5fd; margin: 8px 0 0 0; font-size: 14px;">MI Attaqwa 15 Babelan Kota, Kab. Bekasi</p>
            </div>
            
            <div style="padding: 32px 28px; background-color: #ffffff;">
              <p style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.6;">
                Yth. Bapak/Ibu <strong>${parent_name}</strong> (${parent_relation}),
              </p>
              <p style="margin: 0 0 24px 0; font-size: 15px; line-height: 1.6; color: #475569;">
                Alhamdulillah, berkas formulir dan bukti pembayaran pendaftaran SPMB calon murid baru atas nama <strong>${student_name}</strong> telah berhasil kami terima.
              </p>
              
              <!-- Registration Card -->
              <div style="background-color: #f0fdf4; border: 1.5px dashed #22c55e; border-radius: 16px; padding: 22px; margin-bottom: 24px; text-align: center;">
                <span style="font-size: 12px; font-weight: 700; color: #15803d; text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 4px;">NOMOR REGISTRASI RESMI</span>
                <span style="font-size: 32px; font-weight: 900; color: #166534; letter-spacing: 2px; font-family: monospace;">${regNumber}</span>
                <div style="margin-top: 8px; font-size: 13px; color: #16a34a; font-weight: 700;">
                  Program Pilihan: ${programLabel}
                </div>
              </div>

              <!-- Student Summary Table -->
              <h3 style="font-size: 14px; font-weight: 800; color: #0f172a; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 12px 0; border-bottom: 2px solid #f1f5f9; padding-bottom: 8px;">Rangkuman Data Calon Siswa</h3>
              <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 8px 0; color: #64748b; width: 40%;">Nama Lengkap</td>
                  <td style="padding: 8px 0; font-weight: 700; color: #1e293b;">${student_name}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #64748b; border-top: 1px solid #f8fafc;">NISN</td>
                  <td style="padding: 8px 0; font-weight: 600; color: #1e293b; border-top: 1px solid #f8fafc;">${nisn || '-'}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #64748b; border-top: 1px solid #f8fafc;">Tempat, Tanggal Lahir</td>
                  <td style="padding: 8px 0; font-weight: 600; color: #1e293b; border-top: 1px solid #f8fafc;">${birth_place}, ${new Date(birth_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #64748b; border-top: 1px solid #f8fafc;">Jenis Kelamin &amp; Agama</td>
                  <td style="padding: 8px 0; font-weight: 600; color: #1e293b; border-top: 1px solid #f8fafc;">${gender} &bull; ${religion}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #64748b; border-top: 1px solid #f8fafc;">Orang Tua / Wali</td>
                  <td style="padding: 8px 0; font-weight: 600; color: #1e293b; border-top: 1px solid #f8fafc;">${parent_name} (${parent_phone})</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #64748b; border-top: 1px solid #f8fafc;">Status Pendaftaran</td>
                  <td style="padding: 8px 0; font-weight: 700; color: #d97706; border-top: 1px solid #f8fafc;">Menunggu Verifikasi Panitia</td>
                </tr>
              </table>

              <!-- Declaration & Verification Notice -->
              <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; padding: 18px; margin-bottom: 24px;">
                <span style="font-size: 13px; font-weight: 700; color: #334155; display: block; margin-bottom: 6px;">Langkah Selanjutnya:</span>
                <p style="margin: 0; font-size: 13px; color: #64748b; line-height: 1.5;">
                  1. Panitia SPMB akan memverifikasi berkas dan bukti pembayaran Anda dalam 1x24 jam.<br/>
                  2. Setelah pendaftaran disetujui (di-approve) oleh pihak madrasah, Anda akan menerima <strong>Email Konfirmasi Penerimaan Resmi</strong> ke email ini (${parent_email}).<br/>
                  3. Anda juga dapat memantau status secara berkala melalui menu <strong>Cek Status SPMB</strong> menggunakan Nomor Registrasi: <strong>${regNumber}</strong> atau No. WhatsApp: <strong>${parent_phone}</strong>.
                </p>
              </div>

              <p style="margin: 0 0 8px 0; font-size: 14px; color: #475569; line-height: 1.6;">
                Terima kasih atas kepercayaan Bapak/Ibu memilih MI Attaqwa 15 Babelan sebagai mitra pendidikan ananda tercinta.
              </p>
            </div>
            
            <div style="background-color: #f1f5f9; padding: 20px 24px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0; font-size: 12px; color: #64748b;">
                Butuh bantuan? Hubungi WhatsApp Panitia SPMB: <strong>${ppdbSettings.whatsapp_contact || '+62 812-3456-7890'}</strong>
              </p>
              <p style="margin: 6px 0 0 0; font-size: 11px; color: #94a3b8;">
                &copy; ${new Date().getFullYear()} MI Attaqwa 15 Babelan. All rights reserved.
              </p>
            </div>
          </div>
        `

        // Send to parent
        await resend.emails.send({
          from: 'Panitia SPMB MI Attaqwa 15 <' + senderEmail + '>',
          to: parent_email,
          subject: `[SPMB ${ppdbSettings.academic_year}] Pendaftaran Berhasil - ${regNumber} (${student_name})`,
          html: parentHtml
        })

        // Notify school admin
        await resend.emails.send({
          from: 'Notifikasi SPMB <' + senderEmail + '>',
          to: adminEmail,
          subject: `[Pendaftar SPMB Baru] ${regNumber} - ${student_name} (${programLabel})`,
          html: `
            <div style="font-family: sans-serif; padding: 20px; max-width: 500px;">
              <h2>Pendaftar SPMB Baru Masuk</h2>
              <p><strong>Nomor Registrasi:</strong> ${regNumber}</p>
              <p><strong>Nama Calon Siswa:</strong> ${student_name}</p>
              <p><strong>Program Pilihan:</strong> ${programLabel}</p>
              <p><strong>Orang Tua/Wali:</strong> ${parent_name} (${parent_phone})</p>
              <p><strong>Email Ortu:</strong> ${parent_email}</p>
              <p>Silakan verifikasi berkas & bukti transfer di Dashboard Admin [AKADEMIK] &gt; SPMB Baru.</p>
            </div>
          `
        })
      } catch (emailErr) {
        console.error('Failed to send SPMB notification email:', emailErr)
      }
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
