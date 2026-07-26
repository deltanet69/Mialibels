import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { classroomId, date, studentId, status, reason } = body

    if (!classroomId || !date || !studentId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Check if record exists
    const { data: existing } = await supabase
      .from('classroom_attendances')
      .select('id')
      .eq('classroom_id', classroomId)
      .eq('student_id', studentId)
      .eq('date', date)
      .maybeSingle()

    if (existing) {
      if (!status) {
        // If status is empty, delete the record
        const { error } = await supabase
          .from('classroom_attendances')
          .delete()
          .eq('id', (existing as any).id)
        if (error) throw error
      } else {
        // Update existing
        const { error } = await supabase
          .from('classroom_attendances')
          .update({ status, reason } as never)
          .eq('id', (existing as any).id)
        if (error) throw error
      }
    } else {
      if (status) {
        // Insert new
        const { error } = await supabase
          .from('classroom_attendances')
          .insert({
            classroom_id: classroomId,
            student_id: studentId,
            date,
            status,
            reason
          } as any)
        if (error) throw error
      }
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Auto-save attendance error:', error)
    return NextResponse.json({ error: error.message || 'Server Error' }, { status: 500 })
  }
}
