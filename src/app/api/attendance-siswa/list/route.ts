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
    const deviceClassRaw = className.toLowerCase().replace(/\s+/g, '')
    const classStudents = (allStudents || []).filter(student => {
      const studentClassRaw = (student.class || '').toLowerCase().replace(/\s+/g, '')
      return studentClassRaw.includes(deviceClassRaw)
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

    // 4. Combine data
    const result = classStudents.map(student => {
      const att = attendances.find(a => a.student_id === student.id)
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
      present_count: attendances.length,
      data: result
    })

  } catch (error: any) {
    console.error('List Attendance Error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
