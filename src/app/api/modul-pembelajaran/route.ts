import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getSession } from '@/lib/session'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const subject = searchParams.get('subject') || ''
    const grade = searchParams.get('grade') || ''
    const semester = searchParams.get('semester') || ''
    const status = searchParams.get('status') || ''

    let query = supabase
      .from('learning_modules')
      .select('*, admins:created_by (name)')
      .order('created_at', { ascending: false })

    // Role-based visibility
    if (session.role === 'guru') {
      // Guru sees their own OR published modules
      query = query.or(`created_by.eq.${session.id},status.eq.Published`)
    }

    // Apply filters
    if (search) {
      query = query.ilike('title', `%${search}%`)
    }
    if (subject) {
      query = query.eq('subject', subject)
    }
    if (grade) {
      query = query.eq('grade', grade)
    }
    if (semester) {
      query = query.eq('semester', semester)
    }
    if (status) {
      query = query.eq('status', status)
    }

    const { data, error } = await query

    if (error) throw error

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error('Error fetching learning modules:', error)
    return NextResponse.json({ error: error.message || 'Server Error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    
    // Server-side validation
    if (!body.title || !body.subject || !body.grade || !body.phase) {
      return NextResponse.json({ error: 'Informasi Dasar (Judul, Mapel, Kelas, Fase) wajib diisi.' }, { status: 400 })
    }

    // Prepare payload
    const payload = {
      title: body.title,
      subject: body.subject,
      grade: body.grade,
      semester: body.semester,
      phase: body.phase,
      status: body.status || 'Draft',
      
      learning_outcomes: body.learning_outcomes || null,
      learning_objectives: body.learning_objectives || [],
      learning_flow: body.learning_flow || null,
      
      core_materials: body.core_materials || [],
      teaching_method: body.teaching_method || null,
      
      assessment_diagnostic: body.assessment_diagnostic || null,
      assessment_formative: body.assessment_formative || null,
      assessment_summative: body.assessment_summative || null,
      teacher_reflection: body.teacher_reflection || null,
      student_reflection: body.student_reflection || null,
      
      attachment_url: body.attachment_url || null,
      created_by: session.id, // Current user
    }

    const { data, error } = await supabase
      .from('learning_modules')
      .insert(payload)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error('Error creating learning module:', error)
    return NextResponse.json({ error: error.message || 'Server Error' }, { status: 500 })
  }
}
