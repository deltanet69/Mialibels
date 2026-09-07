import { NextRequest, NextResponse } from 'next/server'
import { getLogoutCookieOptions } from '@/lib/jwt'

export async function GET(request: NextRequest) {
  const loginUrl = new URL('/parent/login', request.url)
  const response = NextResponse.redirect(loginUrl)
  const cookieOptions = getLogoutCookieOptions(request)
  
  // Clear parent session cookie with domain
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

export async function POST(request: NextRequest) {
  const response = NextResponse.json({ success: true })
  const cookieOptions = getLogoutCookieOptions(request)
  
  // Clear parent session cookie with domain
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
