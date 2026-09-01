// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { hash } from 'bcryptjs'
import { supabase } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Fetch student with related account (tabungan) and spp_payments
    const { data: student, error } = await supabase
      .from('students')
      .select(`
        *,
        student_accounts (*),
        spp_invoices (*),
        general_invoices (*)
      `)
      .eq('id', id)
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, data: student })
  } catch (error: any) {
    console.error('Error fetching student:', error)
    return NextResponse.json({ error: error.message || 'Server Error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    // Filter out relational/non-table properties
    const { 
      student_accounts, 
      spp_invoices, 
      spp_payments, 
      saving_transactions, 
      id: _bodyId, 
      created_at: _createdAt, 
      ...cleanBody 
    } = body

    // Add updated_at manually and sanitize empty strings to null for nullable/unique fields
    const updateData: any = {
      ...cleanBody,
      updated_at: new Date().toISOString()
    }

    if (updateData.nisn !== undefined) updateData.nisn = updateData.nisn?.toString().trim() || null
    if (updateData.rfid_number !== undefined) updateData.rfid_number = updateData.rfid_number?.toString().trim() || null
    if (updateData.parent_email !== undefined) updateData.parent_email = updateData.parent_email?.toString().trim() || null
    if (updateData.place_of_birth !== undefined) updateData.place_of_birth = updateData.place_of_birth?.toString().trim() || null
    if (updateData.date_of_birth !== undefined) updateData.date_of_birth = updateData.date_of_birth || null
    if (updateData.address !== undefined) updateData.address = updateData.address?.toString().trim() || null
    if (updateData.photo_url !== undefined) updateData.photo_url = updateData.photo_url?.toString().trim() || null
    if (updateData.fee_waiver_type !== undefined) updateData.fee_waiver_type = updateData.fee_waiver_type || null

    if (body.parent_password) {
      updateData.parent_password = await hash(body.parent_password, 10)
    }

    // Ensure class_id stays in sync with classroom name when class is updated
    if (updateData.class !== undefined) {
      if (updateData.class) {
        let cleanClass = updateData.class.replace(/^kelas\s+/i, '').trim().toUpperCase()
        cleanClass = cleanClass.replace(/^(\d+)\s+([A-Z])$/, '$1$2')
        updateData.class = cleanClass

        const { data: clsData } = await supabase
          .from('classrooms')
          .select('id')
          .ilike('name', cleanClass)
          .maybeSingle()

        if (clsData) {
          updateData.class_id = clsData.id
        }
      } else {
        updateData.class_id = null
      }
    }

    let { data: student, error } = await supabase
      .from('students')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    // Graceful fallback if database schema does not yet have newly added optional columns
    if (error && (error.message?.includes('column') || error.message?.includes('schema cache'))) {
      console.warn('Supabase schema cache warning on student update, retrying without optional columns:', error.message)
      const { date_of_birth, place_of_birth, address, photo_url, ...strippedUpdate } = updateData
      const retry = await supabase
        .from('students')
        .update(strippedUpdate)
        .eq('id', id)
        .select()
        .single()

      if (retry.error) throw retry.error
      student = retry.data
    } else if (error) {
      throw error
    }

    // Sinkronisasi otomatis tagihan infaq yang masih UNPAID
    if (updateData.fee_waiver_type === 'ANAK_YATIM' || updateData.fee_waiver_type === 'Keluarga Guru') {
      const titleSuffix = updateData.fee_waiver_type === 'ANAK_YATIM' ? '(Gratis - Anak Yatim)' : '(Gratis - Keluarga Guru)'
      
      const { data: unpaidInvoices } = await supabase
        .from('spp_invoices')
        .select('id, title')
        .eq('student_id', id)
        .eq('status', 'UNPAID')

      if (unpaidInvoices && unpaidInvoices.length > 0) {
        for (const inv of unpaidInvoices) {
          let newTitle = inv.title
          if (!newTitle.includes('(Gratis - ')) {
            newTitle = `${newTitle} ${titleSuffix}`
          }
          await supabase.from('spp_invoices').update({
            amount: 0,
            status: 'PAID',
            paid_amount: 0,
            payment_method: 'BEASISWA',
            title: newTitle
          }).eq('id', inv.id)
        }
      }
    }

    return NextResponse.json({ success: true, data: student })
  } catch (error: any) {
    console.error('Error updating student:', error)
    return NextResponse.json({ error: error.message || 'Server Error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const { error } = await supabase
      .from('students')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true, message: 'Student deleted successfully' })
  } catch (error: any) {
    console.error('Error deleting student:', error)
    return NextResponse.json({ error: error.message || 'Server Error' }, { status: 500 })
  }
}
