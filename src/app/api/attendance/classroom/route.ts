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

    const { data, error } = await query

    if (error) throw error
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server Error' }, { status: 500 })
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
      .insert(attendances)

    if (error) throw error
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server Error' }, { status: 500 })
  }
}
