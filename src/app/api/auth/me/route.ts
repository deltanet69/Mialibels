import { NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import { cookies } from 'next/headers'

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

    return NextResponse.json({
      user: {
        id: payload.sub,
        email: payload.email,
        name: payload.name,
        role: payload.role,
      },
    })
  } catch {
    return NextResponse.json({ user: null }, { status: 401 })
  }
}
