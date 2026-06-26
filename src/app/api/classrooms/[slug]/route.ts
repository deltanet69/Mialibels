import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// Helper to get name from slug
const getNameFromSlug = (slug: string) => {
  return slug.replace(/^kelas-/i, '').replace(/-/g, ' ').trim().toUpperCase()
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params
    const nameToSearch = getNameFromSlug(slug)

    const { data: classroom, error } = await supabase
      .from('classrooms')
      .select(`
        *,
        homeroom_teacher:staffs(name),
        students(count)
      `)
      .ilike('name', nameToSearch)
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

export async function PUT(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params
    const nameToSearch = getNameFromSlug(slug)
    const body = await request.json()
    
    // First find the classroom ID
    const { data: cls } = await supabase.from('classrooms').select('id').ilike('name', nameToSearch).single()
    if (!cls) throw new Error('Classroom not found')

    const { error } = await supabase
      .from('classrooms')
      .update({
        name: body.name,
        homeroom_teacher_id: body.homeroomTeacherId || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', cls.id)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server Error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params
    const nameToSearch = getNameFromSlug(slug)

    // First find the classroom ID
    const { data: cls } = await supabase.from('classrooms').select('id').ilike('name', nameToSearch).single()
    if (!cls) throw new Error('Classroom not found')

    const { error } = await supabase
      .from('classrooms')
      .delete()
      .eq('id', cls.id)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server Error' }, { status: 500 })
  }
}
