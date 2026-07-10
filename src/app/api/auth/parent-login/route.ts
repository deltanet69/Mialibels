import { SignJWT } from 'jose'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'

const JWT_SECRET = process.env.JWT_SECRET!

// Use service role to bypass RLS for authentication
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { persistSession: false } }
)

export async function POST(request: NextRequest) {
  try {
    const { nis, password } = await request.json()

    if (!nis || !password) {
      return NextResponse.json(
        { error: 'NISN/NIS dan Password wajib diisi.' },
        { status: 400 }
      )
    }

    const nisTrimmed = nis.trim()

    // 1. Try by student_number (NIS internal, e.g. "2026001")
    let { data: student } = await supabase
      .from('students')
      .select('id, name, student_number, nisn, parent_name, parent_password, class, is_active')
      .eq('student_number', nisTrimmed)
      .maybeSingle()

    // 2. Fallback: try by nisn (NISN national, e.g. "0123456701")
    if (!student) {
      const { data: byNisn } = await supabase
        .from('students')
        .select('id, name, student_number, nisn, parent_name, parent_password, class, is_active')
        .eq('nisn', nisTrimmed)
        .maybeSingle()
      student = byNisn
    }

    if (!student) {
      return NextResponse.json(
        { error: 'NISN/NIS tidak ditemukan dalam sistem.' },
        { status: 401 }
      )
    }

    if (!student.is_active) {
      return NextResponse.json(
        { error: 'Akun siswa sudah dinonaktifkan. Silakan hubungi admin.' },
        { status: 403 }
      )
    }

    // Verify password
    let isPasswordValid = false
    if (student.parent_password) {
      isPasswordValid = await bcrypt.compare(password, student.parent_password)
    } else {
      // Default password for all parents without custom password
      isPasswordValid = password === 'mialibels15'
    }

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Password salah.' },
        { status: 401 }
      )
    }

    // Create JWT session with both NIS and NISN for fallback
    const secret = new TextEncoder().encode(JWT_SECRET)
    const token = await new SignJWT({
      sub: student.id,                  // UUID — primary lookup key
      nis: student.student_number,       // NIS internal (2026001)
      nisn: student.nisn,               // NISN national (0123456701)
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
        nisn: student.nisn,
        studentName: student.name,
        parentName: student.parent_name,
        role: 'parent',
      },
    })

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
