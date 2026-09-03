import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { 
  TEACHER_ATTENDANCE_CONFIG, 
  determineTeacherShift, 
  evaluateTeacherCheckIn 
} from '@/config/attendanceRules'
import { generateRfidVariants } from '@/lib/rfidUtils'

const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  supabaseServiceKey
)

export async function POST(request: NextRequest) {
  try {
    const { rfid } = await request.json()

    if (!rfid) {
      return NextResponse.json({ success: false, error: 'RFID is required' }, { status: 400 })
    }

    // 1. Find staff by multi-format RFID variants (Hex UID, Decimal, Reverse-Byte, etc.)
    const rfidVariants = generateRfidVariants(rfid)

    const { data: staffs, error: staffError } = await supabase
      .from('staffs')
      .select('*')
      .in('rfid', rfidVariants)
      .eq('is_active', true)
      .limit(1)

    if (staffError) throw staffError

    if (!staffs || staffs.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: `Kartu RFID/NFC (${rfid}) belum terdaftar pada data guru/staf aktif.` 
      }, { status: 404 })
    }

    const staff = staffs[0]
    
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

    // Fetch schedules & homeroom class to detect Shift (Pagi vs Siang)
    const [{ data: schedulesData }, { data: homeroomClassrooms }] = await Promise.all([
      supabase
        .from('classroom_schedules')
        .select('id, day, time, classroom_id, classroom:classrooms(id, name, level)')
        .eq('teacher_id', staff.id),
      supabase
        .from('classrooms')
        .select('id, name, level')
        .eq('homeroom_teacher_id', staff.id)
    ])

    const allTeacherSchedules = [
      ...(schedulesData || []),
      ...(homeroomClassrooms || []).map(c => ({
        day: '',
        time: '',
        classroom: { name: c.name },
        classroom_name: c.name
      }))
    ]

    // Determine shift (Pagi vs Siang)
    const shift = determineTeacherShift(staff, allTeacherSchedules as any, todayDayName)
    const shiftConfig = shift === 'Siang' 
      ? TEACHER_ATTENDANCE_CONFIG.AFTERNOON_SHIFT 
      : TEACHER_ATTENDANCE_CONFIG.MORNING_SHIFT

    // 2. Check existing attendance for today
    const { data: existingRecords, error: checkError } = await supabase
      .from('staff_attendance')
      .select('*')
      .eq('staff_id', staff.id)
      .eq('date', dateStr)
      .limit(1)

    if (checkError) throw checkError

    const existingRecord = existingRecords && existingRecords.length > 0 ? existingRecords[0] : null

    if (!existingRecord) {
      // 3. Check IN: Evaluasi shift dan keterlambatan
      const checkInEval = evaluateTeacherCheckIn(shift, hours, mins)

      const { data: newRecord, error: insertError } = await supabase
        .from('staff_attendance')
        .insert({
          staff_id: staff.id,
          date: dateStr,
          status: checkInEval.status,
          notes: checkInEval.notes,
          check_in_time: nowIso,
          updated_at: nowIso
        })
        .select()
        .single()

      if (insertError) throw insertError

      const msg = checkInEval.isLate
        ? `Absen Masuk [Datang Terlambat] (${currentTimeStr} WIB - ${shiftConfig.name}): ${staff.name}`
        : `Absen Masuk [Tepat Waktu] (${currentTimeStr} WIB - ${shiftConfig.name}): ${staff.name}`

      return NextResponse.json({ 
        success: true, 
        action: 'check-in', 
        status: checkInEval.status,
        is_late: checkInEval.isLate,
        shift: shift,
        message: msg,
        data: newRecord,
        staff: {
          ...staff,
          status: checkInEval.status,
          is_late: checkInEval.isLate,
          shift: shift
        }
      })
    } else {
      // 4. Check OUT or Already checked out
      if (existingRecord.check_out_time) {
        return NextResponse.json({ 
          success: false, 
          action: 'already-checked-out',
          error: `${staff.name} sudah melakukan Absen Pulang hari ini.` 
        }, { status: 400 })
      } else {
        // Validasi minimal jam pulang berdasarkan shift
        const currentMinutes = hours * 60 + mins
        const minCheckoutMinutes = shiftConfig.CHECKOUT_MIN_TIME.hours * 60 + shiftConfig.CHECKOUT_MIN_TIME.minutes

        if (currentMinutes < minCheckoutMinutes) {
          return NextResponse.json({
            success: false,
            action: 'too-early-checkout',
            error: `${staff.name} (${staff.position || 'Guru'}) - Belum waktunya absen pulang ${shiftConfig.name} (Minimal pukul ${shiftConfig.CHECKOUT_MIN_TIME.timeString} WIB)`
          }, { status: 400 })
        }

        // Do Check OUT
        const { data: updateRecord, error: updateError } = await supabase
          .from('staff_attendance')
          .update({
            check_out_time: nowIso,
            updated_at: nowIso
          })
          .eq('id', existingRecord.id)
          .select()
          .single()

        if (updateError) throw updateError

        return NextResponse.json({ 
          success: true, 
          action: 'check-out', 
          message: `Berhasil Absen Pulang (${currentTimeStr} WIB): ${staff.name}`,
          data: updateRecord,
          staff: staff
        })
      }
    }

  } catch (error: any) {
    console.error('Error in RFID scan:', error)
    return NextResponse.json({ success: false, error: 'Terjadi kesalahan internal pada server.' }, { status: 500 })
  }
}

