import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  supabaseServiceKey
)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const className = searchParams.get('className')
    const date = searchParams.get('date')

    if (!className || !date) {
      return NextResponse.json({ success: false, error: 'className and date are required' }, { status: 400 })
    }

    // 1. Fetch all active students
    const { data: allStudents, error: studentError } = await supabase
      .from('students')
      .select('id, name, class')
      .eq('is_active', true)

    if (studentError) throw studentError

    // 2. Filter students by class
    const cleanClassCode = (raw?: string | null): string => {
      if (!raw) return ''
      return raw
        .toLowerCase()
        .replace(/kelas/g, '')
        .replace(/ruang/g, '')
        .replace(/gedung/g, '')
        .replace(/[^a-z0-9]/g, '')
    }

    const deviceClean = cleanClassCode(className)
    const rawClassLower = (className || '').toLowerCase().trim()
    const isMultiClassGrade1 = deviceClean === '1' || deviceClean === '1bcd' || rawClassLower === 'kelas1' || rawClassLower === '1'

    const classStudents = (allStudents || []).filter(student => {
      const studentClean = cleanClassCode(student.class)
      if (isMultiClassGrade1) {
        return studentClean.startsWith('1') || studentClean.includes('1')
      }
      if (deviceClean) {
        return studentClean === deviceClean || 
               studentClean.includes(deviceClean) || 
               deviceClean.includes(studentClean)
      }
      return true
    })

    const studentIds = classStudents.map(s => s.id)

    // 3. Fetch attendance for these students on the given date
    let attendances: any[] = []
    if (studentIds.length > 0) {
      const { data: attData, error: attError } = await supabase
        .from('student_attendances')
        .select('*')
        .in('student_id', studentIds)
        .eq('date', date)

      if (attError) throw attError
      attendances = attData || []
    }

    // 4. Combine data & compute class breakdown
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
    })

  } catch (error: any) {
    console.error('List Attendance Error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
