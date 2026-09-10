import { NextRequest, NextResponse } from 'next/server'
import { supabase, withTimeout } from '@/lib/supabase'

// In-memory cache untuk master data guru (TTL 60 detik)
type StaffCacheItem = {
  timestamp: number
  staffs: any[]
}
let staffListCache: StaffCacheItem | null = null
const STAFF_CACHE_TTL = 60 * 1000

async function getActiveStaffs() {
  if (staffListCache && Date.now() - staffListCache.timestamp < STAFF_CACHE_TTL) {
    return staffListCache.staffs
  }

  const staffQuery = supabase
    .from('staffs')
    .select('id, name, position, rfid, image')
    .eq('is_active', true)
    .order('name', { ascending: true })

  const { data: staffs, error: staffsError } = await withTimeout(
    staffQuery,
    5000,
    'Query daftar guru timeout (5s)'
  )

  if (staffsError) throw staffsError
  const result = staffs || []

  staffListCache = {
    timestamp: Date.now(),
    staffs: result
  }

  return result
}

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
      const day = date.getDay()
      const diff = date.getDate() - day + (day === 0 ? -6 : 1)
      const monday = new Date(date.setDate(diff))
      startDate = monday.toISOString().split('T')[0]
      
      const sunday = new Date(monday)
      sunday.setDate(monday.getDate() + 6)
      endDate = sunday.toISOString().split('T')[0]
    } else if (filter === 'bulan') {
      const year = date.getFullYear()
      const month = date.getMonth()
      const firstDay = new Date(year, month, 1)
      const lastDay = new Date(year, month + 1, 0)
      
      const offset = firstDay.getTimezoneOffset() * 60000
      startDate = new Date(firstDay.getTime() - offset).toISOString().split('T')[0]
      endDate = new Date(lastDay.getTime() - offset).toISOString().split('T')[0]
    }

    // 1. Get all active staffs (dari memory cache / fast query)
    const staffs = await getActiveStaffs()

    // 2. Get attendance for the specified range
    const attQuery = supabase
      .from('staff_attendance')
      .select('id, staff_id, date, status, notes, check_in_time, check_out_time')
      .gte('date', startDate)
      .lte('date', endDate)

    const { data: attendance, error: attendanceError } = await withTimeout(
      attQuery,
      5000,
      'Query absensi guru timeout (5s)'
    )

    if (attendanceError) throw attendanceError
    const attList = attendance || []

    // Merge data
    const mergedData = (staffs as any[]).map((staff: any) => {
      const staffAttendances = (attList as any[]).filter((a: any) => a.staff_id === staff.id)
      return {
        ...staff,
        attendances: staffAttendances,
        attendance: filter === 'hari' ? (staffAttendances[0] || null) : null
      }
    })

    return NextResponse.json({ 
      success: true, 
      data: mergedData, 
      range: { startDate, endDate } 
    }, {
      headers: {
        'Cache-Control': 'no-store, max-age=0'
      }
    })
  } catch (error: any) {
    console.error('Error fetching attendance:', error)
    return NextResponse.json({ error: error.message || 'Terjadi kesalahan internal pada server.' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const records = await request.json()

    if (!Array.isArray(records)) {
      return NextResponse.json({ error: 'Invalid data format. Expected an array of records.' }, { status: 400 })
    }

    const upsertQuery = supabase
      .from('staff_attendance')
      .upsert(
        records.map((r: any) => ({
          staff_id: r.staff_id,
          date: r.date,
          status: r.status,
          notes: r.notes || null,
          check_in_time: r.check_in_time || null,
          check_out_time: r.check_out_time || null,
          updated_at: new Date().toISOString()
        })) as any,
        { onConflict: 'staff_id, date' }
      )
      .select()

    const { data, error } = await withTimeout(
      upsertQuery,
      5000,
      'Penyimpanan absensi guru timeout (5s)'
    )

    if (error) throw error

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error('Error saving attendance:', error)
    return NextResponse.json({ error: error.message || 'Terjadi kesalahan internal pada server.' }, { status: 500 })
  }
}


