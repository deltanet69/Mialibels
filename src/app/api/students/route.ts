import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')

    let query = supabase
      .from('students')
      .select('*')
      .order('created_at', { ascending: false })

    if (search) {
      query = query.or(`name.ilike.%${search}%,student_number.ilike.%${search}%`)
    }

    const { data, error } = await query

    if (error) throw error

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error('Error fetching students:', error)
    return NextResponse.json({ error: error.message || 'Server Error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { isBulk, students } = body

    if (isBulk && Array.isArray(students)) {
      // Bulk Insert Mode (e.g. from CSV)
      // We will insert students first
      const { data: newStudents, error: insertError } = await supabase
        .from('students')
        .insert(students)
        .select('id')

      if (insertError) throw insertError

      // Then create accounts for each of them
      if (newStudents && newStudents.length > 0) {
        const accounts = newStudents.map(s => ({
          student_id: s.id,
          balance: 0
        }))
        
        const { error: accError } = await supabase
          .from('student_accounts')
          .insert(accounts)

        if (accError) {
          console.error('Error creating bulk student accounts:', accError)
          // We don't fail the whole request but we should log it
        }
      }

      return NextResponse.json({ success: true, count: newStudents?.length || 0 })
    } else {
      // Single Insert Mode
      const { data: student, error: insertError } = await supabase
        .from('students')
        .insert([body])
        .select()
        .single()

      if (insertError) throw insertError

      // Automatically create a student_account with 0 balance
      const { error: accError } = await supabase
        .from('student_accounts')
        .insert([{ student_id: student.id, balance: 0 }])

      if (accError) throw accError

      return NextResponse.json({ success: true, data: student })
    }

  } catch (error: any) {
    console.error('Error creating student(s):', error)
    return NextResponse.json({ error: error.message || 'Server Error' }, { status: 500 })
  }
}
