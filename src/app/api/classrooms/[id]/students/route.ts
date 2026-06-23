import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('class_id', params.id)
      .order('name', { ascending: true })

    if (error) throw error
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server Error' }, { status: 500 })
  }
}

// Digunakan untuk meng-assign siswa ke kelas
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const { studentId } = body
    
    const { error } = await supabase
      .from('students')
      .update({ class_id: params.id })
      .eq('id', studentId)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server Error' }, { status: 500 })
  }
}
