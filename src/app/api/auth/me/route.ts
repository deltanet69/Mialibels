import { NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { supabase } from '@/lib/supabase'

const JWT_SECRET = process.env.JWT_SECRET!

export async function GET() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('admin_session')?.value

    if (!token) {
      return NextResponse.json({ user: null }, { status: 401 })
    }

    const secret = new TextEncoder().encode(JWT_SECRET)
    const { payload } = await jwtVerify(token, secret)

    let staffId = null
    if (payload.email) {
      const { data: staff } = await supabase.from('staffs').select('id').eq('email', payload.email).single()
      if (staff) staffId = staff.id
    }

    const res = NextResponse.json({
      success: true,
      user: {
        id: payload.sub,
        email: payload.email,
        name: payload.name,
        role: payload.role,
        staffId: staffId,
      },
    })
    // Cache response di browser selama 30 detik — valid karena JWT sudah di-verify
    res.headers.set('Cache-Control', 'private, max-age=30')
    return res
  } catch {
    return NextResponse.json({ user: null }, { status: 401 })
  }
}
