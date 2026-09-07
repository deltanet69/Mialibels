import { SignJWT, jwtVerify } from 'jose'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'
import { getJwtSecretKey, getAuthCookieOptions } from '@/lib/jwt'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { persistSession: false } }
)

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('parent_session')?.value
    if (!token) return NextResponse.json({ error: 'Tidak memiliki akses.' }, { status: 401 })

    const secret = getJwtSecretKey()
    let payload: any
    try {
      const verified = await jwtVerify(token, secret)
      payload = verified.payload
    } catch {
      return NextResponse.json({ error: 'Sesi tidak valid atau telah berakhir.' }, { status: 401 })
    }

    const { newPassword } = await request.json()

    if (!newPassword || newPassword.length < 6) {
      return NextResponse.json(
        { error: 'Password baru minimal 6 karakter.' },
        { status: 400 }
      )
    }

    if (newPassword === 'mialibels15') {
      return NextResponse.json(
        { error: 'Tidak boleh menggunakan password default.' },
        { status: 400 }
      )
    }

    const studentId = payload.sub
    if (!studentId) {
      return NextResponse.json({ error: 'Data siswa tidak valid.' }, { status: 400 })
    }

    // Hash the new password
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(newPassword, salt)

    // Update in database
    const { error: updateError } = await supabase
      .from('students')
      .update({ parent_password: hashedPassword })
      .eq('id', studentId)

    if (updateError) throw updateError

    // Re-issue JWT token without the isDefaultPassword flag
    const newToken = await new SignJWT({
      sub: payload.sub,
      nis: payload.nis,
      nisn: payload.nisn,
      studentName: payload.studentName,
      parentName: payload.parentName,
      class: payload.class,
      role: 'parent',
      isDefaultPassword: false, // Updated
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('30d')
      .sign(secret)

    const response = NextResponse.json({ success: true })
    const cookieOptions = getAuthCookieOptions(request, 30 * 24 * 60 * 60)
    response.cookies.set('parent_session', newToken, cookieOptions)

    return response
  } catch (err: any) {
    console.error('Parent change password error:', err)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server.' },
      { status: 500 }
    )
  }
}
