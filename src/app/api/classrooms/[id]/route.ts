import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { data: classroom, error } = await supabase
      .from('classrooms')
      .select(`
        *,
        homeroom_teacher:staffs(name),
        students(count)
      `)
      .eq('id', params.id)
      .single()

    if (error) throw error

    const formattedData = {
      id: classroom.id,
      name: classroom.name,
      homeroomTeacher: classroom.homeroom_teacher ? classroom.homeroom_teacher.name : 'Belum Ditugaskan',
      enrolledStudents: classroom.students[0]?.count || 0
    }

    return NextResponse.json({ success: true, data: formattedData })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server Error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const { error } = await supabase
      .from('classrooms')
      .update({
        name: body.name,
        homeroom_teacher_id: body.homeroomTeacherId || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server Error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { error } = await supabase
      .from('classrooms')
      .delete()
      .eq('id', params.id)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server Error' }, { status: 500 })
  }
}
