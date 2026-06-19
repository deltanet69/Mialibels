import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')

    if (!date) {
      return NextResponse.json({ error: 'Parameter date wajib diisi' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('staff_attendance')
      .select(`
        *,
        staffs (id, name, position)
      `)
      .eq('date', date)

    if (error) throw error

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error('Error fetching attendance:', error)
    return NextResponse.json({ error: error.message || 'Server Error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { date, records } = await request.json()

    if (!date || !records || !Array.isArray(records)) {
      return NextResponse.json({ error: 'Data tidak valid' }, { status: 400 })
    }

    // records format: [{ staff_id, status, check_in_time, check_out_time, notes }]
    const upsertData = records.map((record: any) => ({
      staff_id: record.staff_id,
      date: date,
      status: record.status,
      check_in_time: record.check_in_time || null,
      check_out_time: record.check_out_time || null,
      notes: record.notes || null,
      updated_at: new Date().toISOString()
    }))

    // Use upsert to handle both new records and updates based on UNIQUE(staff_id, date) constraint
    const { data, error } = await supabase
      .from('staff_attendance')
      .upsert(upsertData, { onConflict: 'staff_id, date' })
      .select()

    if (error) throw error

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error('Error saving attendance:', error)
    return NextResponse.json({ error: error.message || 'Server Error' }, { status: 500 })
  }
}
