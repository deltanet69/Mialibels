import { NextRequest, NextResponse } from 'next/server'
import { supabase, withTimeout } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')

    if (!date) {
      return NextResponse.json({ error: 'Parameter date wajib diisi' }, { status: 400 })
    }

    const query = supabase
      .from('staff_attendance')
      .select(`
        *,
        staffs (id, name, position)
      `)
      .eq('date', date)

    const { data, error } = await withTimeout(
      query,
      5000,
      'Query absensi staff timeout (5s)'
    )

    if (error) throw error

    return NextResponse.json({ success: true, data }, {
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
        const payload: any = {
          staff_id: record.staff_id,
          date: date,
          status: record.status,
          notes: record.notes || null,
          updated_at: new Date().toISOString()
        }
        
        if (record.status === 'DELETE_IN') {
           payload.status = 'HADIR'
           payload.check_in_time = null
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
            if (record.check_in_time !== undefined) payload.check_in_time = record.check_in_time || null
            if (record.check_out_time !== undefined) payload.check_out_time = record.check_out_time || null
        }
        
        upsertRecords.push(payload)
      }
    })

    if (upsertRecords.length > 0) {
      const upsertQuery = supabase
        .from('staff_attendance')
        .upsert(upsertRecords as any, { onConflict: 'staff_id, date' })
      
      const { error: upsertError } = await withTimeout(
        upsertQuery,
        5000,
        'Penyimpanan absensi timeout (5s)'
      )
      
      if (upsertError) throw upsertError
    }

    if (deleteRecords.length > 0) {
      const staffIds = deleteRecords.map(r => r.staff_id)
      const deleteQuery = supabase
        .from('staff_attendance')
        .delete()
        .eq('date', date)
        .in('staff_id', staffIds)
      
      const { error: deleteError } = await withTimeout(
        deleteQuery,
        5000,
        'Penghapusan absensi timeout (5s)'
      )
      
      if (deleteError) throw deleteError
    }

    return NextResponse.json({ success: true, message: 'Data berhasil disimpan' })
  } catch (error: any) {
    console.error('Error saving attendance:', error)
    return NextResponse.json({ error: error.message || 'Terjadi kesalahan internal pada server.' }, { status: 500 })
  }
}


