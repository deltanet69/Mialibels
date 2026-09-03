// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { ATTENDANCE_CONFIG } from '@/config/attendanceRules'

const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  supabaseServiceKey
)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0]
    const classId = searchParams.get('classId') || 'ALL'
    const month = searchParams.get('month') ? parseInt(searchParams.get('month')!, 10) : new Date().getMonth() + 1
    const year = searchParams.get('year') ? parseInt(searchParams.get('year')!, 10) : new Date().getFullYear()

    // Current local time (WIB UTC+7) to determine if lock cutoff (07:15) has passed
    const today = new Date()
    const offset = 7 * 60 * 60 * 1000 // UTC+7
    const localDate = new Date(today.getTime() + offset)
    const todayStr = localDate.toISOString().split('T')[0]
    const currentHours = localDate.getUTCHours()
    const currentMins = localDate.getUTCMinutes()
    const currentMinutes = currentHours * 60 + currentMins
    const cutoffMinutes = ATTENDANCE_CONFIG.LATE_LIMIT.hours * 60 + ATTENDANCE_CONFIG.LATE_LIMIT.minutes

    const isPastDate = date < todayStr
    const isTodayPastCutoff = (date === todayStr) && (currentMinutes > cutoffMinutes)
    const isAfterLockTime = isPastDate || isTodayPastCutoff

    // 1. Fetch all classrooms (only confirmed existing columns)
    const { data: classroomsData, error: classroomsError } = await supabase
      .from('classrooms')
      .select('id, name, homeroom_teacher_id')
      .order('name', { ascending: true })


    if (classroomsError) throw classroomsError

    // 2. Fetch staffs separately and build a lookup map
    const { data: staffsData } = await supabase
      .from('staffs')
      .select('id, name')

    const staffMap: Record<string, string> = {}
    ;(staffsData || []).forEach((s: any) => {
      staffMap[s.id] = s.name || 'Belum Ditentukan'
    })



    // 3. Fetch all active students (filter per class done in JS after)
    const { data: studentsData, error: studentsError } = await supabase
      .from('students')
      .select('id, name, student_number, nisn, gender, class, class_id, is_active')
      .eq('is_active', true)
      .order('name', { ascending: true })

    if (studentsError) throw studentsError

    // 3. Fetch RFID Scans for this date
    const { data: rfidData, error: rfidError } = await supabase
      .from('student_attendances')
      .select('id, student_id, date, entry_time, exit_time, status, notes')
      .eq('date', date)

    if (rfidError) throw rfidError

    // 4. Fetch Classroom manual attendances for this date
    const { data: manualData, error: manualError } = await supabase
      .from('classroom_attendances')
      .select('id, student_id, classroom_id, date, status, reason')
      .eq('date', date)

    if (manualError) throw manualError

    // Map attendances per student
    const rfidMap: Record<string, any> = {}
    rfidData?.forEach(r => { rfidMap[r.student_id] = r })

    const manualMap: Record<string, any> = {}
    manualData?.forEach(m => { manualMap[m.student_id] = m })

    // Merge student attendance records
    let totalPresent = 0
    let totalLate = 0
    let totalIzin = 0
    let totalSakit = 0
    let totalAlpha = 0
    let totalBelum = 0

    const processedStudents = (studentsData || []).map((student) => {
      const rRec = rfidMap[student.id]
      const mRec = manualMap[student.id]

      let status = ''
      let reason = ''
      let entryTime = rRec?.entry_time || null
      let exitTime = rRec?.exit_time || null
      let isManual = false

      if (mRec && mRec.status) {
        status = mRec.status
        reason = mRec.reason || ''
        isManual = true
      } else if (rRec && rRec.status) {
        status = rRec.status
        reason = rRec.notes || ''
      } else if (isAfterLockTime) {
        // Otomatis menjadi Alpha setelah lewat batas 07:15 WIB
        status = 'Alpha'
        reason = 'Tidak melakukan presensi sebelum 07:15 WIB'
      }

      const statusLower = status.toLowerCase()
      const isPresent = statusLower === 'hadir' || statusLower === 'present' || statusLower === 'tepat waktu' || statusLower === 'terlambat'

      if (isPresent) {
        totalPresent++
        if (statusLower === 'terlambat') totalLate++
      } else if (statusLower === 'izin' || statusLower === 'permitted') {
        totalIzin++
      } else if (statusLower === 'sakit' || statusLower === 'sick') {
        totalSakit++
      } else if (statusLower === 'alpha' || statusLower === 'alpa') {
        totalAlpha++
      } else {
        totalBelum++
      }

      // Resolve classroom name
      const classroom = classroomsData?.find(c => c.id === student.class_id)
      const className = classroom ? classroom.name : (student.class || '-')

      return {
        id: student.id,
        name: student.name,
        student_number: student.student_number,
        nisn: student.nisn,
        gender: student.gender,
        class_id: student.class_id,
        class_name: className,
        attendance: {
          status: status || null,
          reason,
          entry_time: entryTime,
          exit_time: exitTime,
          is_present: isPresent,
          is_late: statusLower === 'terlambat',
          is_manual: isManual
        }
      }
    })

    // Compute classroom summary cards
    const classroomsSummary = (classroomsData || []).map((c) => {
      const classStudents = processedStudents.filter(s => s.class_id === c.id)
      const total = classStudents.length
      const present = classStudents.filter(s => s.attendance.is_present).length
      const izin = classStudents.filter(s => (s.attendance.status || '').toLowerCase() === 'izin').length
      const sakit = classStudents.filter(s => (s.attendance.status || '').toLowerCase() === 'sakit').length
      const alpha = classStudents.filter(s => (s.attendance.status || '').toLowerCase() === 'alpha').length
      const belum = total - (present + izin + sakit + alpha)
      const percentage = total > 0 ? Math.round((present / total) * 100) : 0

      const teacherName = c.homeroom_teacher_id ? (staffMap[c.homeroom_teacher_id] || 'Belum Ditentukan') : 'Belum Ditentukan'

      return {
        id: c.id,
        name: c.name,
        slug: c.name.toLowerCase().replace(/\s+/g, '-'),
        homeroom_teacher: teacherName,
        total_students: total,
        present_count: present,
        izin_count: izin,
        sakit_count: sakit,
        alpha_count: alpha,
        belum_count: belum,
        percentage
      }
    })

    // Filter students if specific classId requested
    const filteredStudents = classId === 'ALL'
      ? processedStudents
      : processedStudents.filter(s => s.class_id === classId)

    const totalStudentsCount = studentsData?.length || 0
    const attendancePercentage = totalStudentsCount > 0
      ? Math.round((totalPresent / totalStudentsCount) * 100)
      : 0

    // 5. Compute Monthly Recap per Class (for ranking & comparison)
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`
    const endDate = new Date(year, month, 0).toISOString().split('T')[0]

    const { data: monthClassAtts } = await supabase
      .from('classroom_attendances')
      .select('student_id, classroom_id, status, date')
      .gte('date', startDate)
      .lte('date', endDate)

    const { data: monthRfidAtts } = await supabase
      .from('student_attendances')
      .select('student_id, status, date')
      .gte('date', startDate)
      .lte('date', endDate)

    // Build monthly breakdown per classroom
    const monthlyClassRecap = (classroomsData || []).map((c) => {
      const classStudents = (studentsData || []).filter(s => s.class_id === c.id)
      const studentIds = new Set(classStudents.map(s => s.id))

      const cAtts = (monthClassAtts || []).filter(a => studentIds.has(a.student_id))
      const rAtts = (monthRfidAtts || []).filter(a => studentIds.has(a.student_id))

      // Combine unique dates
      const studentMap: Record<string, Record<string, string>> = {}
      classStudents.forEach(s => { studentMap[s.id] = {} })

      rAtts.forEach(a => {
        if (studentMap[a.student_id]) studentMap[a.student_id][a.date] = a.status || 'Hadir'
      })
      cAtts.forEach(a => {
        if (studentMap[a.student_id] && a.status) studentMap[a.student_id][a.date] = a.status
      })

      let hadir = 0
      let izin = 0
      let sakit = 0
      let alpha = 0
      let totalAttRecords = 0

      Object.values(studentMap).forEach(dates => {
        Object.values(dates).forEach(st => {
          totalAttRecords++
          const s = (st || '').toLowerCase()
          if (s === 'hadir' || s === 'present' || s === 'tepat waktu' || s === 'terlambat') hadir++
          else if (s === 'izin' || s === 'permitted') izin++
          else if (s === 'sakit' || s === 'sick') sakit++
          else if (s === 'alpha' || s === 'alpa') alpha++
        })
      })

      const percentage = totalAttRecords > 0 ? Math.round((hadir / totalAttRecords) * 100) : 0

      return {
        id: c.id,
        name: c.name,
        slug: c.name.toLowerCase().replace(/\s+/g, '-'),
        total_students: classStudents.length,
        total_records: totalAttRecords,
        hadir,
        izin,
        sakit,
        alpha,
        percentage
      }
    }).sort((a, b) => b.percentage - a.percentage)

    return NextResponse.json({
      success: true,
      data: {
        date,
        kpi: {
          total_students: totalStudentsCount,
          total_present: totalPresent,
          total_late: totalLate,
          total_izin: totalIzin,
          total_sakit: totalSakit,
          total_alpha: totalAlpha,
          total_belum: totalBelum,
          percentage: attendancePercentage
        },
        classrooms: classroomsSummary,
        students: filteredStudents,
        monthly_recap: monthlyClassRecap
      }
    })
  } catch (error: any) {
    console.error('Error in students overview route', error)
    return NextResponse.json({ error: 'Terjadi kesalahan internal pada server.', detail: error?.message, code: error?.code }, { status: 500 })
  }
}
