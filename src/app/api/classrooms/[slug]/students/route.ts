import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

const getNameFromSlug = (slug: string) => {
  return slug.replace(/^kelas-/i, '').replace(/-/g, ' ').trim().toUpperCase()
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params
    const nameToSearch = getNameFromSlug(slug)

    // First find the classroom ID
    const { data: cls } = await supabase.from('classrooms').select('id').ilike('name', nameToSearch).single()
    if (!cls) throw new Error('Classroom not found')

    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('class_id', cls.id)
      .order('name', { ascending: true })

    if (error) throw error
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server Error' }, { status: 500 })
  }
}

// Digunakan untuk meng-assign siswa ke kelas
export async function POST(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params
    const nameToSearch = getNameFromSlug(slug)
    const body = await request.json()
    const { studentId } = body
    
    // First find the classroom ID
    const { data: cls } = await supabase.from('classrooms').select('id').ilike('name', nameToSearch).single()
    if (!cls) throw new Error('Classroom not found')

    const { error } = await supabase
      .from('students')
      .update({ class_id: cls.id })
      .eq('id', studentId)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server Error' }, { status: 500 })
  }
}
