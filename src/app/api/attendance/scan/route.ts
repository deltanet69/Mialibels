import { NextRequest, NextResponse } from 'next/server'
import { supabase, withTimeout } from '@/lib/supabase'
import { 
  TEACHER_ATTENDANCE_CONFIG, 
  determineTeacherShift, 
  evaluateTeacherCheckIn 
} from '@/config/attendanceRules'
import { generateRfidVariants } from '@/lib/rfidUtils'

// In-memory deduplication cache: Cegah scan ganda dalam interval 2.5 detik
const recentStaffScanCache = new Map<string, { timestamp: number; response: any }>()
const DEDUPLICATION_WINDOW_MS = 2500

// Fast in-memory cache for teacher schedule lookup (5 mins TTL) to reduce database load during peak scan hours
const teacherScheduleCache = new Map<string, { timestamp: number; schedules: any[] }>()
const SCHEDULE_CACHE_TTL = 5 * 60 * 1000

async function getTeacherSchedules(teacherId: string) {
  const cached = teacherScheduleCache.get(teacherId)
  if (cached && Date.now() - cached.timestamp < SCHEDULE_CACHE_TTL) {
    return cached.schedules
  }

  const [{ data: schedulesData }, { data: homeroomClassrooms }] = await withTimeout(
    Promise.all([
      supabase
        .from('classroom_schedules')
        .select('id, day, time, classroom_id, classroom:classrooms(id, name, level)')
        .eq('teacher_id', teacherId),
      supabase
        .from('classrooms')
        .select('id, name, level')
        .eq('homeroom_teacher_id', teacherId)
    ]),
    5000,
    'Pencarian jadwal guru timeout (5s)'
  )

  const allTeacherSchedules = [
    ...((schedulesData as any[]) || []),
    ...((homeroomClassrooms as any[]) || []).map((c: any) => ({
      day: '',
      time: '',
      classroom: { name: c.name },
      classroom_name: c.name
    }))
  ]

  teacherScheduleCache.set(teacherId, {
    timestamp: Date.now(),
    schedules: allTeacherSchedules
  })

  return allTeacherSchedules
}

async function processSingleScan(rfid: string, now: number) {
  const cleanRfid = String(rfid).trim().toUpperCase()

  // 0. Cek deduplikasi scan ganda
  const lastScan = recentStaffScanCache.get(cleanRfid)
  if (lastScan && now - lastScan.timestamp < DEDUPLICATION_WINDOW_MS) {
    return lastScan.response
  }

  // 1. Find staff by multi-format RFID variants
  const rfidVariants = generateRfidVariants(cleanRfid)

  const staffQuery = supabase
    .from('staffs')
    .select('id, name, position, rfid, image, is_active')
    .in('rfid', rfidVariants)
    .eq('is_active', true)
    .limit(1)

  const { data: staffsData, error: staffError } = await withTimeout(
    staffQuery,
    5000,
    'Pencarian guru aktif timeout (5s)'
  )

  if (staffError) throw staffError

  const staffs = (staffsData as any[]) || []

  if (staffs.length === 0) {
    return { 
      success: false, 
      error: `Kartu RFID/NFC (${cleanRfid}) belum terdaftar pada data guru/staf aktif.` 
    }
  }

  const staff: any = staffs[0]
  
  // Get today's date in local YYYY-MM-DD (WIB UTC+7)
  const today = new Date()
  const offset = 7 * 60 * 60 * 1000
  const localDate = new Date(today.getTime() + offset)
  const dateStr = localDate.toISOString().split('T')[0]
  const nowIso = new Date().toISOString()

  const hours = localDate.getUTCHours()
  const mins = localDate.getUTCMinutes()
  const currentTimeStr = `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`

  const daysIndo = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
  const todayDayName = daysIndo[localDate.getUTCDay()]

  // Fetch schedules & homeroom class from memory cache / fast query
  const allTeacherSchedules = await getTeacherSchedules(staff.id)

  // Determine shift (Pagi vs Siang vs Khusus)
  const shiftData = determineTeacherShift(staff, allTeacherSchedules as any, todayDayName)
  let shiftConfig: any = TEACHER_ATTENDANCE_CONFIG.MORNING_SHIFT
  if (shiftData.shift === 'Siang') {
    shiftConfig = TEACHER_ATTENDANCE_CONFIG.AFTERNOON_SHIFT
  } else if (shiftData.shift === 'Khusus') {
    shiftConfig = TEACHER_ATTENDANCE_CONFIG.SPECIAL_SHIFT
  }

  // 2. Check existing attendance for today
  const checkQuery = supabase
    .from('staff_attendance')
    .select('id, staff_id, date, status, notes, check_in_time, check_out_time')
    .eq('staff_id', staff.id)
    .eq('date', dateStr)
    .limit(1)

  const { data: existingRecords, error: checkError } = await withTimeout(
    checkQuery,
    5000,
    'Pengecekan absensi guru timeout (5s)'
  )

  if (checkError) throw checkError

  const existingRecord: any = (existingRecords as any[]) && (existingRecords as any[]).length > 0 ? (existingRecords as any[])[0] : null

  if (!existingRecord) {
    // 3. Check IN: Evaluasi shift dan keterlambatan
    const checkInEval = evaluateTeacherCheckIn(shiftData, hours, mins)

    const insertQuery = supabase
      .from('staff_attendance')
      .insert({
        staff_id: staff.id,
        date: dateStr,
        status: checkInEval.status,
        notes: checkInEval.notes,
        check_in_time: nowIso,
        updated_at: nowIso
      } as any)
      .select('id, staff_id, date, status, notes, check_in_time, check_out_time')
      .single()

    const { data: newRecord, error: insertError } = await withTimeout(
      insertQuery,
      5000,
      'Penyimpanan absen masuk guru timeout (5s)'
    )

    if (insertError) throw insertError

    const msg = checkInEval.isLate
      ? `Absen Masuk [Datang Terlambat] (${currentTimeStr} WIB - ${shiftConfig.name}): ${staff.name}`
      : `Absen Masuk [Tepat Waktu] (${currentTimeStr} WIB - ${shiftConfig.name}): ${staff.name}`

    const successResp = { 
      success: true, 
      action: 'check-in', 
      status: checkInEval.status,
      is_late: checkInEval.isLate,
      shift: shiftData.shift,
      message: msg,
      data: newRecord,
      staff: {
        ...staff,
        status: checkInEval.status,
        is_late: checkInEval.isLate,
        shift: shiftData.shift
      }
    }

    recentStaffScanCache.set(cleanRfid, { timestamp: now, response: successResp })
    return successResp
  } else {
    // 4. Check OUT or Already checked out
    if (existingRecord.check_out_time) {
      const checkedOutResp = { 
        success: false, 
        action: 'already-checked-out',
        error: `${staff.name} sudah melakukan Absen Pulang hari ini.` 
      }
      recentStaffScanCache.set(cleanRfid, { timestamp: now, response: checkedOutResp })
      return checkedOutResp
    } else {
      // Validasi minimal jam pulang berdasarkan shift
      const currentMinutes = hours * 60 + mins
      const minCheckoutMinutes = shiftConfig.CHECKOUT_MIN_TIME.hours * 60 + shiftConfig.CHECKOUT_MIN_TIME.minutes

      if (currentMinutes < minCheckoutMinutes) {
        const earlyResp = {
          success: false,
          action: 'too-early-checkout',
          error: `${staff.name} (${staff.position || 'Guru'}) - Belum waktunya absen pulang ${shiftConfig.name} (Minimal pukul ${shiftConfig.CHECKOUT_MIN_TIME.timeString} WIB)`
        }
        recentStaffScanCache.set(cleanRfid, { timestamp: now, response: earlyResp })
        return earlyResp
      }

      // Do Check OUT
      const updateQuery = (supabase
        .from('staff_attendance') as any)
        .update({
          check_out_time: nowIso,
          updated_at: nowIso
        })
        .eq('id', existingRecord.id)
        .select()
        .single()

      const { data: updateRecord, error: updateError }: any = await withTimeout(
        updateQuery,
        5000,
        'Penyimpanan absen pulang guru timeout (5s)'
      )

      if (updateError) throw updateError

      const outResp = { 
        success: true, 
        action: 'check-out', 
        message: `Berhasil Absen Pulang (${currentTimeStr} WIB): ${staff.name}`,
        data: updateRecord,
        staff: staff
      }

      recentStaffScanCache.set(cleanRfid, { timestamp: now, response: outResp })
      return outResp
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const { rfid, rfids } = await request.json()

    if (Array.isArray(rfids) && rfids.length > 0) {
      const now = Date.now()
      const results = []
      
      for (const singleRfid of rfids) {
        if (!singleRfid) continue
        try {
          const res = await processSingleScan(singleRfid, now)
          results.push({ rfid: singleRfid, ...res })
        } catch (e: any) {
          results.push({ rfid: singleRfid, success: false, error: e.message || 'Terjadi kesalahan' })
        }
      }
      
      return NextResponse.json({ success: true, batch: true, results })
    }

    if (!rfid) {
      return NextResponse.json({ success: false, error: 'RFID is required' }, { status: 400 })
    }

    const now = Date.now()
    const result = await processSingleScan(rfid, now)
    
    if (!result.success && result.error && result.error.includes('belum terdaftar')) {
      return NextResponse.json(result, { status: 404 })
    }
    
    return NextResponse.json(result)

  } catch (error: any) {
    console.error('Error in RFID scan:', error)
    return NextResponse.json({ success: false, error: error.message || 'Terjadi kesalahan internal pada server.' }, { status: 500 })
  }
}


