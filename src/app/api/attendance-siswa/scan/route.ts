import { NextRequest, NextResponse } from 'next/server'
import { supabase, withTimeout } from '@/lib/supabase'
import { ATTENDANCE_CONFIG, evaluateStudentCheckIn } from '@/config/attendanceRules'
import { generateRfidVariants } from '@/lib/rfidUtils'
import { createNotification } from '@/lib/push'

// In-memory deduplication cache: Cegah scan ganda dari hardware scanner dalam interval 2.5 detik
const recentScanCache = new Map<string, { timestamp: number; response: any }>()
const DEDUPLICATION_WINDOW_MS = 2500

// Bersihkan cache lama setiap 1 menit
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    for (const [key, val] of recentScanCache.entries()) {
      if (now - val.timestamp > DEDUPLICATION_WINDOW_MS * 2) {
        recentScanCache.delete(key)
      }
    }
  }, 60000)
}

export async function POST(request: NextRequest) {
  try {
    const { rfid, className } = await request.json()

    if (!rfid) {
      return NextResponse.json({ success: false, error: 'RFID is required' }, { status: 400 })
    }

    const cleanRfid = String(rfid).trim().toUpperCase()
    const now = Date.now()

    // 0. Cek deduplikasi scan ganda
    const lastScan = recentScanCache.get(cleanRfid)
    if (lastScan && now - lastScan.timestamp < DEDUPLICATION_WINDOW_MS) {
      // Kembalikan respons yang sama tanpa membebani database
      return NextResponse.json(lastScan.response)
    }

    // 1. Find student by multi-format RFID variants (Hex UID, Decimal, Reverse-Byte, etc.)
    const rfidVariants = generateRfidVariants(cleanRfid)

    const studentQuery = supabase
      .from('students')
      .select('id, name, class, rfid_number, is_active')
      .in('rfid_number', rfidVariants)
      .eq('is_active', true)
      .limit(1)

    const { data: studentsData, error: studentError } = await withTimeout(
      studentQuery,
      5000,
      'Pencarian data siswa timeout (5s)'
    )

    if (studentError) throw studentError

    const students = (studentsData as any[]) || []

    if (students.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: `Kartu RFID/NFC (${cleanRfid}) belum terdaftar pada data siswa aktif.` 
      }, { status: 404 })
    }

    const student: any = students[0]
    
    // Robust class matching normalization
    const cleanClassCode = (raw?: string | null): string => {
      if (!raw) return ''
      return raw
        .toLowerCase()
        .replace(/kelas/g, '')
        .replace(/ruang/g, '')
        .replace(/gedung/g, '')
        .replace(/[^a-z0-9]/g, '')
        .trim()
    }

    const studentClean = cleanClassCode(student.class)
    const deviceClean = cleanClassCode(className)
    const rawClassLower = (className || '').toLowerCase().trim()
    
    let isClassAllowed = false
    let rejectionReason = ''

    // 1. Kiosk Gedung 2 (Kelas 1B, 1C, 1D): /kelas1
    if (rawClassLower === 'kelas1' || deviceClean === 'kelas1' || deviceClean === '1bcd') {
      if (['1b', '1c', '1d'].includes(studentClean)) {
        isClassAllowed = true
      } else if (studentClean === '1a') {
        isClassAllowed = false
        rejectionReason = `Siswa ${student.name} (Kelas 1A) terdaftar di Pos Gedung 1. Silakan lakukan absensi di Pos Kelas 1A.`
      } else {
        isClassAllowed = false
        rejectionReason = `Siswa ${student.name} (${student.class || 'Tanpa Kelas'}) tidak diizinkan di Pos Absensi Gedung 2.`
      }
    }
    // 2. Kiosk Gedung 1 (Kelas 1A): /1a
    else if (deviceClean === '1a' || rawClassLower === '1a') {
      if (studentClean === '1a') {
        isClassAllowed = true
      } else if (['1b', '1c', '1d'].includes(studentClean)) {
        isClassAllowed = false
        rejectionReason = `Siswa ${student.name} (${student.class}) terdaftar di Pos Gedung 2. Silakan lakukan absensi di Pos Kelas 1 (Gedung 2).`
      } else {
        isClassAllowed = false
        rejectionReason = `Siswa ${student.name} (${student.class || 'Tanpa Kelas'}) tidak diizinkan di Pos Absensi Kelas 1A.`
      }
    }
    // 3. Kiosk kelas tunggal lainnya (misal: /2a, /2b, /3a, dll)
    else if (deviceClean) {
      if (studentClean === deviceClean) {
        isClassAllowed = true
      } else {
        isClassAllowed = false
        rejectionReason = `Siswa ${student.name} (${student.class || 'Tanpa Kelas'}) tidak diizinkan di Pos Kelas ${className.toUpperCase()}. Silakan absensi di pos kelas yang sesuai.`
      }
    }
    // 4. Default / Tanpa pembatasan kelas (jika parameter className kosong)
    else {
      isClassAllowed = true
    }
    
    if (!isClassAllowed) {
      return NextResponse.json({ 
        success: false, 
        action: 'wrong-class',
        error: rejectionReason || `Siswa ${student.name} (${student.class}) tidak diizinkan di mesin absensi ini.`,
        student: {
          id: student.id,
          name: student.name,
          class: student.class
        }
      }, { status: 403 })
    }

    // Get today's date in local YYYY-MM-DD (Asia/Jakarta UTC+7)
    const today = new Date()
    const offset = 7 * 60 * 60 * 1000 // UTC+7
    const localDate = new Date(today.getTime() + offset)
    const dateStr = localDate.toISOString().split('T')[0]
    
    // Calculate current time HH:MM
    const hours = localDate.getUTCHours()
    const mins = localDate.getUTCMinutes()
    const currentTimeStr = `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`

    // 2. Check existing attendance for today
    const checkQuery = supabase
      .from('student_attendances')
      .select('id, student_id, date, status, entry_time, exit_time')
      .eq('student_id', student.id)
      .eq('date', dateStr)
      .limit(1)

    const { data: existingRecords, error: checkError } = await withTimeout(
      checkQuery,
      5000,
      'Pengecekan absensi hari ini timeout (5s)'
    )

    if (checkError) throw checkError

    const existingRecord: any = (existingRecords as any[]) && (existingRecords as any[]).length > 0 ? (existingRecords as any[])[0] : null

    if (!existingRecord) {
      // 3. Check IN: Evaluasi aturan jam absensi
      const checkInEval = evaluateStudentCheckIn(hours, mins)

      // Jika absen masuk sudah terkunci (setelah 07:15 WIB)
      if (!checkInEval.allowed) {
        if (checkInEval.status === 'Alpha') {
          await supabase
            .from('student_attendances')
            .insert({
              student_id: student.id,
              date: dateStr,
              status: 'Alpha',
              entry_time: currentTimeStr,
              notes: `Scan ditolak: Lewat batas jam masuk (${currentTimeStr} WIB)`
            } as any)
        }

        const lockResp = {
          success: false,
          action: 'locked',
          status: checkInEval.status,
          error: checkInEval.message,
          student: {
            ...student,
            status: checkInEval.status,
            entry_time: currentTimeStr
          }
        }
        recentScanCache.set(cleanRfid, { timestamp: now, response: lockResp })
        return NextResponse.json(lockResp, { status: 400 })
      }

      // Absen berhasil: Hadir (00:01 - 06:45) atau Terlambat (06:46 - 07:15)
      const status = checkInEval.status
      const isLate = checkInEval.isLate

      const insertQuery = supabase
        .from('student_attendances')
        .insert({
          student_id: student.id,
          date: dateStr,
          status: status,
          entry_time: currentTimeStr,
        } as any)
        .select('id, student_id, date, status, entry_time, exit_time')
        .single()

      const { data: newRecord, error: insertError } = await withTimeout(
        insertQuery,
        5000,
        'Penyimpanan absen masuk timeout (5s)'
      )

      if (insertError) throw insertError

      const msg = isLate 
        ? `Absen Masuk [Terlambat Datang] (${currentTimeStr}): ${student.name}` 
        : `Absen Masuk [Tepat Waktu] (${currentTimeStr}): ${student.name}`

      // Non-blocking fire-and-forget push notification (doesn't delay the RFID response)
      createNotification(
        student.id,
        'parent',
        'ATTENDANCE',
        'Info Kehadiran',
        msg,
        '/parent/dashboard/attendance',
        true
      ).catch((err) => console.error('Background Push Notif Error:', err))

      const successResp = { 
        success: true, 
        action: 'check-in', 
        status: status,
        is_late: isLate,
        entry_time: currentTimeStr,
        message: msg,
        data: newRecord,
        student: {
          ...student,
          status,
          is_late: isLate,
          entry_time: currentTimeStr
        }
      }

      recentScanCache.set(cleanRfid, { timestamp: now, response: successResp })
      return NextResponse.json(successResp)
    } else {
      // 4. Check OUT
      if (existingRecord.status === 'Alpha') {
        const alphaResp = { 
          success: false, 
          action: 'locked',
          error: `${student.name} tercatat Alpha (tidak absen masuk sebelum ${ATTENDANCE_CONFIG.LATE_LIMIT.timeString} WIB).` 
        }
        recentScanCache.set(cleanRfid, { timestamp: now, response: alphaResp })
        return NextResponse.json(alphaResp, { status: 400 })
      }

      if (existingRecord.exit_time) {
        const checkedOutResp = { 
          success: false, 
          action: 'already-checked-out',
          error: `${student.name} sudah melakukan Absen Pulang hari ini.` 
        }
        recentScanCache.set(cleanRfid, { timestamp: now, response: checkedOutResp })
        return NextResponse.json(checkedOutResp, { status: 400 })
      } else {
        // Validate exit time (Minimal jam CHECKOUT_MIN_TIME, default 10:30)
        const currentMinutes = hours * 60 + mins
        const minCheckoutMinutes = ATTENDANCE_CONFIG.CHECKOUT_MIN_TIME.hours * 60 + ATTENDANCE_CONFIG.CHECKOUT_MIN_TIME.minutes

        if (currentMinutes < minCheckoutMinutes) {
           const earlyResp = { 
             success: false, 
             action: 'early-checkout',
             error: `Belum waktunya absen pulang (Minimal pukul ${ATTENDANCE_CONFIG.CHECKOUT_MIN_TIME.timeString} WIB)` 
           }
           recentScanCache.set(cleanRfid, { timestamp: now, response: earlyResp })
           return NextResponse.json(earlyResp, { status: 400 })
        }

        const updateQuery = (supabase
          .from('student_attendances') as any)
          .update({
            exit_time: currentTimeStr,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingRecord.id)
          .select('id, student_id, date, status, entry_time, exit_time')
          .single()

        const { data: updateRecord, error: updateError }: any = await withTimeout(
          updateQuery,
          5000,
          'Penyimpanan absen pulang timeout (5s)'
        )

        if (updateError) throw updateError

        const msg = `Berhasil Absen Pulang (${currentTimeStr}): ${student.name}`
        
        // Non-blocking fire-and-forget push notification
        createNotification(
          student.id,
          'parent',
          'ATTENDANCE',
          'Info Kepulangan',
          msg,
          '/parent/dashboard/attendance',
          true
        ).catch((err) => console.error('Background Push Notif Error:', err))

        const outResp = { 
          success: true, 
          action: 'check-out', 
          status: existingRecord.status || 'Hadir',
          exit_time: currentTimeStr,
          message: msg,
          data: updateRecord,
          student: {
            ...student,
            exit_time: currentTimeStr
          }
        }

        recentScanCache.set(cleanRfid, { timestamp: now, response: outResp })
        return NextResponse.json(outResp)
      }
    }
  } catch (error: any) {
    console.error('Attendance Scan Error:', error)
    return NextResponse.json({ success: false, error: error.message || 'Terjadi kesalahan saat memproses absensi' }, { status: 500 })
  }
}

