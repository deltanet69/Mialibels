import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

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
        spp_payments (*)
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
