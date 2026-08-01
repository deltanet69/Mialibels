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
    const dateStr = searchParams.get('date')
    const filter = searchParams.get('filter') || 'hari'

    if (!dateStr) {
      return NextResponse.json({ error: 'Date is required' }, { status: 400 })
    }

    const date = new Date(dateStr)
    let startDate = dateStr
    let endDate = dateStr

    if (filter === 'minggu') {
      // Get Monday
      const day = date.getDay()
      const diff = date.getDate() - day + (day === 0 ? -6 : 1)
      const monday = new Date(date.setDate(diff))
      startDate = monday.toISOString().split('T')[0]
      
      // Get Sunday
      const sunday = new Date(monday)
      sunday.setDate(monday.getDate() + 6)
      endDate = sunday.toISOString().split('T')[0]
    } else if (filter === 'bulan') {
      const year = date.getFullYear()
      const month = date.getMonth()
      const firstDay = new Date(year, month, 1)
      const lastDay = new Date(year, month + 1, 0)
      
      // Adjust for local timezone offset when getting ISO string
      const offset = firstDay.getTimezoneOffset() * 60000
      startDate = new Date(firstDay.getTime() - offset).toISOString().split('T')[0]
      endDate = new Date(lastDay.getTime() - offset).toISOString().split('T')[0]
    }

    // Get all active staffs
    const { data: staffs, error: staffsError } = await supabase
      .from('staffs')
      .select('id, name, position, rfid, image')
      .eq('is_active', true)
      .order('name', { ascending: true })

    if (staffsError) throw staffsError

    // Get attendance for the specified range
    const { data: attendance, error: attendanceError } = await supabase
      .from('staff_attendance')
      .select('*')
      .gte('date', startDate)
      .lte('date', endDate)

    if (attendanceError) throw attendanceError

    // Merge data
    const mergedData = staffs.map(staff => {
      const staffAttendances = attendance.filter(a => a.staff_id === staff.id)
      return {
        ...staff,
        attendances: staffAttendances,
        // for backward compatibility or easy single-day access
        attendance: filter === 'hari' ? (staffAttendances[0] || null) : null
      }
    })

    return NextResponse.json({ success: true, data: mergedData, range: { startDate, endDate } })
  } catch (error: any) {
    console.error('Error fetching attendance:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan internal pada server.' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const records = await request.json()

    if (!Array.isArray(records)) {
      return NextResponse.json({ error: 'Invalid data format. Expected an array of records.' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('staff_attendance')
      .upsert(
        records.map(r => ({
          staff_id: r.staff_id,
          date: r.date,
          status: r.status,
          notes: r.notes || null,
          check_in_time: r.check_in_time || null,
          check_out_time: r.check_out_time || null,
          updated_at: new Date().toISOString()
        })),
        { onConflict: 'staff_id, date' }
      )
      .select()

    if (error) throw error

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error('Error saving attendance:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan internal pada server.' }, { status: 500 })
  }
}

