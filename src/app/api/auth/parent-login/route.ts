import { SignJWT } from 'jose'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'
import { checkRateLimit, getIp } from '@/lib/rate-limit'

const JWT_SECRET = process.env.JWT_SECRET!

// Use service role to bypass RLS for authentication
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { persistSession: false } }
)

export async function POST(request: NextRequest) {
  try {
    const ip = getIp(request)
    const { success } = checkRateLimit(ip, 5, 60 * 1000) // 5x per menit
    
    if (!success) {
      return NextResponse.json(
        { error: 'Terlalu banyak percobaan login. Silakan coba lagi nanti.' },
        { status: 429 }
      )
    }

    const { nis, password } = await request.json()

    if (!nis || !password) {
      return NextResponse.json(
        { error: 'ID Siswa dan Password wajib diisi.' },
        { status: 400 }
      )
    }

    // Normalize: trim and uppercase (since ID Siswa is like 01A2026001)
    const nisTrimmed = nis.trim().toUpperCase()

    // 1. Try by student_number (ID Unik Siswa, e.g. "01A2026001")
    let { data: student } = await supabase
      .from('students')
      .select('id, name, student_number, nisn, parent_name, parent_password, class, is_active')
      .ilike('student_number', nisTrimmed)
      .maybeSingle()

    // 2. Fallback: try by nisn (NISN national, e.g. "0123456701")
    if (!student) {
      const { data: byNisn } = await supabase
        .from('students')
        .select('id, name, student_number, nisn, parent_name, parent_password, class, is_active')
        .eq('nisn', nis.trim()) // NISN is numeric, keep original case
        .maybeSingle()
      student = byNisn
    }

    if (!student) {
      return NextResponse.json(
        { error: 'ID Siswa tidak ditemukan. Hubungi pihak sekolah untuk mendapatkan ID Siswa Anda.' },
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

    const isDefaultPassword = !student.parent_password

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
      isDefaultPassword,
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
        isDefaultPassword,
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
