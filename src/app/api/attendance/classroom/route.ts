import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const classroomId = searchParams.get('classroomId')
    const date = searchParams.get('date')

    if (!classroomId) {
      return NextResponse.json({ error: 'Missing classroomId' }, { status: 400 })
    }

    let query = supabase
      .from('classroom_attendances')
      .select('*')
      .eq('classroom_id', classroomId)

    if (date) {
      query = query.eq('date', date)
    }

    const { data: classroomData, error: classroomError } = await query
    if (classroomError) throw classroomError

    // Also fetch RFID scans (student_attendances) for this date
    let rfidData: any[] = []
    if (date) {
      // Get all students in this class
      const { data: students } = await supabase
        .from('students')
        .select('id')
        .eq('class_id', classroomId)
        
      if (students && students.length > 0) {
        const studentIds = students.map(s => s.id)
        const { data: studentAtts } = await supabase
          .from('student_attendances')
          .select('*')
          .in('student_id', studentIds)
          .eq('date', date)
          
        if (studentAtts) rfidData = studentAtts
      }
    }

    // Merge data: classroom_attendances (manual override) takes precedence for status/reason
    // student_attendances provides entry_time, exit_time, and fallback status
    const mergedData = []
    const studentIds = new Set([...classroomData.map(r => r.student_id), ...rfidData.map(r => r.student_id)])
    
    for (const sId of studentIds) {
      const cRec = classroomData.find(r => r.student_id === sId)
      const rRec = rfidData.find(r => r.student_id === sId)
      
      mergedData.push({
        student_id: sId,
        status: cRec?.status || rRec?.status || '',
        reason: cRec?.reason || '',
        entry_time: rRec?.entry_time || null,
        exit_time: rRec?.exit_time || null
      })
    }

    return NextResponse.json({ success: true, data: mergedData })
  } catch (error: any) {
    return NextResponse.json({ error: 'Terjadi kesalahan internal pada server.' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { classroomId, date, attendances } = body

    if (!classroomId || !date || !attendances || !Array.isArray(attendances)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    // Delete existing attendance for this class and date
    await supabase
      .from('classroom_attendances')
      .delete()
      .eq('classroom_id', classroomId)
      .eq('date', date)

    // Insert new attendances
    const { data, error } = await supabase
      .from('classroom_attendances')
      .insert(attendances as any)

    if (error) throw error
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ error: 'Terjadi kesalahan internal pada server.' }, { status: 500 })
  }
}

