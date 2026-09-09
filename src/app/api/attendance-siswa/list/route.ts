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

    const deviceClean = (className || '').toLowerCase().replace(/kelas/g, '').replace(/ruang/g, '').replace(/gedung/g, '').replace(/[^a-z0-9]/g, '').trim();
    const rawClassLower = (className || '').toLowerCase().trim();
    const isMultiClassGrade1 = rawClassLower === 'kelas1' || deviceClean === 'kelas1' || deviceClean === '1bcd';

    // 1. Fetch active students ONLY for the specific class
    let studentQuery = supabase
      .from('students')
      .select('id, name, class')
      .eq('is_active', true);

    if (isMultiClassGrade1) {
      // Pos Gedung 2: hanya Kelas 1B, 1C, 1D (tidak memuat 1A)
      studentQuery = studentQuery.or('class.ilike.%1b%,class.ilike.%1c%,class.ilike.%1d%');
    } else if (deviceClean === '1a' || rawClassLower === '1a') {
      // Pos Gedung 1: hanya Kelas 1A
      studentQuery = studentQuery.ilike('class', '%1a%');
    } else if (deviceClean) {
      studentQuery = studentQuery.ilike('class', `%${deviceClean}%`);
    }

    const { data: allStudents, error: studentError } = await studentQuery;

    if (studentError) throw studentError;

    // 2. We already filtered students in the database query.
    const classStudents = allStudents || [];

    const studentIds = classStudents.map(s => s.id)

    // 3. Fetch attendance for these students on the given date (hanya kolom yang diperlukan)
    let attendances: any[] = []
    if (studentIds.length > 0) {
      const { data: attData, error: attError } = await supabase
        .from('student_attendances')
        .select('id, student_id, date, status, entry_time, exit_time')
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
    }, {
      headers: {
        'Cache-Control': 'no-store, max-age=0' // Prevent caching for realtime data
      }
    })

  } catch (error: any) {
    console.error('List Attendance Error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
