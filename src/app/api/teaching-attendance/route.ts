import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const classroomId = searchParams.get('classroomId')
    const date = searchParams.get('date')

    if (!classroomId || !date) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 })
    }

    // Find all schedules for this classroom
    const { data: schedules, error: schedError } = await supabase
      .from('classroom_schedules')
      .select('id')
      .eq('classroom_id', classroomId)

    if (schedError) throw schedError

    const scheduleIds = schedules.map(s => s.id)

    if (scheduleIds.length === 0) {
      return NextResponse.json({ success: true, data: [] })
    }

    const { data, error } = await supabase
      .from('teaching_logs')
      .select('*')
      .eq('date', date)
      .in('schedule_id', scheduleIds)

    if (error) throw error

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server Error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { schedule_id, teacher_id, date, status } = body

    if (!schedule_id || !teacher_id || !date) {
      return NextResponse.json({ error: 'Data tidak lengkap' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('teaching_logs')
      .insert({
        schedule_id,
        teacher_id,
        date,
        status: status || 'Hadir',
        started_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      // Handle unique constraint violation gracefully
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Absensi untuk jadwal ini sudah tercatat hari ini.' }, { status: 400 })
      }
      throw error
    }

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server Error' }, { status: 500 })
  }
}
