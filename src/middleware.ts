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

  const isParentPath = pathname.startsWith('/parent/')
  const isParentLoginPage = pathname === '/parent/login'

  // Get user session from cookie
  const token = request.cookies.get('admin_session')?.value
  const parentToken = request.cookies.get('parent_session')?.value
  
  let user: any = null
  let parentUser: any = null

  if (token && JWT_SECRET) {
    try {
      const secret = new TextEncoder().encode(JWT_SECRET)
      const { payload } = await jwtVerify(token, secret)
      user = payload
    } catch (err) {
      user = null
    }
  }

  if (parentToken && JWT_SECRET) {
    try {
      const secret = new TextEncoder().encode(JWT_SECRET)
      const { payload } = await jwtVerify(parentToken, secret)
      parentUser = payload
    } catch (err) {
      parentUser = null
    }
  }

  // Guard Parent paths
  if (isParentPath && !isParentLoginPage) {
    if (!parentUser) {
      const url = request.nextUrl.clone()
      url.pathname = '/parent/login'
      return NextResponse.redirect(url)
    }
  }

  if (isParentLoginPage && parentUser) {
    return NextResponse.redirect(new URL('/parent/dashboard', request.url))
  }

  // Guard protected admin paths
  if (isProtectedPath) {
    if (!user) {
      // Not logged in -> redirect to login
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }

    const role = user.role // 'superadmin', 'kepsek', 'guru', 'staff'

    // RBAC validation
    const isSuperOrKepsek = role === 'superadmin' || role === 'kepsek'

    // Guru & Staff cannot access Users, Finance, Reports
    if (pathname.startsWith('/users') && role !== 'superadmin') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    
    if (pathname.startsWith('/finance') && !isSuperOrKepsek) {
      // Temporary fallback for bendahara if still needed, but per new RBAC, superadmin & kepsek have access
      if (role !== 'bendahara') {
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }
    }

    if (pathname.startsWith('/reports') && !isSuperOrKepsek) {
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

