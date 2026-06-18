import { createClient } from '@/lib/supabase/server'
import { compare } from 'bcryptjs'
import { SignJWT } from 'jose'
import { NextRequest, NextResponse } from 'next/server'

const JWT_SECRET = process.env.JWT_SECRET!

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email dan password wajib diisi.' },
        { status: 400 }
      )
    }

    // Query admin from public.admins table
    const supabase = await createClient()
    const { data: admin, error: dbError } = await supabase
      .from('admins')
      .select('id, name, email, password, role, is_active')
      .eq('email', email.toLowerCase().trim())
      .single()

    if (dbError || !admin) {
      return NextResponse.json(
        { error: 'Email atau password salah.' },
        { status: 401 }
      )
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

    // Create JWT session token (7 days expiry)
    const secret = new TextEncoder().encode(JWT_SECRET)
    const token = await new SignJWT({
      sub: admin.id,
      email: admin.email,
      name: admin.name,
      role: admin.role,
    })
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

    response.cookies.set('admin_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
      path: '/',
    })

    return response
  } catch (err) {
    console.error('Login error:', err)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server. Coba lagi nanti.' },
      { status: 500 }
    )
  }
}
