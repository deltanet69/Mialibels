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
      batch_1_quota: 75,
      batch_2_quota: 75,
      batch_3_quota: 75,
      registration_fee: 200000,
    }

    if (!ppdbSettings.is_active) {
      return NextResponse.json({
        error: 'Pendaftaran PPDB Tahun Ajaran ' + ppdbSettings.academic_year + ' saat ini sedang tidak dibuka / ditutup.'
      }, { status: 400 })
    }

    // 2. Validate input fields
    const {
      student_name,
      student_nickname,
      birth_place,
      birth_date,
      gender,
      weight,
      height,
      blood_type,
      nisn,
      previous_school,
      special_needs,
      medical_history,
      father_name,
      father_nik,
      father_occupation,
      father_phone,
      father_email,
      mother_name,
      mother_nik,
      mother_occupation,
      mother_phone,
      mother_email,
      home_address,
      payment_method,
      payment_proof_url
    } = body

    if (!student_name || !birth_place || !birth_date) {
      return NextResponse.json({ error: 'Nama siswa, tempat lahir, dan tanggal lahir wajib diisi.' }, { status: 400 })
    }

    if (!father_name || !father_nik || !father_occupation || !father_phone || !father_email) {
      return NextResponse.json({ error: 'Data ayah (Nama, NIK, Pekerjaan, No WA, Email) wajib diisi lengkap.' }, { status: 400 })
    }

    if (!mother_name || !mother_nik || !mother_occupation || !mother_phone) {
      return NextResponse.json({ error: 'Data ibu (Nama, NIK, Pekerjaan, No WA) wajib diisi lengkap.' }, { status: 400 })
    }

    if (!payment_proof_url) {
      return NextResponse.json({ error: 'Bukti pembayaran biaya pendaftaran wajib diupload.' }, { status: 400 })
    }

    // 3. Age validation: Minimum 6 years 6 months per 1 July 2027 (78 months)
    const age = calculateAgeAsOfJuly2027(birth_date, 2027)
    if (age.totalMonths < 78) {
      return NextResponse.json({
        error: `Usia calon siswa pada 1 Juli 2027 adalah ${age.years} tahun ${age.months} bulan. Syarat usia minimum pendaftaran adalah 6 tahun 6 bulan.`
      }, { status: 400 })
    }

    // 4. Determine batch and verify quota
    const activeBatch = ppdbSettings.active_batch || 1

    const { count } = await supabase
      .from('ppdb_registrations')
      .select('*', { count: 'exact', head: true })
      .eq('academic_year', ppdbSettings.academic_year)
      .eq('batch', activeBatch)

    const batchQuota = activeBatch === 1 
      ? ppdbSettings.batch_1_quota 
      : activeBatch === 2 
        ? ppdbSettings.batch_2_quota 
        : ppdbSettings.batch_3_quota

    if (count !== null && count >= batchQuota) {
      return NextResponse.json({
        error: `Kuota Batch ${activeBatch} (${batchQuota} pendaftar) telah penuh. Harap hubungi panitia PPDB atau menunggu pembukaan gelombang berikutnya.`
      }, { status: 400 })
    }

    // 5. Generate Unique Registration Number (e.g. PPDB27-0101)
    const { count: totalRegCount } = await supabase
      .from('ppdb_registrations')
      .select('*', { count: 'exact', head: true })
      .eq('academic_year', ppdbSettings.academic_year)

    const sequence = (totalRegCount || 0) + 1
    const regNumber = `PPDB27-${String(sequence).padStart(4, '0')}`

    // 6. Generate temporary parent portal password
    const tempPassword = `MIA${Math.floor(100000 + Math.random() * 900000)}`

    // 7. Insert registration into database
    const insertPayload = {
      registration_number: regNumber,
      academic_year: ppdbSettings.academic_year,
      batch: activeBatch,
      assigned_batch: activeBatch,
      student_name: student_name.trim(),
      student_nickname: student_nickname ? student_nickname.trim() : null,
      birth_place: birth_place.trim(),
      birth_date,
      gender: gender || 'Laki-laki',
      weight: weight ? Number(weight) : null,
      height: height ? Number(height) : null,
      blood_type: blood_type || null,
      nisn: nisn ? nisn.trim() : null,
      previous_school: previous_school ? previous_school.trim() : null,
      special_needs: special_needs ? special_needs.trim() : null,
      medical_history: medical_history ? medical_history.trim() : null,
      father_name: father_name.trim(),
      father_nik: father_nik.trim(),
      father_occupation: father_occupation.trim(),
      father_phone: father_phone.trim(),
      father_email: father_email.trim(),
      mother_name: mother_name.trim(),
      mother_nik: mother_nik.trim(),
      mother_occupation: mother_occupation.trim(),
      mother_phone: mother_phone.trim(),
      mother_email: mother_email ? mother_email.trim() : null,
      home_address: home_address ? home_address.trim() : null,
      payment_method: payment_method || 'transfer_btn',
      payment_amount: Number(ppdbSettings.registration_fee) || 200000,
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
      console.error('Error inserting PPDB registration:', insertError)
      return NextResponse.json({ error: 'Gagal menyimpan pendaftaran: ' + insertError.message }, { status: 500 })
    }

    // 8. Send Resend Confirmation Email (Async/Best-effort)
    const RESEND_KEY = process.env.RESEND_API_KEY
    if (RESEND_KEY) {
      try {
        const { Resend } = await import('resend')
        const resend = new Resend(RESEND_KEY)
        const senderEmail = 'ppdb@miattaqwa15.sch.id'
        const adminEmail = process.env.ADMIN_EMAIL || 'admin@miattaqwa15.sch.id'

        // Modern Branded Parent Confirmation Email
        const parentHtml = `
          <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 620px; margin: 0 auto; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 20px; overflow: hidden; color: #1e293b;">
            <div style="background: linear-gradient(135deg, #001d3d 0%, #003566 100%); padding: 36px 30px; text-align: center;">
              <span style="display: inline-block; background-color: #ffd60a; color: #001d3d; font-size: 11px; font-weight: 800; padding: 4px 14px; border-radius: 999px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px;">PPDB ONLINE T.A ${ppdbSettings.academic_year}</span>
              <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">Bukti Pendaftaran Siswa Baru</h1>
              <p style="color: #93c5fd; margin: 8px 0 0 0; font-size: 14px;">MI Attaqwa 15 Babelan Kota, Kab. Bekasi</p>
            </div>
            
            <div style="padding: 32px 28px; background-color: #ffffff;">
              <p style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.6;">
                Yth. Bapak/Ibu <strong>${father_name}</strong> / <strong>${mother_name}</strong>,
              </p>
              <p style="margin: 0 0 24px 0; font-size: 15px; line-height: 1.6; color: #475569;">
                Alhamdulillah, berkas formulir pendaftaran calon peserta didik baru atas nama <strong>${student_name}</strong> telah berhasil kami terima.
              </p>
              
              <!-- Registration Card -->
              <div style="background-color: #f0fdf4; border: 1.5px dashed #22c55e; border-radius: 16px; padding: 22px; margin-bottom: 24px; text-align: center;">
                <span style="font-size: 12px; font-weight: 700; color: #15803d; text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 4px;">NOMOR REGISTRASI PPDB</span>
                <span style="font-size: 28px; font-weight: 900; color: #166534; letter-spacing: 2px; font-family: monospace;">${regNumber}</span>
                <div style="margin-top: 8px; font-size: 12px; color: #16a34a; font-weight: 600;">
                  Gelombang: Batch ${activeBatch} &bull; Biaya Pendaftaran: Rp ${(Number(ppdbSettings.registration_fee) || 200000).toLocaleString('id-ID')}
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
                  <td style="padding: 8px 0; color: #64748b; border-top: 1px solid #f8fafc;">Tempat, Tanggal Lahir</td>
                  <td style="padding: 8px 0; font-weight: 600; color: #1e293b; border-top: 1px solid #f8fafc;">${birth_place}, ${new Date(birth_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #64748b; border-top: 1px solid #f8fafc;">Usia (per 1 Juli 2027)</td>
                  <td style="padding: 8px 0; font-weight: 600; color: #15803d; border-top: 1px solid #f8fafc;">${age.years} Tahun ${age.months} Bulan</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #64748b; border-top: 1px solid #f8fafc;">Status Verifikasi</td>
                  <td style="padding: 8px 0; font-weight: 700; color: #d97706; border-top: 1px solid #f8fafc;">Menunggu Verifikasi Panitia</td>
                </tr>
              </table>

              <!-- Login Credentials Info -->
              <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; padding: 18px; margin-bottom: 24px;">
                <span style="font-size: 13px; font-weight: 700; color: #334155; display: block; margin-bottom: 6px;">Akses Pengecekan Status:</span>
                <p style="margin: 0; font-size: 13px; color: #64748b; line-height: 1.5;">
                  Bapak/Ibu dapat memantau status kelulusan berkas &amp; melengkapi dokumen melalui menu <strong>Cek Status PPDB</strong> di website kami menggunakan Nomor Registrasi: <strong>${regNumber}</strong> atau No. HP Ayah: <strong>${father_phone}</strong>.
                </p>
              </div>

              <p style="margin: 0 0 8px 0; font-size: 14px; color: #475569; line-height: 1.6;">
                Panitia PPDB akan memverifikasi berkas pembayaran Anda dalam 1x24 jam. Jika disetujui, Anda dapat mengunggah berkas Akta, KK, dan KTP di portal PPDB.
              </p>
            </div>
            
            <div style="background-color: #f1f5f9; padding: 20px 24px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0; font-size: 12px; color: #64748b;">
                Butuh bantuan? Hubungi WhatsApp Panitia PPDB: <strong>${ppdbSettings.whatsapp_contact || '+62 812-3456-7890'}</strong>
              </p>
              <p style="margin: 6px 0 0 0; font-size: 11px; color: #94a3b8;">
                &copy; ${new Date().getFullYear()} MI Attaqwa 15 Babelan. All rights reserved.
              </p>
            </div>
          </div>
        `

        // Send to parent
        await resend.emails.send({
          from: 'Panitia PPDB MI Attaqwa 15 <' + senderEmail + '>',
          to: father_email,
          subject: `[PPDB ${ppdbSettings.academic_year}] Pendaftaran Berhasil - ${regNumber} (${student_name})`,
          html: parentHtml
        })

        // Notify school admin
        await resend.emails.send({
          from: 'Notifikasi PPDB <' + senderEmail + '>',
          to: adminEmail,
          subject: `[Pendaftar PPDB Baru] ${regNumber} - ${student_name} (Batch ${activeBatch})`,
          html: `
            <div style="font-family: sans-serif; padding: 20px; max-width: 500px;">
              <h2>Pendaftar PPDB Baru Masuk</h2>
              <p><strong>Nomor Registrasi:</strong> ${regNumber}</p>
              <p><strong>Nama Calon Siswa:</strong> ${student_name}</p>
              <p><strong>Gelombang:</strong> Batch ${activeBatch}</p>
              <p><strong>Orang Tua:</strong> ${father_name} (${father_phone})</p>
              <p><strong>Metode Pembayaran:</strong> ${payment_method}</p>
              <p>Silakan verifikasi bukti transfer di Dashboard Admin [AKADEMIK] &gt; PPDB Baru.</p>
            </div>
          `
        })
      } catch (emailErr) {
        console.error('Failed to send PPDB notification email:', emailErr)
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Pendaftaran PPDB berhasil dikirimkan.',
      data: {
        id: newReg.id,
        registration_number: regNumber,
        student_name: newReg.student_name,
        academic_year: newReg.academic_year,
        batch: newReg.batch,
        status: newReg.status,
        payment_amount: newReg.payment_amount,
        payment_status: newReg.payment_status,
        created_at: newReg.created_at
      },
      temporaryPassword: tempPassword
    })
  } catch (error: any) {
    console.error('PPDB Register API Error:', error)
    return NextResponse.json({ error: error.message || 'Terjadi kesalahan pada sistem pendaftaran' }, { status: 500 })
  }
}
