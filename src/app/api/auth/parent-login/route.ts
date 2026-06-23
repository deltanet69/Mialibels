import { SignJWT } from 'jose'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'

const JWT_SECRET = process.env.JWT_SECRET!

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { nis, password } = await request.json()

    if (!nis || !password) {
      return NextResponse.json(
        { error: 'NISN dan Password wajib diisi.' },
        { status: 400 }
      )
    }

    // Authenticate parent by checking students table
    const { data: student, error: dbError } = await supabase
      .from('students')
      .select('id, name, student_number, parent_name, parent_password, class, is_active')
      .eq('student_number', nis.trim())
      .single()

    if (dbError || !student) {
      return NextResponse.json(
        { error: 'NISN salah atau siswa tidak ditemukan.' },
        { status: 401 }
      )
    }

    let isPasswordValid = false;
    if (student.parent_password) {
      isPasswordValid = await bcrypt.compare(password, student.parent_password)
    } else {
      isPasswordValid = password === 'mialibels15'
    }

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Password salah.' },
        { status: 401 }
      )
    }

    if (!student.is_active) {
      return NextResponse.json(
        { error: 'Akun siswa sudah dinonaktifkan. Silakan hubungi admin.' },
        { status: 403 }
      )
    }

    // Create JWT session token for parent
    const secret = new TextEncoder().encode(JWT_SECRET)
    const token = await new SignJWT({
      sub: student.id, // student id as subject
      nis: student.student_number,
      studentName: student.name,
      parentName: student.parent_name,
      class: student.class,
      role: 'parent',
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('30d')
      .sign(secret)

    const response = NextResponse.json({
      success: true,
      user: {
        studentId: student.id,
        nis: student.student_number,
        studentName: student.name,
        parentName: student.parent_name,
        role: 'parent',
      },
    })

    // Set parent session cookie
    response.cookies.set('parent_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: '/',
    })

    return response
  } catch (err: any) {
    console.error('Parent Login error:', err)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server.' },
      { status: 500 }
    )
  }
}
