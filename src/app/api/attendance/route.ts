import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

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
    return NextResponse.json({ error: 'Terjadi kesalahan internal pada server.' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { date, records } = await request.json()

    if (!date || !records || !Array.isArray(records)) {
      return NextResponse.json({ error: 'Data tidak valid' }, { status: 400 })
    }

    const upsertRecords: any[] = []
    const deleteRecords: any[] = []
    
    records.forEach((record: any) => {
      if (record.status === 'DELETE') {
        deleteRecords.push(record)
      } else {
        // Build the update payload based on what's provided, handling partial deletes like DELETE_IN or DELETE_OUT
        const payload: any = {
          staff_id: record.staff_id,
          date: date,
          status: record.status,
          notes: record.notes || null,
          updated_at: new Date().toISOString()
        }
        
        // If it's a specific delete command, update accordingly
        if (record.status === 'DELETE_IN') {
           payload.status = 'HADIR' // Revert to a valid status, you might want to keep the old status if it's passed
           payload.check_in_time = null
           // Only update check_in_time to null, do not overwrite check_out_time unless it's explicitly passed
           if (record.check_out_time !== undefined) {
               payload.check_out_time = record.check_out_time
           }
        } else if (record.status === 'DELETE_OUT') {
           payload.status = 'HADIR'
           payload.check_out_time = null
           if (record.check_in_time !== undefined) {
               payload.check_in_time = record.check_in_time
           }
        } else {
            // Standard update/insert
            if (record.check_in_time !== undefined) payload.check_in_time = record.check_in_time || null
            if (record.check_out_time !== undefined) payload.check_out_time = record.check_out_time || null
        }
        
        upsertRecords.push(payload)
      }
    })

    // Use upsert to handle both new records and updates based on UNIQUE(staff_id, date) constraint
    if (upsertRecords.length > 0) {
      const { error: upsertError } = await supabase
        .from('staff_attendance')
        .upsert(upsertRecords as any, { onConflict: 'staff_id, date' })
      
      if (upsertError) throw upsertError
    }

    // Delete records that are marked for deletion
    if (deleteRecords.length > 0) {
      const staffIds = deleteRecords.map(r => r.staff_id)
      const { error: deleteError } = await supabase
        .from('staff_attendance')
        .delete()
        .eq('date', date)
        .in('staff_id', staffIds)
      
      if (deleteError) throw deleteError
    }

    return NextResponse.json({ success: true, message: 'Data berhasil disimpan' })
  } catch (error: any) {
    console.error('Error saving attendance:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan internal pada server.' }, { status: 500 })
  }
}

