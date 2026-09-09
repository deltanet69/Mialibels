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
    const viewMode = searchParams.get('viewMode') || 'daily' // 'daily' | 'weekly' | 'monthly'
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0]
    const classId = searchParams.get('classId') || 'ALL'
    const month = searchParams.get('month') ? parseInt(searchParams.get('month')!, 10) : new Date().getMonth() + 1
    const year = searchParams.get('year') ? parseInt(searchParams.get('year')!, 10) : new Date().getFullYear()

    // 1. Current local time (WIB UTC+7) to determine if lock cutoff (07:15) has passed
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

    // 2. Compute date bounds based on viewMode
    let startDate = date
    let endDate = date
    let weekDays: { date: string; dayName: string; dayLabel: string }[] = []

    if (viewMode === 'weekly') {
      const d = new Date(date + 'T00:00:00Z')
      const dayOfWeek = d.getUTCDay() // 0 = Sun, 1 = Mon ... 6 = Sat
      const diffToMon = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
      const monDate = new Date(d)
      monDate.setUTCDate(d.getUTCDate() + diffToMon)

      const dayNames = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
      weekDays = dayNames.map((name, i) => {
        const cur = new Date(monDate)
        cur.setUTCDate(monDate.getUTCDate() + i)
        const dStr = cur.toISOString().split('T')[0]
        const dParts = dStr.split('-')
        return {
          date: dStr,
          dayName: name,
          dayLabel: `${name} (${dParts[2]}/${dParts[1]})`
        }
      })

      startDate = weekDays[0].date
      endDate = weekDays[weekDays.length - 1].date
    } else if (viewMode === 'monthly') {
      startDate = `${year}-${String(month).padStart(2, '0')}-01`
      const lastDay = new Date(year, month, 0).getDate()
      endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
    }

    // 3. Fetch Master Reference Data (Classrooms, Staffs, Students)
    const [
      { data: classroomsData, error: classroomsError },
      { data: staffsData, error: staffsError },
      { data: studentsData, error: studentsError }
    ] = await Promise.all([
      supabase.from('classrooms').select('id, name, homeroom_teacher_id').order('name', { ascending: true }),
      supabase.from('staffs').select('id, name'),
      supabase.from('students').select('id, name, student_number, nisn, class, class_id, is_active').eq('is_active', true).order('name', { ascending: true })
    ])

    if (classroomsError) throw classroomsError
    if (studentsError) throw studentsError

    const staffMap: Record<string, string> = {}
    ;(staffsData || []).forEach((s: any) => {
      staffMap[s.id] = s.name || 'Belum Ditentukan'
    })

    // 4. Fetch Attendances in date range (RFID + Manual Classroom)
    const [
      { data: rfidData, error: rfidError },
      { data: manualData, error: manualError }
    ] = await Promise.all([
      supabase
        .from('student_attendances')
        .select('id, student_id, date, entry_time, exit_time, status')
        .gte('date', startDate)
        .lte('date', endDate),
      supabase
        .from('classroom_attendances')
        .select('id, student_id, classroom_id, date, status, reason')
        .gte('date', startDate)
        .lte('date', endDate)
    ])

    if (rfidError) throw rfidError
    if (manualError) throw manualError

    // 5. Structure Attendance Maps for fast lookups
    // Lookup: studentMap[studentId][date] = { status, entry_time, exit_time, is_manual, reason }
    const studentAttendanceMatrix: Record<string, Record<string, any>> = {}
    ;(studentsData || []).forEach((s) => {
      studentAttendanceMatrix[s.id] = {}
    })

    ;(rfidData || []).forEach((r) => {
      if (!studentAttendanceMatrix[r.student_id]) studentAttendanceMatrix[r.student_id] = {}
      studentAttendanceMatrix[r.student_id][r.date] = {
        status: r.status || 'Hadir',
        entry_time: r.entry_time,
        exit_time: r.exit_time,
        is_manual: false,
        reason: ''
      }
    })

    ;(manualData || []).forEach((m) => {
      if (!studentAttendanceMatrix[m.student_id]) studentAttendanceMatrix[m.student_id] = {}
      const existing = studentAttendanceMatrix[m.student_id][m.date]
      studentAttendanceMatrix[m.student_id][m.date] = {
        status: m.status || existing?.status || 'Hadir',
        entry_time: existing?.entry_time || null,
        exit_time: existing?.exit_time || null,
        is_manual: true,
        reason: m.reason || ''
      }
    })

    // 6. Compute Daily Specific Data (if viewing single date or daily tab)
    let dailyTotalPresent = 0
    let dailyTotalLate = 0
    let dailyTotalIzin = 0
    let dailyTotalSakit = 0
    let dailyTotalAlpha = 0
    let dailyTotalBelum = 0

    const processedDailyStudents = (studentsData || []).map((student) => {
      const att = studentAttendanceMatrix[student.id]?.[date]

      let status = att?.status || ''
      let reason = att?.reason || ''
      let entryTime = att?.entry_time || null
      let exitTime = att?.exit_time || null
      let isManual = !!att?.is_manual

      if (!status && isAfterLockTime) {
        status = 'Alpha'
        reason = 'Tidak melakukan presensi sebelum 07:15 WIB'
      }

      const statusLower = status.toLowerCase()
      const isPresent = statusLower === 'hadir' || statusLower === 'present' || statusLower === 'tepat waktu' || statusLower === 'terlambat'

      if (isPresent) {
        dailyTotalPresent++
        if (statusLower === 'terlambat') dailyTotalLate++
      } else if (statusLower === 'izin' || statusLower === 'permitted') {
        dailyTotalIzin++
      } else if (statusLower === 'sakit' || statusLower === 'sick') {
        dailyTotalSakit++
      } else if (statusLower === 'alpha' || statusLower === 'alpa') {
        dailyTotalAlpha++
      } else {
        dailyTotalBelum++
      }

      const classroom = classroomsData?.find((c) => c.id === student.class_id || c.name === student.class)
      const className = classroom ? classroom.name : (student.class || '-')
      const resolvedClassId = classroom ? classroom.id : student.class_id

      return {
        id: student.id,
        name: student.name,
        student_number: student.student_number,
        nisn: student.nisn,
        class_id: resolvedClassId,
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

    // Daily classroom summaries
    const classroomsSummary = (classroomsData || []).map((c) => {
      const classStudents = processedDailyStudents.filter((s) => s.class_id === c.id || s.class_name === c.name)
      const total = classStudents.length
      const present = classStudents.filter((s) => s.attendance.is_present).length
      const izin = classStudents.filter((s) => (s.attendance.status || '').toLowerCase() === 'izin').length
      const sakit = classStudents.filter((s) => (s.attendance.status || '').toLowerCase() === 'sakit').length
      const alpha = classStudents.filter((s) => (s.attendance.status || '').toLowerCase() === 'alpha').length
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

    // 7. Compute Weekly Matrix & Weekly Student Data
    let weeklyTotalPresentRecords = 0
    let weeklyTotalPossibleSlots = 0
    let weeklyTotalIzinRecords = 0
    let weeklyTotalSakitRecords = 0
    let weeklyTotalAlphaRecords = 0

    // Weekly Matrix per Classroom
    const weeklyClassroomsMatrix = (classroomsData || []).map((c) => {
      const classStudents = (studentsData || []).filter((s) => s.class_id === c.id || s.class === c.name)
      const total = classStudents.length

      let classPresentTotal = 0
      let classSlotsTotal = 0

      const days = weekDays.map((day) => {
        const presentCount = classStudents.filter((s) => {
          const att = studentAttendanceMatrix[s.id]?.[day.date]
          const st = (att?.status || '').toLowerCase()
          return st === 'hadir' || st === 'present' || st === 'tepat waktu' || st === 'terlambat'
        }).length

        const pct = total > 0 ? Math.round((presentCount / total) * 100) : 0
        classPresentTotal += presentCount
        classSlotsTotal += total

        return {
          date: day.date,
          dayName: day.dayName,
          dayLabel: day.dayLabel,
          present_count: presentCount,
          total_students: total,
          percentage: pct
        }
      })

      weeklyTotalPresentRecords += classPresentTotal
      weeklyTotalPossibleSlots += classSlotsTotal

      const weeklyAverage = classSlotsTotal > 0 ? Math.round((classPresentTotal / classSlotsTotal) * 100) : 0
      const teacherName = c.homeroom_teacher_id ? (staffMap[c.homeroom_teacher_id] || 'Belum Ditentukan') : 'Belum Ditentukan'

      return {
        id: c.id,
        name: c.name,
        slug: c.name.toLowerCase().replace(/\s+/g, '-'),
        homeroom_teacher: teacherName,
        total_students: total,
        days,
        weekly_average: weeklyAverage
      }
    })

    // Weekly Students Breakdown
    const processedWeeklyStudents = (studentsData || []).map((student) => {
      const classroom = classroomsData?.find((c) => c.id === student.class_id || c.name === student.class)
      const className = classroom ? classroom.name : (student.class || '-')
      const resolvedClassId = classroom ? classroom.id : student.class_id

      let hadirCount = 0
      let izinCount = 0
      let sakitCount = 0
      let alphaCount = 0
      const dayStatuses: Record<string, any> = {}

      weekDays.forEach((day) => {
        const att = studentAttendanceMatrix[student.id]?.[day.date]
        const st = att?.status || (day.date < todayStr ? 'Alpha' : null)
        const stLower = (st || '').toLowerCase()

        if (stLower === 'hadir' || stLower === 'present' || stLower === 'tepat waktu' || stLower === 'terlambat') {
          hadirCount++
        } else if (stLower === 'izin' || stLower === 'permitted') {
          izinCount++
          weeklyTotalIzinRecords++
        } else if (stLower === 'sakit' || stLower === 'sick') {
          sakitCount++
          weeklyTotalSakitRecords++
        } else if (stLower === 'alpha' || stLower === 'alpa') {
          alphaCount++
          weeklyTotalAlphaRecords++
        }

        dayStatuses[day.date] = {
          status: st,
          entry_time: att?.entry_time || null,
          exit_time: att?.exit_time || null
        }
      })

      const totalSchoolDays = weekDays.length
      const percentage = totalSchoolDays > 0 ? Math.round((hadirCount / totalSchoolDays) * 100) : 0

      return {
        id: student.id,
        name: student.name,
        student_number: student.student_number,
        nisn: student.nisn,
        class_id: resolvedClassId,
        class_name: className,
        days: dayStatuses,
        summary: {
          hadir: hadirCount,
          izin: izinCount,
          sakit: sakitCount,
          alpha: alphaCount,
          total_days: totalSchoolDays,
          percentage
        }
      }
    })

    // 8. Compute Monthly Classroom Leaderboard & Monthly Student Data
    let monthlyTotalHadirRecords = 0
    let monthlyTotalIzinRecords = 0
    let monthlyTotalSakitRecords = 0
    let monthlyTotalAlphaRecords = 0
    let monthlyTotalRecordedSlots = 0

    const monthlyClassRecap = (classroomsData || []).map((c) => {
      const classStudents = (studentsData || []).filter((s) => s.class_id === c.id || s.class === c.name)
      let hadir = 0
      let izin = 0
      let sakit = 0
      let alpha = 0
      let totalAttRecords = 0

      classStudents.forEach((s) => {
        const datesMap = studentAttendanceMatrix[s.id] || {}
        Object.keys(datesMap).forEach((dStr) => {
          if (dStr >= startDate && dStr <= endDate) {
            const st = (datesMap[dStr]?.status || '').toLowerCase()
            totalAttRecords++
            if (st === 'hadir' || st === 'present' || st === 'tepat waktu' || st === 'terlambat') hadir++
            else if (st === 'izin' || st === 'permitted') izin++
            else if (st === 'sakit' || st === 'sick') sakit++
            else if (st === 'alpha' || st === 'alpa') alpha++
          }
        })
      })

      monthlyTotalHadirRecords += hadir
      monthlyTotalIzinRecords += izin
      monthlyTotalSakitRecords += sakit
      monthlyTotalAlphaRecords += alpha
      monthlyTotalRecordedSlots += totalAttRecords

      const percentage = totalAttRecords > 0 ? Math.round((hadir / totalAttRecords) * 100) : 0
      const teacherName = c.homeroom_teacher_id ? (staffMap[c.homeroom_teacher_id] || 'Belum Ditentukan') : 'Belum Ditentukan'

      return {
        id: c.id,
        name: c.name,
        slug: c.name.toLowerCase().replace(/\s+/g, '-'),
        homeroom_teacher: teacherName,
        total_students: classStudents.length,
        total_records: totalAttRecords,
        hadir,
        izin,
        sakit,
        alpha,
        percentage
      }
    }).sort((a, b) => b.percentage - a.percentage)

    // Monthly Students Breakdown
    const processedMonthlyStudents = (studentsData || []).map((student) => {
      const classroom = classroomsData?.find((c) => c.id === student.class_id || c.name === student.class)
      const className = classroom ? classroom.name : (student.class || '-')
      const resolvedClassId = classroom ? classroom.id : student.class_id

      let hadir = 0
      let izin = 0
      let sakit = 0
      let alpha = 0
      let totalRecords = 0

      const datesMap = studentAttendanceMatrix[student.id] || {}
      Object.keys(datesMap).forEach((dStr) => {
        if (dStr >= startDate && dStr <= endDate) {
          const st = (datesMap[dStr]?.status || '').toLowerCase()
          totalRecords++
          if (st === 'hadir' || st === 'present' || st === 'tepat waktu' || st === 'terlambat') hadir++
          else if (st === 'izin' || st === 'permitted') izin++
          else if (st === 'sakit' || st === 'sick') sakit++
          else if (st === 'alpha' || st === 'alpa') alpha++
        }
      })

      const percentage = totalRecords > 0 ? Math.round((hadir / totalRecords) * 100) : 0

      return {
        id: student.id,
        name: student.name,
        student_number: student.student_number,
        nisn: student.nisn,
        class_id: resolvedClassId,
        class_name: className,
        summary: {
          hadir,
          izin,
          sakit,
          alpha,
          total_records: totalRecords,
          percentage
        }
      }
    })

    // 9. Filter students according to requested classId
    const filterByClass = (list: any[]) => {
      if (classId === 'ALL') return list
      return list.filter((s) => s.class_id === classId || s.class_name === classId)
    }

    const totalStudentsCount = studentsData?.length || 0
    const dailyPercentage = totalStudentsCount > 0 ? Math.round((dailyTotalPresent / totalStudentsCount) * 100) : 0
    const weeklyPercentage = weeklyTotalPossibleSlots > 0 ? Math.round((weeklyTotalPresentRecords / weeklyTotalPossibleSlots) * 100) : 0
    const monthlyPercentage = monthlyTotalRecordedSlots > 0 ? Math.round((monthlyTotalHadirRecords / monthlyTotalRecordedSlots) * 100) : 0

    return NextResponse.json({
      success: true,
      data: {
        viewMode,
        date,
        startDate,
        endDate,
        weekDays,
        month,
        year,
        kpi: {
          total_students: totalStudentsCount,
          daily: {
            total_present: dailyTotalPresent,
            total_late: dailyTotalLate,
            total_izin: dailyTotalIzin,
            total_sakit: dailyTotalSakit,
            total_alpha: dailyTotalAlpha,
            total_belum: dailyTotalBelum,
            percentage: dailyPercentage
          },
          weekly: {
            total_present_slots: weeklyTotalPresentRecords,
            total_possible_slots: weeklyTotalPossibleSlots,
            total_izin: weeklyTotalIzinRecords,
            total_sakit: weeklyTotalSakitRecords,
            total_alpha: weeklyTotalAlphaRecords,
            percentage: weeklyPercentage
          },
          monthly: {
            total_hadir: monthlyTotalHadirRecords,
            total_izin: monthlyTotalIzinRecords,
            total_sakit: monthlyTotalSakitRecords,
            total_alpha: monthlyTotalAlphaRecords,
            percentage: monthlyPercentage
          }
        },
        classrooms: classroomsSummary,
        weekly_matrix: weeklyClassroomsMatrix,
        monthly_recap: monthlyClassRecap,
        students: {
          daily: filterByClass(processedDailyStudents),
          weekly: filterByClass(processedWeeklyStudents),
          monthly: filterByClass(processedMonthlyStudents)
        }
      }
    })
  } catch (error: any) {
    console.error('Error in students overview route:', error)
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan saat memuat data absensi siswa.', detail: error?.message, code: error?.code },
      { status: 500 }
    )
  }
}
