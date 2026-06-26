import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')

    let query = supabase
      .from('classrooms')
      .select(`
        *,
        homeroom_teacher:staffs(name),
        students(count)
      `)
      .order('created_at', { ascending: false })

    if (search) {
      query = query.ilike('name', `%${search}%`)
      // Note: searching by teacher name requires a more complex query in Supabase, 
      // for simplicity we filter by classroom name here. Frontend can also filter locally.
    }

    const { data, error } = await query

    if (error) throw error

    // Format the response to match frontend expectations
    const formattedData = data.map((cls: any) => ({
      id: cls.id,
      name: cls.name,
      homeroomTeacher: cls.homeroom_teacher ? cls.homeroom_teacher.name : 'Belum Ditugaskan',
      enrolledStudents: cls.students[0]?.count || 0
    }))

    const res = NextResponse.json({ success: true, data: formattedData })
    // Cache 10 detik, lalu revalidate di background — user tidak merasakan loading
    res.headers.set('Cache-Control', 'private, max-age=10, stale-while-revalidate=30')
    return res
  } catch (error: any) {
    console.error('Error fetching classrooms:', error)
    return NextResponse.json({ error: error.message || 'Server Error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // mapping expected { name, homeroomTeacherId } to { name, homeroom_teacher_id }
    const { data: classroom, error } = await supabase
      .from('classrooms')
      .insert([{
        name: body.name,
        homeroom_teacher_id: body.homeroomTeacherId || null
      }])
      .select(`
        *,
        homeroom_teacher:staffs(name),
        students(count)
      `)
      .single()

    if (error) throw error

    const formattedClassroom = {
      id: classroom.id,
      name: classroom.name,
      homeroomTeacher: classroom.homeroom_teacher ? classroom.homeroom_teacher.name : 'Belum Ditugaskan',
      enrolledStudents: 0
    }

    return NextResponse.json({ success: true, data: formattedClassroom })
  } catch (error: any) {
    console.error('Error creating classroom:', error)
    return NextResponse.json({ error: error.message || 'Server Error' }, { status: 500 })
  }
}
