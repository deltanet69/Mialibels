import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  supabaseServiceKey
)

export async function POST(request: NextRequest) {
  try {
    const { rfid, className } = await request.json()

    if (!rfid) {
      return NextResponse.json({ success: false, error: 'RFID is required' }, { status: 400 })
    }

    // 1. Find student by RFID
    const { data: students, error: studentError } = await supabase
      .from('students')
      .select('*')
      .eq('rfid_number', rfid)
      .eq('is_active', true)
      .limit(1)

    if (studentError) throw studentError

    if (!students || students.length === 0) {
      return NextResponse.json({ success: false, error: 'Kartu tidak dikenali atau siswa tidak aktif.' }, { status: 404 })
    }

    const student = students[0]
    
    // Check if class matches the device class
    const studentClassRaw = (student.class || '').replace(/\s+/g, '').toLowerCase() // "Kelas 1B" -> "kelas1b"
    const deviceClassRaw = (className || '').toLowerCase().replace(/\s+/g, '') // "1a", "kelas1", "1bcd"
    
    let isClassAllowed = false
    if (deviceClassRaw === 'kelas1' || deviceClassRaw === '1' || deviceClassRaw === '1bcd') {
      // Allow Grade 1 students (1B, 1C, 1D, 1A)
      isClassAllowed = studentClassRaw.includes('1b') || 
                       studentClassRaw.includes('1c') || 
                       studentClassRaw.includes('1d') || 
                       studentClassRaw.includes('1a') || 
                       studentClassRaw.includes('kelas1') ||
                       studentClassRaw.startsWith('1')
    } else {
      isClassAllowed = studentClassRaw.includes(deviceClassRaw)
    }
    
    if (!isClassAllowed) {
       return NextResponse.json({ success: false, error: `Siswa ${student.name} dari (${student.class}) tidak diizinkan di mesin absensi ini.` }, { status: 403 })
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
    const { data: existingRecords, error: checkError } = await supabase
      .from('student_attendances')
      .select('*')
      .eq('student_id', student.id)
      .eq('date', dateStr)
      .limit(1)

    if (checkError) throw checkError

    const existingRecord = existingRecords && existingRecords.length > 0 ? existingRecords[0] : null

    if (!existingRecord) {
      // 3. Check IN: Siswa diatas jam 07:00 pagi status "Terlambat"
      const isLate = hours > 7 || (hours === 7 && mins > 0)
      const status = isLate ? 'Terlambat' : 'Hadir'

      const { data: newRecord, error: insertError } = await supabase
        .from('student_attendances')
        .insert({
          student_id: student.id,
          date: dateStr,
          status: status,
          entry_time: currentTimeStr,
        })
        .select()
        .single()

      if (insertError) throw insertError

      const msg = isLate 
        ? `Absen Masuk (Terlambat ${currentTimeStr}): ${student.name}` 
        : `Berhasil Absen Masuk (${currentTimeStr}): ${student.name}`

      return NextResponse.json({ 
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
      })
    } else {
      // 4. Check OUT
      if (existingRecord.exit_time) {
        return NextResponse.json({ 
          success: false, 
          action: 'already-checked-out',
          error: `${student.name} sudah melakukan Absen Pulang hari ini.` 
        }, { status: 400 })
      } else {
        // Validate exit time (>= 10:30)
        if (hours < 10 || (hours === 10 && mins < 30)) {
           return NextResponse.json({ 
             success: false, 
             action: 'early-checkout',
             error: `Belum waktunya pulang untuk kelas 1 (Minimal jam 10:30)` 
           }, { status: 400 })
        }

        const { data: updateRecord, error: updateError } = await supabase
          .from('student_attendances')
          .update({
            exit_time: currentTimeStr,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingRecord.id)
          .select()
          .single()

        if (updateError) throw updateError

        return NextResponse.json({ 
          success: true, 
          action: 'check-out', 
          status: existingRecord.status || 'Hadir',
          exit_time: currentTimeStr,
          message: `Berhasil Absen Pulang (${currentTimeStr}): ${student.name}`,
          data: updateRecord,
          student: {
            ...student,
            exit_time: currentTimeStr
          }
        })
      }
    }
  } catch (error: any) {
    console.error('Attendance Scan Error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
