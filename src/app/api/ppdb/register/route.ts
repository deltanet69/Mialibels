// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { getAdminSupabase } from '@/lib/supabase'
import { sendSpmbRegistrationEmail } from '@/lib/spmb-email'
import { getSession } from '@/lib/session'
import { canManageSpmb } from '@/lib/rbac'
import { getOpenAtMs, applyAutoOpen } from '@/lib/spmb-settings'
import { parseRegistration, isFulldayRow } from '@/lib/spmb-registration'

export const runtime = 'nodejs'

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

    const ppdbSettings = (settings && (await applyAutoOpen(supabase, settings))) || {
      academic_year: '2027/2028',
      is_active: false,
      active_batch: 1,
      batch_1_quota: 150,
      registration_fee: 300000,
    }

    // Admin (sesi valid + hak kelola SPMB) boleh mendaftarkan walau portal publik ditutup;
    // kuota tetap berlaku.
    const session = body.by_admin ? await getSession() : null
    const byAdmin = !!session && canManageSpmb(session.role)
    if (body.by_admin && !byAdmin) {
      return NextResponse.json({ error: 'Akses ditolak. Anda tidak memiliki izin untuk mendaftarkan siswa.' }, { status: 403 })
    }

    if (!byAdmin && !ppdbSettings.is_active) {
      return NextResponse.json({
        error: 'Pendaftaran SPMB Tahun Ajaran ' + ppdbSettings.academic_year + ' saat ini sedang ditutup.'
      }, { status: 403 })
    }

    if (!byAdmin && Date.now() < getOpenAtMs(ppdbSettings.open_at)) {
      return NextResponse.json({ error: 'Pendaftaran SPMB belum dibuka. Silakan kembali pada waktu pembukaan.' }, { status: 403 })
    }

    // 2-4. Validasi input + usia (logika bersama dengan edit admin)
    const parsed = parseRegistration(body)
    if ('error' in parsed) {
      return NextResponse.json({ error: parsed.error }, { status: 400 })
    }
    const { isFullday, fields } = parsed

    // 5. Check Quota: Total Quota (150) & Class Quotas (Fullday 75, Regular 75)
    const { data: existingRegs, count: totalCount } = await supabase
      .from('ppdb_registrations')
      .select('student_nickname, special_needs, status', { count: 'exact' })
      .eq('academic_year', ppdbSettings.academic_year)

    // totalCount (termasuk yang ditolak) tetap dipakai untuk nomor urut agar tidak bentrok;
    // kuota hanya menghitung yang tidak ditolak.
    const activeRegs = (existingRegs || []).filter((r: any) => r.status !== 'rejected')
    const totalRegistered = activeRegs.length
    const totalQuota = Number(ppdbSettings.batch_1_quota) || 150
    const fulldayQuota = 75
    const regularQuota = 75

    if (totalRegistered >= totalQuota) {
      return NextResponse.json({
        error: `Pendaftaran SPMB Tahun Ajaran ${ppdbSettings.academic_year} telah ditutup karena kuota penerimaan (${totalQuota} siswa) telah terpenuhi.`
      }, { status: 400 })
    }

    const fulldayCount = activeRegs.filter(isFulldayRow).length
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
    let sequence = (totalCount || 0) + 1
    let regNumber = `MI2027${String(sequence).padStart(3, '0')}`

    // 7. Temporary password
    const tempPassword = `MIA${Math.floor(100000 + Math.random() * 900000)}`

    // 8. Prepare Database Payload (using existing columns safely)
    const insertPayload = {
      registration_number: regNumber,
      academic_year: ppdbSettings.academic_year || '2027/2028',
      batch: 1, // Single period
      assigned_batch: 1,
      ...fields,
      documents_submitted_at: new Date().toISOString(),
      payment_amount: Number(ppdbSettings.registration_fee) || 300000,
      payment_status: 'pending',
      status: 'pending_verification',
      parent_password_hash: tempPassword,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    // Simpan pendaftaran. Bila nomor registrasi tabrakan dengan pendaftaran
    // lain yang masuk di detik yang sama (unique violation), naikkan nomor
    // urut dan coba lagi — jangan sampai pendaftaran orang tua gagal total.
    let newReg: any = null
    let insertError: any = null
    for (let attempt = 0; attempt < 5; attempt++) {
      insertPayload.registration_number = regNumber
      const res = await supabase
        .from('ppdb_registrations')
        .insert(insertPayload)
        .select()
        .single()
      newReg = res.data
      insertError = res.error
      if (!insertError) break
      const isDuplicate = insertError.code === '23505' || /duplicate|unique/i.test(insertError.message || '')
      if (!isDuplicate) break
      sequence += 1
      regNumber = `MI2027${String(sequence).padStart(3, '0')}`
    }

    if (insertError) {
      console.error('Error inserting SPMB registration:', insertError)
      return NextResponse.json({ error: 'Gagal menyimpan pendaftaran: ' + insertError.message }, { status: 500 })
    }

    // Catat ke log aktivitas admin (non-blocking: kegagalan log tidak boleh
    // menggagalkan pendaftaran yang sudah tersimpan).
    try {
      await supabase.from('activity_logs').insert({
        admin_id: byAdmin ? session.id : null,
        admin_name: byAdmin ? session.name : 'SPMB Online',
        action: 'CREATE',
        resource: 'spmb_registration',
        description: `Pendaftaran SPMB baru ${regNumber} — ${insertPayload.student_name} (${isFullday ? 'Fullday' : 'Regular'}) ${byAdmin ? 'via admin' : 'via formulir online'}, status pending_verification.`
      })
    } catch (logErr) {
      console.warn('[SPMB Register] Gagal menulis activity_logs:', logErr)
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
