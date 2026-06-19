import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

const JWT_SECRET = process.env.JWT_SECRET!

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Define admin paths to protect
  const protectedPrefixes = [
    '/dashboard',
    '/guru',
    '/students',
    '/classroom',
    '/attendance',
    '/finance',
    '/content',
    '/reports',
    '/users'
  ]
  
  const isProtectedPath = protectedPrefixes.some(prefix => pathname === prefix || pathname.startsWith(prefix + '/'))
  const isLoginPage = pathname === '/login'

  // Get user session from cookie
  const token = request.cookies.get('admin_session')?.value
  let user: any = null

  if (token && JWT_SECRET) {
    try {
      const secret = new TextEncoder().encode(JWT_SECRET)
      const { payload } = await jwtVerify(token, secret)
      user = payload
    } catch (err) {
      // Invalid token
      user = null
    }
  }

  // Guard protected paths
  if (isProtectedPath) {
    if (!user) {
      // Not logged in -> redirect to login
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }

    const role = user.role // 'superadmin', 'admin', 'bendahara', 'kepsek'

    // RBAC validation
    if (pathname.startsWith('/users') && role !== 'superadmin') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    
    if (pathname.startsWith('/finance') && role !== 'superadmin' && role !== 'bendahara') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    if (pathname.startsWith('/content') && role !== 'superadmin' && role !== 'admin') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    if (pathname.startsWith('/reports') && role !== 'superadmin' && role !== 'kepsek') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  // If user is already logged in and tries to access /login, redirect to /dashboard
  if (isLoginPage && user) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|images|.*\\..*).*)',
  ],
}

