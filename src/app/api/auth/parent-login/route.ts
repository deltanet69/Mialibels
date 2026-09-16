import { SignJWT } from 'jose'
import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { getAdminSupabase } from '@/lib/supabase'
import { getJwtSecretKey, getAuthCookieOptions } from '@/lib/jwt'
import { checkRateLimit, getIp } from '@/lib/rate-limit'

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

    const supabase = getAdminSupabase()

    // Normalize: trim and uppercase (since ID Siswa is like 01A2026001)
    const nisTrimmed = nis.trim().toUpperCase()
    const nisRaw = nis.trim()

    // 1. Try by student_number (ID Unik Siswa, e.g. "01A2026001")
    let { data: student } = await supabase
      .from('students')
      .select('id, name, student_number, nisn, parent_name, parent_password, class, is_active')
      .ilike('student_number', nisTrimmed)
      .maybeSingle()

    // 2. Fallback: try by nisn (NISN national, e.g. "8686821381")
    if (!student) {
      const { data: byNisn } = await supabase
        .from('students')
        .select('id, name, student_number, nisn, parent_name, parent_password, class, is_active')
        .ilike('nisn', nisRaw)
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
    const secret = getJwtSecretKey()
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

    const cookieOptions = getAuthCookieOptions(request, 30 * 24 * 60 * 60)
    response.cookies.set('parent_session', token, cookieOptions)

    return response
  } catch (err: any) {
    console.error('Parent Login error:', err)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server.' },
      { status: 500 }
    )
  }
}
