import { Resend } from 'resend'
import { sendWhatsAppMessage } from '@/lib/openwa'

// Resilient API Key Resolution (loaded from process.env on server/local)
const RESEND_API_KEY = process.env.RESEND_API_KEY || ''
const SENDER_EMAIL = process.env.RESEND_FROM_EMAIL || 'Panitia SPMB MI Attaqwa 15 <spmb@miattaqwa15.sch.id>'
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@miattaqwa15.sch.id'
const SCHOOL_NAME = 'MI Attaqwa 15 Babelan'
const SCHOOL_LOCATION = 'Babelan Kota, Kab. Bekasi'

/**
 * Extract valid parent email from any common schema column
 */
export function getParentEmail(reg: any): string | null {
  if (!reg) return null
  const candidates = [
    reg.father_email,
    reg.mother_email,
    reg.parent_email,
    reg.email
  ]
  for (const c of candidates) {
    if (c && typeof c === 'string' && c.trim().includes('@')) {
      return c.trim()
    }
  }
  return null
}

/**
 * Extract valid parent phone for WhatsApp notifications
 */
export function getParentPhone(reg: any): string | null {
  if (!reg) return null
  const candidates = [
    reg.father_phone,
    reg.mother_phone,
    reg.parent_phone,
    reg.phone
  ]
  for (const c of candidates) {
    if (c && typeof c === 'string' && c.trim().length >= 8) {
      return c.trim()
    }
  }
  return null
}

/**
 * Helper to get active Resend instance
 */
function getResendClient(): Resend | null {
  const key = process.env.RESEND_API_KEY || ''
  if (!key) {
    console.warn('[SPMB Email] RESEND_API_KEY is not defined in environment')
    return null
  }
  return new Resend(key)
}

// ═══════════════════════════════════════════════════════════════════════════
// 1. REGISTRATION CONFIRMATION EMAIL (BUKTI PENDAFTARAN)
// ═══════════════════════════════════════════════════════════════════════════
export async function sendSpmbRegistrationEmail(params: {
  registration: any
  settings?: any
}) {
  const { registration: reg, settings } = params
  const resend = getResendClient()
  const recipientEmail = getParentEmail(reg)
  const academicYear = reg.academic_year || settings?.academic_year || '2027/2028'
  const isFullday = (reg.student_nickname && String(reg.student_nickname).toLowerCase().includes('fullday')) ||
    (reg.special_needs && String(reg.special_needs).toLowerCase().includes('fullday'))
  const programLabel = isFullday ? 'Program Kelas Fullday (Maks 30 Siswa)' : 'Program Kelas Regular'
  const parentName = reg.father_name || reg.mother_name || 'Bapak/Ibu Orang Tua'
  const waContact = settings?.whatsapp_contact || '+62 812-3456-7890'

  const results: { parentEmailId?: string; adminEmailId?: string; waSent?: boolean; error?: string } = {}

  if (!resend) {
    results.error = 'RESEND_API_KEY not configured'
    console.warn('[SPMB Email] RESEND_API_KEY not configured, skipping email delivery')
    return results
  }

  // 1. Send Email to Parent
  if (recipientEmail) {
    try {
      const parentHtml = `
        <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 620px; margin: 0 auto; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 20px; overflow: hidden; color: #1e293b;">
          <div style="background: linear-gradient(135deg, #001d3d 0%, #003566 100%); padding: 36px 30px; text-align: center;">
            <span style="display: inline-block; background-color: #ffd60a; color: #001d3d; font-size: 11px; font-weight: 800; padding: 4px 14px; border-radius: 999px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px;">SPMB ONLINE T.A ${academicYear}</span>
            <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">Bukti Pendaftaran Siswa Baru</h1>
            <p style="color: #93c5fd; margin: 8px 0 0 0; font-size: 14px;">${SCHOOL_NAME} ${SCHOOL_LOCATION}</p>
          </div>
          
          <div style="padding: 32px 28px; background-color: #ffffff;">
            <p style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.6;">
              Yth. Bapak/Ibu <strong>${parentName}</strong>,
            </p>
            <p style="margin: 0 0 24px 0; font-size: 15px; line-height: 1.6; color: #475569;">
              Alhamdulillah, berkas formulir dan bukti transfer biaya pendaftaran calon siswa atas nama <strong>${reg.student_name}</strong> telah berhasil kami terima.
            </p>
            
            <!-- Registration Number Badge -->
            <div style="background-color: #f0fdf4; border: 2px dashed #22c55e; border-radius: 16px; padding: 22px; margin-bottom: 24px; text-align: center;">
              <span style="font-size: 12px; font-weight: 700; color: #15803d; text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 4px;">NOMOR REGISTRASI RESMI</span>
              <span style="font-size: 32px; font-weight: 900; color: #166534; letter-spacing: 2px; font-family: monospace;">${reg.registration_number}</span>
              <div style="margin-top: 8px; font-size: 13px; color: #16a34a; font-weight: 700;">
                Program Pilihan: ${programLabel}
              </div>
            </div>

            <!-- Student Summary Table -->
            <h3 style="font-size: 14px; font-weight: 800; color: #0f172a; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 12px 0; border-bottom: 2px solid #f1f5f9; padding-bottom: 8px;">Rangkuman Data Calon Siswa</h3>
            <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin-bottom: 24px;">
              <tr>
                <td style="padding: 8px 0; color: #64748b; width: 40%;">Nama Lengkap</td>
                <td style="padding: 8px 0; font-weight: 700; color: #1e293b;">${reg.student_name}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #64748b; border-top: 1px solid #f8fafc;">NISN</td>
                <td style="padding: 8px 0; font-weight: 600; color: #1e293b; border-top: 1px solid #f8fafc;">${reg.nisn || '-'}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #64748b; border-top: 1px solid #f8fafc;">Tempat, Tanggal Lahir</td>
                <td style="padding: 8px 0; font-weight: 600; color: #1e293b; border-top: 1px solid #f8fafc;">${reg.birth_place || '-'}, ${reg.birth_date || '-'}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #64748b; border-top: 1px solid #f8fafc;">Jenis Kelamin</td>
                <td style="padding: 8px 0; font-weight: 600; color: #1e293b; border-top: 1px solid #f8fafc;">${reg.gender || 'Laki-laki'}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #64748b; border-top: 1px solid #f8fafc;">Orang Tua / Wali</td>
                <td style="padding: 8px 0; font-weight: 600; color: #1e293b; border-top: 1px solid #f8fafc;">${parentName} (${reg.father_phone || reg.mother_phone || '-'})</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #64748b; border-top: 1px solid #f8fafc;">Status Verifikasi</td>
                <td style="padding: 8px 0; font-weight: 700; color: #d97706; border-top: 1px solid #f8fafc;">Sedang Diverifikasi Panitia</td>
              </tr>
            </table>

            <!-- Next Steps Notice -->
            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; padding: 18px; margin-bottom: 24px;">
              <span style="font-size: 13px; font-weight: 700; color: #334155; display: block; margin-bottom: 6px;">Tahapan Selanjutnya:</span>
              <p style="margin: 0; font-size: 13px; color: #64748b; line-height: 1.6;">
                1. Panitia SPMB akan memverifikasi kelengkapan dokumen dan bukti pembayaran pendaftaran dalam 1x24 jam.<br/>
                2. Setelah berkas disetujui, Anda akan menerima <strong>Email Pengumuman Resmi</strong> melalui email ini (${recipientEmail}).<br/>
                3. Anda juga dapat memantau status setiap saat di menu website <strong>Cek Status SPMB</strong> dengan No. Registrasi: <strong>${reg.registration_number}</strong>.
              </p>
            </div>

            <p style="margin: 0 0 8px 0; font-size: 14px; color: #475569; line-height: 1.6;">
              Terima kasih atas kepercayaan Bapak/Ibu mendaftarkan putra/putri tercinta di ${SCHOOL_NAME}.
            </p>
          </div>
          
          <div style="background-color: #f1f5f9; padding: 20px 24px; text-align: center; border-top: 1px solid #e2e8f0;">
            <p style="margin: 0; font-size: 12px; color: #64748b;">
              Layanan Panitia SPMB WhatsApp: <strong>${waContact}</strong>
            </p>
            <p style="margin: 6px 0 0 0; font-size: 11px; color: #94a3b8;">
              &copy; ${new Date().getFullYear()} ${SCHOOL_NAME}. All rights reserved.
            </p>
          </div>
        </div>
      `

      const sendRes = await resend.emails.send({
        from: SENDER_EMAIL,
        to: recipientEmail,
        replyTo: 'admin@miattaqwa15.sch.id',
        subject: `[SPMB ${academicYear}] Pendaftaran Berhasil - ${reg.registration_number} (${reg.student_name})`,
        html: parentHtml
      })

      results.parentEmailId = sendRes.data?.id
      console.log(`[SPMB Email] Registration email successfully sent to ${recipientEmail} (ID: ${sendRes.data?.id})`)
    } catch (err: any) {
      console.error(`[SPMB Email] Failed to send registration email to ${recipientEmail}:`, err.message || err)
      results.error = err.message
    }
  }

  // 2. Notify School Admin
  try {
    const adminRes = await resend.emails.send({
      from: SENDER_EMAIL,
      to: ADMIN_EMAIL,
      replyTo: recipientEmail || 'admin@miattaqwa15.sch.id',
      subject: `[Pendaftar SPMB Baru] ${reg.registration_number} - ${reg.student_name} (${programLabel})`,
      html: `
        <div style="font-family: sans-serif; padding: 24px; max-width: 540px; border: 1px solid #e2e8f0; border-radius: 12px;">
          <h2 style="color: #0f172a; margin-top: 0;">Pendaftar SPMB Baru Masuk</h2>
          <p><strong>Nomor Registrasi:</strong> ${reg.registration_number}</p>
          <p><strong>Nama Calon Siswa:</strong> ${reg.student_name}</p>
          <p><strong>Program Pilihan:</strong> ${programLabel}</p>
          <p><strong>Orang Tua/Wali:</strong> ${parentName} (${reg.father_phone || reg.mother_phone || '-'})</p>
          <p><strong>Email:</strong> ${recipientEmail || '-'}</p>
          <p style="margin-top: 16px;">
            <a href="https://miattaqwa15.sch.id/academic/spmb" style="display: inline-block; background-color: #2563eb; color: #ffffff; padding: 10px 18px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 13px;">Buka Dashboard Admin SPMB</a>
          </p>
        </div>
      `
    })
    results.adminEmailId = adminRes.data?.id
  } catch (adminErr) {
    console.warn('[SPMB Email] Admin notification skipped/failed:', adminErr)
  }

  // 3. Optional WhatsApp Confirmation Fallback
  const phone = getParentPhone(reg)
  if (phone) {
    try {
      const waText = `*BUKTI PENDAFTARAN SPMB ${academicYear}*\n*${SCHOOL_NAME}*\n\nAlhamdulillah, pendaftaran calon siswa baru telah kami terima:\n\n• *No. Registrasi:* ${reg.registration_number}\n• *Nama Siswa:* ${reg.student_name}\n• *Program:* ${programLabel}\n• *Status:* Menunggu Verifikasi Berkas\n\nEmail bukti pendaftaran lengkap telah dikirimkan ke *${recipientEmail || 'email Anda'}*.\n\nCek status berkala: https://miattaqwa15.sch.id/spmb-app\n_Terima kasih atas kepercayaan Bapak/Ibu._`
      await sendWhatsAppMessage(phone, waText)
      results.waSent = true
    } catch (waErr) {
      // WA gateway is optional, non-blocking
    }
  }

  return results
}

// ═══════════════════════════════════════════════════════════════════════════
// 2. APPROVAL EMAIL (PENGUMUMAN KELULUSAN / DITERIMA)
// ═══════════════════════════════════════════════════════════════════════════
export async function sendSpmbApprovalEmail(params: {
  registration: any
  settings?: any
}) {
  const { registration: reg, settings } = params
  const resend = getResendClient()
  const recipientEmail = getParentEmail(reg)
  const academicYear = reg.academic_year || settings?.academic_year || '2027/2028'
  const isFullday = (reg.student_nickname && String(reg.student_nickname).toLowerCase().includes('fullday')) ||
    (reg.special_needs && String(reg.special_needs).toLowerCase().includes('fullday'))
  const programLabel = isFullday ? 'Program Kelas Fullday' : 'Program Kelas Regular'
  const parentName = reg.father_name || reg.mother_name || 'Bapak/Ibu Orang Tua'
  const waContact = settings?.whatsapp_contact || '+62 812-3456-7890'

  if (!resend) {
    console.warn('[SPMB Email] RESEND_API_KEY not configured, skipping approval email')
    return { success: false, error: 'RESEND_API_KEY not configured' }
  }

  if (!recipientEmail) {
    console.warn(`[SPMB Email] Cannot send approval email: No email address found for ${reg.registration_number}`)
    return { error: 'No recipient email' }
  }

  try {
    const approvalHtml = `
      <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 620px; margin: 0 auto; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 20px; overflow: hidden; color: #1e293b;">
        <div style="background: linear-gradient(135deg, #065f46 0%, #047857 100%); padding: 36px 30px; text-align: center;">
          <span style="display: inline-block; background-color: #d1fae5; color: #065f46; font-size: 11px; font-weight: 800; padding: 4px 14px; border-radius: 999px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px;">PENGUMUMAN KELULUSAN SPMB</span>
          <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">Selamat! Pendaftaran Diterima</h1>
          <p style="color: #a7f3d0; margin: 8px 0 0 0; font-size: 14px;">${SCHOOL_NAME} ${SCHOOL_LOCATION}</p>
        </div>
        
        <div style="padding: 32px 28px; background-color: #ffffff;">
          <p style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.6;">
            Yth. Bapak/Ibu <strong>${parentName}</strong>,
          </p>
          <p style="margin: 0 0 24px 0; font-size: 15px; line-height: 1.6; color: #475569;">
            Alhamdulillah, setelah melalui proses verifikasi berkas dan seleksi administrasi panitia SPMB ${SCHOOL_NAME}, dengan ini menyatakan bahwa calon siswa:
          </p>
          
          <!-- Acceptance Card -->
          <div style="background-color: #ecfdf5; border: 2px solid #10b981; border-radius: 16px; padding: 22px; margin-bottom: 24px; text-align: center;">
            <span style="font-size: 12px; font-weight: 700; color: #047857; text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 4px;">DINYATAKAN DITERIMA DI</span>
            <span style="font-size: 22px; font-weight: 900; color: #065f46; display: block; margin-bottom: 4px;">${SCHOOL_NAME}</span>
            <span style="font-size: 14px; font-weight: 700; color: #059669; display: block;">${programLabel} &bull; T.A ${academicYear}</span>
            <div style="margin-top: 12px; padding-top: 10px; border-top: 1px dashed #6ee7b7; font-size: 13px; color: #047857; font-weight: 700;">
              Nama Siswa: <strong>${reg.student_name}</strong><br/>
              Nomor Registrasi: <span style="font-family: monospace; font-size: 15px;">${reg.registration_number}</span>
            </div>
          </div>

          <!-- Next Steps List -->
          <h3 style="font-size: 14px; font-weight: 800; color: #0f172a; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 12px 0; border-bottom: 2px solid #f1f5f9; padding-bottom: 8px;">Informasi Tahapan Daftar Ulang &amp; Perlengkapan</h3>
          <ol style="margin: 0 0 24px 0; padding-left: 20px; font-size: 14px; color: #475569; line-height: 1.7;">
            <li>Orang tua/wali murid dimohon hadir ke madrasah untuk pengukuran seragam dan pengambilan paket perlengkapan belajar sesuai jadwal.</li>
            <li>Masa Pengenalan Lingkungan Madrasah (MPLM) akan dilaksanakan 1-2 minggu sebelum hari pertama masuk sekolah.</li>
            <li>Simpan bukti pendaftaran ini dan Nomor Registrasi <strong>${reg.registration_number}</strong> sebagai dokumen resmi siswa.</li>
          </ol>

          <p style="margin: 0 0 8px 0; font-size: 14px; color: #475569; line-height: 1.6;">
            Selamat bergabung dalam keluarga besar ${SCHOOL_NAME}. Semoga ananda menjadi putra/putri yang sholeh/sholehah, berakhlak mulia, cerdas, dan berprestasi.
          </p>
        </div>
        
        <div style="background-color: #f1f5f9; padding: 20px 24px; text-align: center; border-top: 1px solid #e2e8f0;">
          <p style="margin: 0; font-size: 12px; color: #64748b;">
            Informasi lebih lanjut, silakan hubungi Panitia SPMB: <strong>${waContact}</strong>
          </p>
          <p style="margin: 6px 0 0 0; font-size: 11px; color: #94a3b8;">
            &copy; ${new Date().getFullYear()} ${SCHOOL_NAME}. All rights reserved.
          </p>
        </div>
      </div>
    `

    const sendRes = await resend.emails.send({
      from: SENDER_EMAIL,
      to: recipientEmail,
      replyTo: 'admin@miattaqwa15.sch.id',
      subject: `[DITERIMA] Pengumuman Kelulusan SPMB MI Attaqwa 15 - ${reg.student_name} (${reg.registration_number})`,
      html: approvalHtml
    })

    console.log(`[SPMB Email] Approval email successfully sent to ${recipientEmail} (ID: ${sendRes.data?.id})`)

    // Optional WA Notification
    const phone = getParentPhone(reg)
    if (phone) {
      try {
        const waText = `*SELAMAT! PENDAFTARAN SPMB DITERIMA*\n*${SCHOOL_NAME}*\n\nAlhamdulillah, calon siswa atas nama:\n\n• *Nama Siswa:* ${reg.student_name}\n• *No. Registrasi:* ${reg.registration_number}\n• *Program:* ${programLabel}\n• *T.A:* ${academicYear}\n\n*DINYATAKAN DITERIMA* di ${SCHOOL_NAME}.\n\nSurat pengumuman kelulusan resmi telah dikirim ke email *${recipientEmail}*.\n\nCek status resmi: https://miattaqwa15.sch.id/spmb-app\n\nSelamat bergabung di madrasah kami!`
        await sendWhatsAppMessage(phone, waText)
      } catch (waErr) {
        // Non-blocking
      }
    }

    return { success: true, id: sendRes.data?.id }
  } catch (err: any) {
    console.error(`[SPMB Email] Failed to send approval email to ${recipientEmail}:`, err.message || err)
    return { success: false, error: err.message }
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// 3. REJECTION EMAIL (PENGUMUMAN BELUM DAPAT DITERIMA / DITOLAK)
// ═══════════════════════════════════════════════════════════════════════════
export async function sendSpmbRejectionEmail(params: {
  registration: any
  adminNotes?: string
  settings?: any
}) {
  const { registration: reg, adminNotes, settings } = params
  const resend = getResendClient()
  const recipientEmail = getParentEmail(reg)
  const academicYear = reg.academic_year || settings?.academic_year || '2027/2028'
  const parentName = reg.father_name || reg.mother_name || 'Bapak/Ibu Orang Tua'
  const waContact = settings?.whatsapp_contact || '+62 812-3456-7890'

  if (!resend) {
    console.warn('[SPMB Email] RESEND_API_KEY not configured, skipping rejection email')
    return { success: false, error: 'RESEND_API_KEY not configured' }
  }

  if (!recipientEmail) {
    console.warn(`[SPMB Email] Cannot send rejection email: No email address found for ${reg.registration_number}`)
    return { error: 'No recipient email' }
  }

  try {
    const rejectionHtml = `
      <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 620px; margin: 0 auto; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 20px; overflow: hidden; color: #1e293b;">
        <div style="background: linear-gradient(135deg, #334155 0%, #1e293b 100%); padding: 36px 30px; text-align: center;">
          <span style="display: inline-block; background-color: #f1f5f9; color: #334155; font-size: 11px; font-weight: 800; padding: 4px 14px; border-radius: 999px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px;">PENGUMUMAN SELEKSI SPMB</span>
          <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">Pemberitahuan Status Pendaftaran</h1>
          <p style="color: #94a3b8; margin: 8px 0 0 0; font-size: 14px;">${SCHOOL_NAME} ${SCHOOL_LOCATION}</p>
        </div>
        
        <div style="padding: 32px 28px; background-color: #ffffff;">
          <p style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.6;">
            Yth. Bapak/Ibu <strong>${parentName}</strong>,
          </p>
          <p style="margin: 0 0 20px 0; font-size: 15px; line-height: 1.6; color: #475569;">
            Terima kasih yang sebesar-besarnya atas minat dan kepercayaan Bapak/Ibu yang telah mendaftarkan calon siswa atas nama <strong>${reg.student_name}</strong> (No. Registrasi: <strong>${reg.registration_number}</strong>) pada SPMB Tahun Ajaran ${academicYear}.
          </p>
          
          <!-- Status Card -->
          <div style="background-color: #fff1f2; border: 1.5px solid #fecdd3; border-radius: 16px; padding: 22px; margin-bottom: 24px; text-align: center;">
            <span style="font-size: 12px; font-weight: 700; color: #9f1239; text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 4px;">STATUS SELEKSI AKHIR</span>
            <span style="font-size: 18px; font-weight: 900; color: #be123c; display: block; margin-bottom: 4px;">BELUM DAPAT DITERIMA</span>
            <span style="font-size: 13px; color: #881337; display: block;">Tahun Ajaran ${academicYear}</span>
            ${adminNotes ? `
              <div style="margin-top: 12px; padding-top: 10px; border-top: 1px dashed #fda4af; font-size: 13px; color: #9f1239; text-align: left;">
                <strong>Catatan Panitia:</strong><br/>
                ${adminNotes}
              </div>
            ` : ''}
          </div>

          <p style="margin: 0 0 16px 0; font-size: 14px; color: #475569; line-height: 1.6;">
            Mengingat keterbatasan daya tampung dan kuota rombel kelas yang tersedia, dengan berat hati kami sampaikan bahwa ananda belum dapat kami terima pada periode seleksi ini.
          </p>

          <p style="margin: 0 0 20px 0; font-size: 14px; color: #475569; line-height: 1.6;">
            Kami mendoakan ananda senantiasa diberikan kemudahan dan kelancaran untuk menuntut ilmu di tempat terbaik, serta tumbuh menjadi generasi yang beriman dan berprestasi.
          </p>
        </div>
        
        <div style="background-color: #f1f5f9; padding: 20px 24px; text-align: center; border-top: 1px solid #e2e8f0;">
          <p style="margin: 0; font-size: 12px; color: #64748b;">
            Pertanyaan seputar SPMB? Hubungi Panitia WhatsApp: <strong>${waContact}</strong>
          </p>
          <p style="margin: 6px 0 0 0; font-size: 11px; color: #94a3b8;">
            &copy; ${new Date().getFullYear()} ${SCHOOL_NAME}. All rights reserved.
          </p>
        </div>
      </div>
    `

    const sendRes = await resend.emails.send({
      from: SENDER_EMAIL,
      to: recipientEmail,
      replyTo: 'admin@miattaqwa15.sch.id',
      subject: `[SPMB ${academicYear}] Pemberitahuan Hasil Seleksi - ${reg.student_name} (${reg.registration_number})`,
      html: rejectionHtml
    })

    console.log(`[SPMB Email] Rejection notice email successfully sent to ${recipientEmail} (ID: ${sendRes.data?.id})`)

    // Optional WA Notification
    const phone = getParentPhone(reg)
    if (phone) {
      try {
        const waText = `*PEMBERITAHUAN SELEKSI SPMB ${academicYear}*\n*${SCHOOL_NAME}*\n\nYth. Bapak/Ibu Orang Tua dari *${reg.student_name}* (No. Reg: ${reg.registration_number}),\n\nTerima kasih atas partisipasi Anda dalam SPMB ${SCHOOL_NAME}. Mengingat keterbatasan kuota penerimaan siswa baru, kami menginformasikan bahwa ananda belum dapat diterima pada periode pendaftaran ini.\n\nSurat pemberitahuan resmi telah dikirim ke email *${recipientEmail}*.\n\nSemoga ananda sukses di tempat belajar terbaik. Terima kasih.`
        await sendWhatsAppMessage(phone, waText)
      } catch (waErr) {
        // Non-blocking
      }
    }

    return { success: true, id: sendRes.data?.id }
  } catch (err: any) {
    console.error(`[SPMB Email] Failed to send rejection email to ${recipientEmail}:`, err.message || err)
    return { success: false, error: err.message }
  }
}
