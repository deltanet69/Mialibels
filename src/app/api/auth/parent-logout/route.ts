import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const loginUrl = new URL('/parent/login', request.url)
  const response = NextResponse.redirect(loginUrl)
  
  // Clear parent session cookie
  response.cookies.set('parent_session', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  })

  return response
}
