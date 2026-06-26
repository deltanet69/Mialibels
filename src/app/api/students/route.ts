import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

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

    const res = NextResponse.json({ success: true, data })
    res.headers.set('Cache-Control', 'private, max-age=10, stale-while-revalidate=30')
    return res
  } catch (error: any) {
    console.error('Error fetching students:', error)
    return NextResponse.json({ error: error.message || 'Server Error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { isBulk, students } = body

    // Helper to get class map
    const { data: classroomsData } = await supabase.from('classrooms').select('id, name')
    const classMap: Record<string, string> = {}
    if (classroomsData) {
      classroomsData.forEach(c => {
        classMap[c.name.toLowerCase()] = c.id
      })
    }

    const getClassId = (rawClass: string) => {
      if (!rawClass) return null
      const cleanName = rawClass.replace(/^kelas\s+/i, '').trim().toLowerCase()
      return classMap[cleanName] || null
    }

    if (isBulk && Array.isArray(students)) {
      // Bulk Insert Mode (e.g. from CSV)
      const studentsToInsert = students.map(s => ({
        ...s,
        class_id: getClassId(s.class)
      }))

      const { data: newStudents, error: insertError } = await supabase
        .from('students')
        .insert(studentsToInsert)
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
        }
      }

      return NextResponse.json({ success: true, count: newStudents?.length || 0 })
    } else {
      // Single Insert Mode
      const payload = {
        ...body,
        class_id: getClassId(body.class)
      }

      const { data: student, error: insertError } = await supabase
        .from('students')
        .insert([payload])
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
