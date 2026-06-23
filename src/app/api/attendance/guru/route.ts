import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  supabaseServiceKey
)

// GET: Fetch all active teachers and their attendance for a specific date
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')

    if (!date) {
      return NextResponse.json({ error: 'Date is required' }, { status: 400 })
    }

    // Get all active staffs
    const { data: staffs, error: staffsError } = await supabase
      .from('staffs')
      .select('id, name, position, rfid')
      .eq('is_active', true)
      .order('name', { ascending: true })

    if (staffsError) throw staffsError

    // Get attendance for the specified date
    const { data: attendance, error: attendanceError } = await supabase
      .from('staff_attendance')
      .select('*')
      .eq('date', date)

    if (attendanceError) throw attendanceError

    // Merge data
    const mergedData = staffs.map(staff => {
      const att = attendance.find(a => a.staff_id === staff.id)
      return {
        ...staff,
        attendance: att || null
      }
    })

    return NextResponse.json({ success: true, data: mergedData })
  } catch (error: any) {
    console.error('Error fetching attendance:', error)
    return NextResponse.json({ error: error.message || 'Server Error' }, { status: 500 })
  }
}

// POST: Bulk upsert attendance records
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
    return NextResponse.json({ error: error.message || 'Server Error' }, { status: 500 })
  }
}
