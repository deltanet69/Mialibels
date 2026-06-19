import { compare } from 'bcryptjs'
import { SignJWT } from 'jose'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const JWT_SECRET = process.env.JWT_SECRET!

// Use supabase-js directly (not the SSR client that needs cookies)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(request: NextRequest) {
  try {
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
      console.error('DB query error:', dbError?.message, dbError?.code)
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
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    })

    return response
  } catch (err: any) {
    console.error('Login error:', err?.message, err?.stack)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server: ' + (err?.message || 'Unknown error') },
      { status: 500 }
    )
  }
}
