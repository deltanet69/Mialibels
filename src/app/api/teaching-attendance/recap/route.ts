import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    if (!startDate || !endDate) {
      return NextResponse.json({ error: 'Missing date range' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('teaching_logs')
      .select(`
        id,
        date,
        status,
        started_at,
        ended_at,
        teacher:staffs(id, name, rfid),
        schedule:classroom_schedules(
          id, 
          name, 
          day, 
          time,
          classroom:classrooms(name)
        )
      `)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: false })
      .order('started_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ error: 'Terjadi kesalahan internal pada server.' }, { status: 500 })
  }
}

