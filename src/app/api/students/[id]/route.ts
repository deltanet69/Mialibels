// @ts-nocheck
﻿import { NextRequest, NextResponse } from 'next/server'
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
        spp_invoices (*)
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

    // Add updated_at manually just in case
    const updateData = {
      ...body,
      updated_at: new Date().toISOString()
    }

    const { data: student, error } = await supabase
      .from('students')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

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
