import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

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

  // Create a response to modify headers/cookies
  let response = NextResponse.next({
    request,
  })

  // Initialize Supabase client
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Get user session
  const { data: { user } } = await supabase.auth.getUser()

  // Guard protected paths
  if (isProtectedPath) {
    if (!user) {
      // Not logged in -> redirect to login
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }

    // Retrieve user role from admins table
    const { data: admin } = await supabase
      .from('admins')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!admin) {
      // User is authenticated but has no admin profile -> sign out and redirect to login
      await supabase.auth.signOut()
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }

    const role = admin.role // 'superadmin', 'admin', 'bendahara', 'kepsek'

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

  return response
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|images|.*\\..*).*)',
  ],
}

