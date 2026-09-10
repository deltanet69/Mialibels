import { NextRequest, NextResponse } from 'next/server'
import { supabase, withTimeout } from '@/lib/supabase'

// In-memory cache for class student rosters (TTL 60 detik)
// Data siswa aktif per kelas sangat jarang berubah tiap detik,
// caching ini menghilangkan 90-95% beban query berulang ke database.
type StudentCacheItem = {
  timestamp: number
  students: Array<{ id: string; name: string; class: string }>
}
const studentRosterCache = new Map<string, StudentCacheItem>()
const ROSTER_CACHE_TTL = 60 * 1000 // 60 detik

async function getClassStudents(
  className: string,
  isMultiClassGrade1: boolean,
  deviceClean: string,
  rawClassLower: string
) {
  const cacheKey = `roster_${rawClassLower}_${deviceClean}`
  const cached = studentRosterCache.get(cacheKey)
  if (cached && Date.now() - cached.timestamp < ROSTER_CACHE_TTL) {
    return cached.students
  }

  let studentQuery = supabase
    .from('students')
    .select('id, name, class')
    .eq('is_active', true)

  if (isMultiClassGrade1) {
    // Pos Gedung 2: hanya Kelas 1B, 1C, 1D
    studentQuery = studentQuery.or('class.ilike.%1b%,class.ilike.%1c%,class.ilike.%1d%')
  } else if (deviceClean === '1a' || rawClassLower === '1a') {
    // Pos Gedung 1: hanya Kelas 1A
    studentQuery = studentQuery.ilike('class', '%1a%')
  } else if (deviceClean) {
    studentQuery = studentQuery.ilike('class', `%${deviceClean}%`)
  }

  const { data: allStudents, error: studentError } = await withTimeout(
    studentQuery,
    5000,
    'Query data siswa timeout (5s)'
  )

  if (studentError) throw studentError
  const students = allStudents || []

  studentRosterCache.set(cacheKey, {
    timestamp: Date.now(),
    students
  })

  return students
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const className = searchParams.get('className')
    const date = searchParams.get('date')

    if (!className || !date) {
      return NextResponse.json({ success: false, error: 'className and date are required' }, { status: 400 })
    }

    const deviceClean = (className || '').toLowerCase().replace(/kelas/g, '').replace(/ruang/g, '').replace(/gedung/g, '').replace(/[^a-z0-9]/g, '').trim()
    const rawClassLower = (className || '').toLowerCase().trim()
    const isMultiClassGrade1 = rawClassLower === 'kelas1' || deviceClean === 'kelas1' || deviceClean === '1bcd'

    // 1. Fetch active students (dari fast in-memory cache atau query dengan timeout 5s)
    const classStudents = await getClassStudents(className, isMultiClassGrade1, deviceClean, rawClassLower)
    const studentIds = classStudents.map(s => s.id)

    // 2. Fetch attendance for these students on the given date
    let attendances: any[] = []
    if (studentIds.length > 0) {
      const attQuery = supabase
        .from('student_attendances')
        .select('id, student_id, date, status, entry_time, exit_time')
        .in('student_id', studentIds)
        .eq('date', date)

      const { data: attData, error: attError } = await withTimeout(
        attQuery,
        5000,
        'Query absensi siswa timeout (5s)'
      )

      if (attError) throw attError
      attendances = attData || []
    }

    // 3. Combine data & compute class breakdown
    const classBreakdown: Record<string, { total: number; present: number }> = {}

    const result = classStudents.map(student => {
      const att = attendances.find(a => a.student_id === student.id)
      const c = student.class || 'Tanpa Kelas'
      if (!classBreakdown[c]) {
        classBreakdown[c] = { total: 0, present: 0 }
      }
      classBreakdown[c].total += 1
      if (att && att.entry_time && att.status !== 'Alpha') {
        classBreakdown[c].present += 1
      }

      return {
        id: student.id,
        name: student.name,
        class: student.class,
        attendance: att || null
      }
    })

    return NextResponse.json({
      success: true,
      total_students: classStudents.length,
      present_count: attendances.filter(a => a.entry_time && a.status !== 'Alpha').length,
      class_breakdown: classBreakdown,
      data: result
    }, {
      headers: {
        'Cache-Control': 'no-store, max-age=0'
      }
    })

  } catch (error: any) {
    console.error('List Attendance Error:', error)
    return NextResponse.json({ success: false, error: error.message || 'Terjadi kesalahan saat memuat absensi' }, { status: 500 })
  }
}

