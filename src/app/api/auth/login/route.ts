import { compare } from 'bcryptjs'
import { SignJWT } from 'jose'
import { NextRequest, NextResponse } from 'next/server'
import { getAdminSupabase } from '@/lib/supabase'
import { checkRateLimit, getIp } from '@/lib/rate-limit'
import { getJwtSecretKey, getAuthCookieOptions } from '@/lib/jwt'

export async function POST(request: NextRequest) {
  try {
    const supabase = getAdminSupabase()
    const ip = getIp(request)
    const { success } = checkRateLimit(ip, 5, 60 * 1000) // 5x per menit
    
    if (!success) {
      return NextResponse.json(
        { error: 'Terlalu banyak percobaan login. Silakan coba lagi nanti.' },
        { status: 429 }
      )
    }

    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email dan password wajib diisi.' },
        { status: 400 }
      )
    }

    // Query admin from public.admins table using direct supabase client
    const { data: admin, error: dbError } = await supabase
      .from('admins')
      .select('id, name, email, password, role, is_active')
      .eq('email', email.toLowerCase().trim())
      .single()

    if (dbError || !admin) {
      // Fallback: Check if it's a student (Parent Login)
      const nisTrimmed = email.trim().toUpperCase()
      const nisRaw = email.trim()

      let { data: student } = await supabase
        .from('students')
        .select('id, name, student_number, nisn, parent_name, parent_password, class, is_active')
        .ilike('student_number', nisTrimmed)
        .maybeSingle()

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
          { error: 'Email atau Username salah.' },
          { status: 401 }
        )
      }

      if (!student.is_active) {
        return NextResponse.json(
          { error: 'Akun siswa sudah dinonaktifkan. Silakan hubungi admin.' },
          { status: 403 }
        )
      }

      // Verify parent password
      let isParentPasswordValid = false
      if (student.parent_password) {
        isParentPasswordValid = await compare(password, student.parent_password)
      } else {
        isParentPasswordValid = password === 'mialibels15'
      }

      if (!isParentPasswordValid) {
        return NextResponse.json(
          { error: 'Password salah.' },
          { status: 401 }
        )
      }

      const isDefaultPassword = !student.parent_password
      const secret = getJwtSecretKey()
      const parentToken = await new SignJWT({
        sub: student.id,
        nis: student.student_number,
        nisn: student.nisn,
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
          id: student.id,
          email: student.student_number,
          name: student.name,
          role: 'parent',
        },
      })

      const cookieOptions = getAuthCookieOptions(request, 30 * 24 * 60 * 60)
      response.cookies.set('parent_session', parentToken, cookieOptions)

      return response
    }

    if (!admin.is_active) {
      return NextResponse.json(
        { error: 'Akun Anda sudah dinonaktifkan. Hubungi superadmin.' },
        { status: 403 }
      )
    }

    // Verify bcrypt password
    const isPasswordValid = await compare(password, admin.password)
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Email atau password salah.' },
        { status: 401 }
      )
    }

    // For guru/staff roles, lookup staffId to embed in JWT for profile resolution
    let staffId: string | null = null;
    const roleLower = (admin.role || '').toLowerCase();
    if (roleLower === 'guru' || roleLower === 'staff' || roleLower.includes('guru')) {
      // Try email match (case-insensitive)
      const { data: staffByEmail } = await supabase
        .from('staffs')
        .select('id')
        .ilike('email', admin.email)
        .maybeSingle();
      
      if (staffByEmail) {
        staffId = (staffByEmail as any).id;
      } else {
        // Fallback: match by name
        const { data: staffByName } = await supabase
          .from('staffs')
          .select('id')
          .ilike('name', admin.name)
          .maybeSingle();
        if (staffByName) staffId = (staffByName as any).id;
      }
    }

    // Create JWT session token (7 days expiry)
    const secret = getJwtSecretKey()
    const jwtPayload: Record<string, any> = {
      sub: admin.id,
      email: admin.email,
      name: admin.name,
      role: admin.role,
    }
    if (staffId) jwtPayload.staffId = staffId;

    const token = await new SignJWT(jwtPayload)
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d')
      .sign(secret)

    // Set session cookie
    const response = NextResponse.json({
      success: true,
      user: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
      },
    })

    const cookieOptions = getAuthCookieOptions(request, 7 * 24 * 60 * 60)
    response.cookies.set('admin_session', token, cookieOptions)

    return response
  } catch (err: any) {
    console.error('Login error:', err?.message, err?.stack)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server: ' + (err?.message || 'Unknown error') },
      { status: 500 }
    )
  }
}
