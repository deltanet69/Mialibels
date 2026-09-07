import { NextRequest, NextResponse } from 'next/server'
import { getLogoutCookieOptions } from '@/lib/jwt'

export async function POST(request: NextRequest) {
  const response = NextResponse.json({ success: true })
  const cookieOptions = getLogoutCookieOptions(request)
  
  // Clear the admin session cookie with dynamic domain
  response.cookies.set('admin_session', '', cookieOptions)
  // Also clear host-only cookie fallback
  response.cookies.set('admin_session', '', {
    httpOnly: true,
    secure: cookieOptions.secure,
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  })

  // Clear the parent session cookie with dynamic domain
  response.cookies.set('parent_session', '', cookieOptions)
  // Also clear host-only cookie fallback
  response.cookies.set('parent_session', '', {
    httpOnly: true,
    secure: cookieOptions.secure,
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  })

  return response
}
