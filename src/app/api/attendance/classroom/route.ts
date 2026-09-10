// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { supabase, withTimeout } from '@/lib/supabase'

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

    const { data: classroomData, error: classroomError } = await withTimeout(
      query,
      5000,
      'Query absensi kelas timeout (5s)'
    )
    if (classroomError) throw classroomError

    // Also fetch RFID scans (student_attendances) for this date
    let rfidData: any[] = []
    if (date) {
      // Get all students in this class
      const { data: students } = await withTimeout(
        supabase
          .from('students')
          .select('id')
          .eq('class_id', classroomId),
        5000,
        'Query siswa kelas timeout (5s)'
      )
        
      if (students && students.length > 0) {
        const studentIds = students.map(s => s.id)
        const { data: studentAtts } = await withTimeout(
          supabase
            .from('student_attendances')
            .select('*')
            .in('student_id', studentIds)
            .eq('date', date),
          5000,
          'Query absensi RFID siswa timeout (5s)'
        )
          
        if (studentAtts) rfidData = studentAtts
      }
    }

    // Merge data: classroom_attendances (manual override) takes precedence for status/reason
    // student_attendances provides entry_time, exit_time, and fallback status
    const mergedData = []
    const studentIds = new Set([...(classroomData || []).map(r => r.student_id), ...rfidData.map(r => r.student_id)])
    
    for (const sId of studentIds) {
      const cRec = (classroomData || []).find(r => r.student_id === sId)
      const rRec = rfidData.find(r => r.student_id === sId)
      
      mergedData.push({
        student_id: sId,
        status: cRec?.status || rRec?.status || '',
        reason: cRec?.reason || '',
        entry_time: rRec?.entry_time || null,
        exit_time: rRec?.exit_time || null
      })
    }

    return NextResponse.json({ success: true, data: mergedData }, {
      headers: {
        'Cache-Control': 'no-store, max-age=0'
      }
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Terjadi kesalahan internal pada server.' }, { status: 500 })
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
    await withTimeout(
      supabase
        .from('classroom_attendances')
        .delete()
        .eq('classroom_id', classroomId)
        .eq('date', date),
      5000,
      'Penghapusan absensi kelas lama timeout (5s)'
    )

    // Insert new attendances
    const { data, error } = await withTimeout(
      supabase
        .from('classroom_attendances')
        .insert(attendances as any),
      5000,
      'Penyimpanan absensi kelas timeout (5s)'
    )

    if (error) throw error
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Terjadi kesalahan internal pada server.' }, { status: 500 })
  }
}


