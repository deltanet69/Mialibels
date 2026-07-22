import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  supabaseServiceKey
)

export async function POST(request: NextRequest) {
  try {
    const { rfid } = await request.json()

    if (!rfid) {
      return NextResponse.json({ success: false, error: 'RFID is required' }, { status: 400 })
    }

    // 1. Find staff by RFID
    const { data: staffs, error: staffError } = await supabase
      .from('staffs')
      .select('*')
      .eq('rfid', rfid)
      .eq('is_active', true)
      .limit(1)

    if (staffError) throw staffError

    if (!staffs || staffs.length === 0) {
      return NextResponse.json({ success: false, error: 'Kartu tidak dikenali atau staff tidak aktif.' }, { status: 404 })
    }

    const staff = staffs[0]
    
    // Get today's date in local YYYY-MM-DD (assuming server time is close enough, or standard UTC+7)
    // For safety, let's just use UTC for now, or adapt based on timezone.
    const today = new Date()
    // Convert to UTC+7 for Indonesia context
    const offset = 7 * 60 * 60 * 1000
    const localDate = new Date(today.getTime() + offset)
    const dateStr = localDate.toISOString().split('T')[0]
    
    const nowIso = new Date().toISOString()

    // 2. Check existing attendance for today
    const { data: existingRecords, error: checkError } = await supabase
      .from('staff_attendance')
      .select('*')
      .eq('staff_id', staff.id)
      .eq('date', dateStr)
      .limit(1)

    if (checkError) throw checkError

    const existingRecord = existingRecords && existingRecords.length > 0 ? existingRecords[0] : null

    if (!existingRecord) {
      // 3. Check IN
      const { data: newRecord, error: insertError } = await supabase
        .from('staff_attendance')
        .insert({
          staff_id: staff.id,
          date: dateStr,
          status: 'HADIR',
          check_in_time: nowIso,
          updated_at: nowIso
        })
        .select()
        .single()

      if (insertError) throw insertError

      return NextResponse.json({ 
        success: true, 
        action: 'check-in', 
        message: `Berhasil Absen Masuk: ${staff.name}`,
        data: newRecord,
        staff: staff
      })
    } else {
      // 4. Check OUT or Already checked out
      if (existingRecord.check_out_time) {
        return NextResponse.json({ 
          success: false, 
          action: 'already-checked-out',
          error: `${staff.name} sudah melakukan Absen Pulang hari ini.` 
        }, { status: 400 })
      } else {
        // Do Check OUT
        const { data: updateRecord, error: updateError } = await supabase
          .from('staff_attendance')
          .update({
            check_out_time: nowIso,
            updated_at: nowIso
          })
          .eq('id', existingRecord.id)
          .select()
          .single()

        if (updateError) throw updateError

        return NextResponse.json({ 
          success: true, 
          action: 'check-out', 
          message: `Berhasil Absen Pulang: ${staff.name}`,
          data: updateRecord,
          staff: staff
        })
      }
    }

  } catch (error: any) {
    console.error('Error in RFID scan:', error)
    return NextResponse.json({ success: false, error: error.message || 'Server Error' }, { status: 500 })
  }
}
