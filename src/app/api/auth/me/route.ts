import { NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { supabase } from '@/lib/supabase'
import { getJwtSecretKey } from '@/lib/jwt'

export async function GET() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('admin_session')?.value

    if (!token) {
      return NextResponse.json({ user: null }, { status: 401 })
    }

    const { payload } = await jwtVerify(token, getJwtSecretKey())

    let staffId = null
    if (payload.email) {
      const { data: staff } = await supabase.from('staffs').select('id').eq('email', payload.email as string).maybeSingle()
      if (staff) staffId = (staff as any).id
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
